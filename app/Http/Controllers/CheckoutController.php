<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use App\Services\CurrencyService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;
use PayOS\PayOS;
use Srmklive\PayPal\Services\PayPal as PayPalClient;

/**
 * Handles the One-Page Checkout (OPC) flow for subscription plan purchases.
 *
 * Supports two payment gateways:
 *  - PayOS  (VietQR domestic bank transfer)  → redirects to /order/{code} QR page
 *  - PayPal (international credit/debit)     → redirects to PayPal approval URL
 *
 * Authentication is performed via a JWT token written into a hidden form
 * field by the React SPA, allowing standard HTML form POSTs to authenticate
 * against the JWT API guard.
 *
 * Routes (defined in web.php):
 *   GET  /checkout                   — show OPC page
 *   POST /checkout                   — process order (PayOS or PayPal)
 *   GET  /checkout/paypal/capture    — capture PayPal order after buyer approval
 *   GET  /checkout/paypal/cancel     — handle PayPal cancellation
 *   GET  /checkout/complete          — clear cart after confirmed payment, redirect to success
 *   GET  /order/{order_code}         — QR countdown page (PayOS orders)
 *
 * Cart session keying:
 *   Every method calls \Cart::session(session()->getId()) before any cart
 *   operation. With the DB storage driver this scopes all reads/writes to
 *   the current PHP session's unique ID, giving each user their own cart
 *   rows in the `shopping_cart` table — exactly as PHP session storage did,
 *   but now durable across PHP restarts.
 *
 * Cart lifecycle:
 *   The cart (and cart_coupon session key) is intentionally NOT cleared at
 *   order creation time. It is cleared only when payment is actually confirmed:
 *     - PayPal: in paypalCapture() on COMPLETED status.
 *     - PayOS webhook: in PayOSPaymentController::handleCartOrder() on code "00".
 *     - PayOS polling: the order page JS polls for 'paid' then redirects to
 *       /checkout/complete, which also clears the cart as a safety net.
 *   This allows the user to navigate back to /checkout at any time without
 *   losing their selected plan and coupon.
 *
 * Stale-order logic (improved from the previous time-window heuristic):
 *   Rather than cancelling ALL pending orders created within the last 5 minutes
 *   for the user, store() now cancels only orders that share the same
 *   `cart_session_key` as the current request. This ties cancellation to the
 *   specific database-cart instance rather than a wall-clock window, matching
 *   the Magento Quote→Order supersession model.
 */
class CheckoutController extends Controller
{
    public function __construct(private readonly CurrencyService $currencyService)
    {
    }

    // ── Public route handlers ─────────────────────────────────────────────

    /**
     * Show the One-Page Checkout.
     *
     * Optionally loads a plan into the cart from the `?plan=` query parameter.
     * Detects the visitor's currency via CurrencyService and pre-selects the
     * appropriate payment gateway (PayOS for VND, PayPal for USD).
     * Redirects to /pricing if the cart is empty after that.
     *
     * GET /checkout[?plan=monthly|yearly]
     */
    public function index(Request $request, CurrencyService $currencyService): View|RedirectResponse
    {
        \Cart::session(session()->getId());

        $plan = $request->query('plan');

        if (in_array($plan, ['monthly', 'yearly'], true)) {
            $this->addPlanToCart($plan);
        }

        $cartItems = \Cart::getContent();
        $subTotal  = \Cart::getSubTotal();
        $total     = \Cart::getTotal();
        $coupon    = session('cart_coupon');

        if ($cartItems->isEmpty()) {
            return redirect('/pricing')->with('info', 'Vui lòng chọn gói dịch vụ trước.');
        }

        $paypalMode    = config('paypal.mode', 'sandbox');
        $paypalEnabled = ! empty(config("paypal.{$paypalMode}.client_id"));

        $currency       = $currencyService->detectUserCurrency($request);
        $defaultGateway = $currencyService->defaultGateway($currency);

        $totalUsd = null;
        if ($currency === 'USD' && ! $cartItems->isEmpty()) {
            $planKey  = $cartItems->first()->attributes['plan'];
            $totalUsd = config("paypal.plans.{$planKey}.amount_usd");
        }

        return view('checkout', compact(
            'cartItems', 'subTotal', 'total', 'coupon',
            'paypalEnabled', 'currency', 'defaultGateway', 'totalUsd'
        ));
    }

