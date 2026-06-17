<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
use PayOS\PayOS;
use Srmklive\PayPal\Services\PayPal as PayPalClient;
use Illuminate\Support\Facades\Log;

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
 *   GET  /order/{order_code}         — QR countdown page (PayOS orders)
 */
class CheckoutController extends Controller
{
    // ── Public route handlers ─────────────────────────────────────────────

    /**
     * Show the One-Page Checkout.
     *
     * Optionally loads a plan into the cart from the `?plan=` query parameter.
     * Redirects to /pricing if the cart is empty after that.
     *
     * GET /checkout[?plan=monthly|yearly]
     */
    public function index(Request $request): View|RedirectResponse
    {
        $plan = $request->query('plan');

        if (in_array($plan, ['monthly', 'yearly'], true)) {
            $this->addPlanToCart($plan);
        }

        $cartItems   = \Cart::getContent();
        $subTotal    = \Cart::getSubTotal();
        $total       = \Cart::getTotal();
        $coupon      = session('cart_coupon');

        if ($cartItems->isEmpty()) {
            return redirect('/pricing')->with('info', 'Vui lòng chọn gói dịch vụ trước.');
        }

        // Show PayPal tile only when credentials are configured
        $paypalMode    = config('paypal.mode', 'sandbox');
        $paypalEnabled = ! empty(config("paypal.{$paypalMode}.client_id"));

        return view('checkout', compact('cartItems', 'subTotal', 'total', 'coupon', 'paypalEnabled'));
    }

    /**
     * Process the OPC form submission.
     *
     * Authenticates the user via `_jwt_token`, reads the cart, determines
     * the selected `gateway`, then delegates to processPayOS() or
     * processPayPal().
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

        // ── 2. Read cart ─────────────────────────────────────────────────
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

        $orderCode = (int) (time() . rand(10, 99));

        // ── 3. Route to gateway ──────────────────────────────────────────
        if ($gateway === 'paypal') {
            return $this->processPayPal($user, $plan, $total, $discount, $coupon, $orderCode);
        }

        return $this->processPayOS($user, $plan, $total, $discount, $coupon, $orderCode);
    }

    /**
     * Capture a PayPal order after the buyer approves it on PayPal's site.
     *
     * PayPal redirects here with `?token=<PayPal_Order_ID>`. We capture
     * the payment, mark the order paid, and activate the subscription.
     *
     * GET /checkout/paypal/capture
     */
    public function paypalCapture(Request $request): RedirectResponse
    {
        $paypalToken = $request->query('token'); // PayPal Order ID

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

                Log::channel('single')->info('PayPal capture: order paid', [
                    'user_id'    => $order->user_id,
                    'plan'       => $order->plan,
                    'order_code' => $order->order_code,
                ]);

                return redirect('/pricing?payment=success');
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

    // ── Private helpers ───────────────────────────────────────────────────

    /**
     * Create a PayOS payment link, persist the order, and redirect to the
     * QR countdown page.
     */
    private function processPayOS(
        User $user, string $plan, int $total, int $discount, ?string $coupon, int $orderCode
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

        \Cart::clear();
        \Cart::clearCartConditions();
        session()->forget('cart_coupon');

        Log::channel('single')->info('Order created (PayOS)', [
            'user_id'    => $user->id,
            'order_code' => $orderCode,
            'plan'       => $plan,
            'total'      => $total,
        ]);

        return redirect('/order/' . $orderCode);
    }

    /**
     * Create a PayPal order, persist our Order row, and redirect the buyer
     * to PayPal's approval page.
     */
    private function processPayPal(
        User $user, string $plan, int $total, int $discount, ?string $coupon, int $orderCode
    ): RedirectResponse {
        $planConf  = config("paypal.plans.{$plan}");
        $amountUsd = number_format($planConf['amount_usd'], 2, '.', '');

        try {
            $provider = new PayPalClient;
            $provider->setApiCredentials(config('paypal'));
            $provider->getAccessToken();

            $response = $provider->createOrder([
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'reference_id' => (string) $orderCode,
                    'description'  => $planConf['description'],
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
                'user_id'           => $user->id,
                'order_code'        => $orderCode,
                'plan'              => $plan,
                'total_amount'      => $total,
                'coupon_applied'    => $coupon,
                'discount_amount'   => $discount,
                'status'            => 'pending',
                'gateway'           => 'paypal',
                'payment_reference' => $paypalOrderId,
                'checkout_url'      => $approveLink,
                'qr_code'           => null,
                'expires_at'        => now()->addMinutes(30),
            ]);

            \Cart::clear();
            \Cart::clearCartConditions();
            session()->forget('cart_coupon');

            Log::channel('single')->info('Order created (PayPal)', [
                'user_id'         => $user->id,
                'order_code'      => $orderCode,
                'plan'            => $plan,
                'paypal_order_id' => $paypalOrderId,
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
     * Clear the cart and add the specified plan as the sole item.
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