    /**
     * Process the OPC form submission.
     *
     * Authenticates the user via `_jwt_token`, reads the DB-backed cart,
     * determines the selected `gateway`, cancels any existing pending order
     * that was created from the same DB-cart session, then delegates to
     * processPayOS() or processPayPal().
     *
     * POST /checkout
     */
    public function store(Request $request): RedirectResponse
    {
        // ── 1. Authenticate via JWT ──────────────────────────────────────
        $token = $request->input('_jwt_token');

        if (! $token) {
            return redirect('/SignIn?redirect_to=/checkout')
                ->with('error', 'Vui lòng đăng nhập để tiếp tục.');
        }

        try {
            $user = auth('api')->setToken($token)->authenticate();
        } catch (\Exception $e) {
            return redirect('/SignIn?redirect_to=/checkout')
                ->with('error', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }

        if (! $user) {
            return redirect('/SignIn?redirect_to=/checkout');
        }

        // ── 2. Bind cart to this PHP session ─────────────────────────────
        // The session ID is the cart's DB key prefix.  Setting it explicitly
        // ensures every \Cart::* call below reads the correct rows even if
        // the singleton's default key has been changed by a previous request.
        $cartSessionKey = session()->getId();
        \Cart::session($cartSessionKey);

        // Associate the shopping_cart rows with this user so they can be
        // queried or cleaned up by user_id (e.g. an admin purge, or a future
        // "restore cart" feature after session expiry).
        DB::table('shopping_cart')
            ->where('cart_key', 'LIKE', $cartSessionKey . '%')
            ->whereNull('user_id')
            ->update(['user_id' => $user->id]);

        // ── 3. Read cart ─────────────────────────────────────────────────
        $cartItems = \Cart::getContent();

        if ($cartItems->isEmpty()) {
            return redirect('/pricing')->with('error', 'Giỏ hàng trống. Vui lòng chọn gói dịch vụ.');
        }

        $cartItem  = $cartItems->first();
        $plan      = $cartItem->attributes['plan'];
        $subTotal  = (int) \Cart::getSubTotal();
        $total     = (int) \Cart::getTotal();
        $discount  = max(0, $subTotal - $total);
        $coupon    = session('cart_coupon.code');

        $gateway   = in_array($request->input('gateway'), ['payos', 'paypal'], true)
                     ? $request->input('gateway')
                     : 'payos';

        // ── 4. Cancel any pending order linked to this exact DB cart ─────
        // If the user went back to /checkout and resubmitted before paying,
        // the old pending order for this cart session is superseded.
        // This replaces the previous time-window heuristic (last 5 minutes)
        // with a proper cart-identity check: only orders whose
        // `cart_session_key` matches the current PHP session are cancelled.
        $stalePending = Order::where('user_id', $user->id)
                             ->where('status', 'pending')
                             ->where('cart_session_key', $cartSessionKey)
                             ->get();

        foreach ($stalePending as $staleOrder) {
            $staleOrder->update(['status' => 'cancelled']);
            Log::channel('single')->info('Cancelled superseded pending order (cart resubmit)', [
                'replaced_order_code' => $staleOrder->order_code,
                'cart_session_key'    => $cartSessionKey,
                'user_id'             => $user->id,
            ]);
        }

        $orderCode = (int) (time() . rand(10, 99));

        // ── 5. Route to gateway ──────────────────────────────────────────
        if ($gateway === 'paypal') {
            return $this->processPayPal($user, $plan, $total, $discount, $coupon, $orderCode, $cartSessionKey);
        }

        return $this->processPayOS($user, $plan, $total, $discount, $coupon, $orderCode, $cartSessionKey);
    }

    /**
     * Capture a PayPal order after the buyer approves it on PayPal's site.
     *
     * PayPal redirects here with `?token=<PayPal_Order_ID>`. We capture
     * the payment, mark the order paid, clear the DB cart, and activate
     * the subscription.
     *
     * GET /checkout/paypal/capture
     */
    public function paypalCapture(Request $request): RedirectResponse
    {
        $paypalToken = $request->query('token');

        if (! $paypalToken) {
            return redirect('/pricing?payment=error');
        }

        $order = Order::where('payment_reference', $paypalToken)
                      ->where('gateway', 'paypal')
                      ->where('status', 'pending')
                      ->first();

        if (! $order) {
            Log::channel('single')->warning('PayPal capture: order not found', [
                'token' => $paypalToken,
            ]);
            return redirect('/pricing?payment=error');
        }

        try {
            $provider = new PayPalClient;
            $provider->setApiCredentials(config('paypal'));
            $provider->getAccessToken();
            $response = $provider->capturePaymentOrder($paypalToken);

            if (($response['status'] ?? '') === 'COMPLETED') {
                $this->activateSubscription($order->user, $order->plan);
                $order->update(['status' => 'paid']);

                // Payment confirmed — clear the DB cart.
                // Use the cart_session_key stored on the order so the right
                // rows are targeted even if the session ID has changed.
                $this->clearCartBySessionKey($order->cart_session_key);
                session()->forget('cart_coupon');

                $order->load('user');
                session()->flash('thank_you', $this->buildThankYouPayload($order));

                Log::channel('single')->info('PayPal capture: order paid', [
                    'user_id'    => $order->user_id,
                    'plan'       => $order->plan,
                    'order_code' => $order->order_code,
                ]);

                return redirect('/checkout/thank-you');
            }

            Log::channel('single')->warning('PayPal capture: unexpected status', [
                'status' => $response['status'] ?? 'unknown',
            ]);
        } catch (\Exception $e) {
            Log::channel('single')->error('PayPal capture exception', [
                'error' => $e->getMessage(),
                'token' => $paypalToken,
            ]);
        }

        $order->update(['status' => 'expired']);
        return redirect('/pricing?payment=error');
    }

    /**
     * Handle PayPal cancellation (buyer clicked "Cancel" on PayPal's page).
     *
     * Marks the pending order as expired and redirects back to the checkout
     * page so the buyer can choose a different payment method.
     *
     * GET /checkout/paypal/cancel
     */
    public function paypalCancel(Request $request): RedirectResponse
    {
        $paypalToken = $request->query('token');

        if ($paypalToken) {
            Order::where('payment_reference', $paypalToken)
                 ->where('gateway', 'paypal')
                 ->where('status', 'pending')
                 ->update(['status' => 'expired']);
        }

        return redirect('/checkout?payment=cancelled');
    }

    /**
     * Display the QR countdown page for a pending PayOS order.
     *
     * GET /order/{order_code}
     */
    public function show(string $orderCode): View|RedirectResponse
    {
        $order = Order::where('order_code', $orderCode)->firstOrFail();

        if ($order->status === 'pending' && $order->isExpired()) {
            $order->update(['status' => 'expired']);
        }

        return view('order', [
            'order'            => $order,
            'remainingSeconds' => $order->remainingSeconds(),
            'planLabel'        => config("payos.plans.{$order->plan}.label", $order->plan),
        ]);
    }

    /**
     * Clear the cart after a confirmed PayOS payment and redirect to the
     * Thank You page with flashed order details.
     *
     * The order page JS redirects here as:
     *   GET /checkout/complete?order={order_code}
     *
     * Clears the DB cart using the `cart_session_key` stored on the order
     * (preferred) or the current session ID (fallback). Also calls
     * \Cart::clear() via the session-scoped facade as an extra safety net.
     *
     * GET /checkout/complete
     */
    public function complete(Request $request): RedirectResponse
    {
        $orderCode = $request->query('order');
        $order     = null;

        if ($orderCode) {
            $order = Order::where('order_code', $orderCode)
                          ->where('status', 'paid')
                          ->with('user')
                          ->first();
        }

        // Clear DB cart — prefer the key stored on the order; fall back to
        // the current PHP session ID (covers the case where the user is still
        // in the same browser session that created the order).
        $keyToClear = $order?->cart_session_key ?? session()->getId();
        $this->clearCartBySessionKey($keyToClear);
        session()->forget('cart_coupon');

        if ($order) {
            session()->flash('thank_you', $this->buildThankYouPayload($order));
        }

        return redirect('/checkout/thank-you');
    }

    /**
     * Render the post-payment Thank You page.
     *
     * Order details are read from the `thank_you` session flash key set by
     * complete() or paypalCapture(). If the user refreshes the page (flash
     * is gone), a generic success screen is shown instead.
     *
     * GET /checkout/thank-you
     */
    public function thankYou(): View
    {
        $order = session('thank_you');

        return view('thank-you', compact('order'));
    }

    // ── Private helpers ───────────────────────────────────────────────────

    /**
     * Create a PayOS payment link, persist the order, and redirect to the
     * QR countdown page.
     *
     * @param  string  $cartSessionKey  PHP session ID of the originating cart.
     */
    private function processPayOS(
        User $user, string $plan, int $total, int $discount, ?string $coupon,
        int $orderCode, string $cartSessionKey
    ): RedirectResponse {
        $checkoutUrl = null;
        $qrCode      = null;
        $planConf    = config("payos.plans.{$plan}");

        try {
            $payOS = new PayOS(
                config('payos.client_id'),
                config('payos.api_key'),
                config('payos.checksum_key')
            );

            $response = $payOS->createPaymentLink([
                'orderCode'   => $orderCode,
                'amount'      => $total,
                'description' => $planConf['description'],
                'returnUrl'   => config('payos.return_url'),
                'cancelUrl'   => config('payos.cancel_url'),
                'buyerName'   => $user->name,
                'buyerEmail'  => $user->email,
            ]);

            $checkoutUrl = $response->checkoutUrl ?? null;
            $qrCode      = $response->qrCode      ?? null;
        } catch (\Exception $e) {
            Log::channel('single')->error('CheckoutController: PayOS createPaymentLink failed', [
                'user_id' => $user->id,
                'plan'    => $plan,
                'error'   => $e->getMessage(),
            ]);
        }

        Order::create([
            'user_id'           => $user->id,
            'cart_session_key'  => $cartSessionKey,
            'order_code'        => $orderCode,
            'plan'              => $plan,
            'total_amount'      => $total,
            'coupon_applied'    => $coupon,
            'discount_amount'   => $discount,
            'status'            => 'pending',
            'gateway'           => 'payos',
            'checkout_url'      => $checkoutUrl,
            'qr_code'           => $qrCode,
            'expires_at'        => now()->addMinutes(5),
        ]);

        // Cart is intentionally NOT cleared here. It is preserved so the user
        // can navigate back to /checkout without losing their plan/coupon.
        // The cart will be cleared by PayOSPaymentController::handleCartOrder()
        // on webhook confirmation, or by complete() if the order page JS
        // detects payment and redirects there first.

        Log::channel('single')->info('Order created (PayOS)', [
            'user_id'          => $user->id,
            'order_code'       => $orderCode,
            'plan'             => $plan,
            'total'            => $total,
            'cart_session_key' => $cartSessionKey,
        ]);

        return redirect('/order/' . $orderCode);
    }

    /**
     * Create a PayPal order, persist our Order row, and redirect the buyer
     * to PayPal's approval page.
     *
     * @param  string  $cartSessionKey  PHP session ID of the originating cart.
     */
    private function processPayPal(
        User $user, string $plan, int $total, int $discount, ?string $coupon,
        int $orderCode, string $cartSessionKey
    ): RedirectResponse {
        $liveRate  = $this->currencyService->getLiveUsdToVndRate();
        $amountUsd = number_format(round($total / $liveRate, 2), 2, '.', '');

        try {
            $provider = new PayPalClient;
            $provider->setApiCredentials(config('paypal'));
            $provider->getAccessToken();

            $planDescription = config("payos.plans.{$plan}.description", $plan);

            $response = $provider->createOrder([
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'reference_id' => (string) $orderCode,
                    'description'  => $planDescription,
                    'amount'       => [
                        'currency_code' => 'USD',
                        'value'         => $amountUsd,
                    ],
                ]],
                'application_context' => [
                    'brand_name'  => config('app.name', 'KenFinly'),
                    'cancel_url'  => url('/checkout/paypal/cancel'),
                    'return_url'  => url('/checkout/paypal/capture'),
                    'user_action' => 'PAY_NOW',
                ],
            ]);

            $approveLink   = collect($response['links'] ?? [])->firstWhere('rel', 'approve')['href'] ?? null;
            $paypalOrderId = $response['id'] ?? null;

            if (! $approveLink) {
                Log::channel('single')->error('PayPal: no approve link returned', [
                    'response' => $response,
                ]);
                return back()->with('error', 'Không thể kết nối PayPal. Vui lòng thử lại hoặc chọn VietQR.');
            }

            Order::create([
                'user_id'             => $user->id,
                'cart_session_key'    => $cartSessionKey,
                'order_code'          => $orderCode,
                'plan'                => $plan,
                'total_amount'        => $total,
                'coupon_applied'      => $coupon,
                'discount_amount'     => $discount,
                'exchange_rate_used'  => $liveRate,
                'status'              => 'pending',
                'gateway'             => 'paypal',
                'payment_reference'   => $paypalOrderId,
                'checkout_url'        => $approveLink,
                'qr_code'             => null,
                'expires_at'          => now()->addMinutes(30),
            ]);

            // Cart is intentionally NOT cleared here. It will be cleared in
            // paypalCapture() when PayPal confirms COMPLETED status.

            Log::channel('single')->info('Order created (PayPal)', [
                'user_id'          => $user->id,
                'order_code'       => $orderCode,
                'plan'             => $plan,
                'paypal_order_id'  => $paypalOrderId,
                'amount_usd'       => $amountUsd,
                'exchange_rate'    => $liveRate,
                'cart_session_key' => $cartSessionKey,
            ]);

            return redirect($approveLink);

        } catch (\Exception $e) {
            Log::channel('single')->error('CheckoutController: PayPal createOrder failed', [
                'user_id' => $user->id,
                'plan'    => $plan,
                'error'   => $e->getMessage(),
            ]);

            return back()->with('error', 'Lỗi kết nối PayPal. Vui lòng thử lại hoặc chọn phương thức VietQR.');
        }
    }

    /**
     * Clear all DB-cart rows associated with a given cart session key.
     *
     * Deletes both the `_cart_items` and `_cart_conditions` rows directly
     * from the `shopping_cart` table using a prefix match.  This works
     * whether or not there is an active PHP session, making it safe to call
     * from both browser-context routes (complete, paypalCapture) and from
     * within the same request that owns the session.
     *
     * As a belt-and-suspenders measure, also calls \Cart::clear() through
     * the facade so that any in-memory Cart singleton state is reset.
     *
     * @param  string|null  $cartSessionKey  The PHP session ID prefix to clear.
     *                                       No-op when null.
     */
    private function clearCartBySessionKey(?string $cartSessionKey): void
    {
        if (! $cartSessionKey) {
            return;
        }

        // Direct DB delete — works even from webhook context (no PHP session).
        DB::table('shopping_cart')
            ->where('cart_key', 'LIKE', $cartSessionKey . '%')
            ->delete();

        // Reset the in-memory Cart singleton for the current request.
        \Cart::session($cartSessionKey);
        \Cart::clear();
        \Cart::clearCartConditions();
    }

    /**
     * Build the thank-you session flash payload from a paid Order.
     *
     * @param  Order  $order  A paid order with `user` relation loaded.
     * @return array<string, mixed>
     */
    private function buildThankYouPayload(Order $order): array
    {
        $amountUsd = null;

        if ($order->gateway === 'paypal' && $order->exchange_rate_used) {
            $amountUsd = round($order->total_amount / $order->exchange_rate_used, 2);
        }

        return [
            'order_code'      => $order->order_code,
            'plan'            => $order->plan,
            'total_amount'    => $order->total_amount,
            'amount_usd'      => $amountUsd,
            'coupon_applied'  => $order->coupon_applied,
            'discount_amount' => $order->discount_amount,
            'gateway'         => $order->gateway,
            'paid_at'         => $order->updated_at->format('d/m/Y H:i'),
            'expires_at'      => $order->user?->subscription_expires_at?->format('d/m/Y'),
        ];
    }

    /**
     * Clear the cart and add the specified plan as the sole item.
     *
     * Assumes \Cart::session() has already been set by the calling method.
     */
    private function addPlanToCart(string $plan): void
    {
        $planConf = config("payos.plans.{$plan}");

        \Cart::clear();
        \Cart::clearCartConditions();
        session()->forget('cart_coupon');

        \Cart::add([
            'id'         => $plan,
            'name'       => $planConf['label'],
            'price'      => $planConf['amount'],
            'quantity'   => 1,
            'attributes' => ['plan' => $plan, 'currency' => 'VND'],
        ]);
    }

    /**
     * Set the user's subscription to "active" for the given plan.
     *
     * @param  User    $user
     * @param  string  $plan  "monthly" or "yearly"
     */
    private function activateSubscription(User $user, string $plan): void
    {
        $now    = now();
        $expiry = $plan === 'yearly' ? $now->copy()->addYear() : $now->copy()->addMonth();

        $user->update([
            'subscription_status'     => 'active',
            'subscription_plan'       => $plan,
            'subscription_expires_at' => $expiry,
        ]);
    }
}
