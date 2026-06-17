<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
use PayOS\PayOS;
use Illuminate\Support\Facades\Log;

/**
 * Handles the cart checkout flow for subscription plan purchases.
 *
 * This controller bridges the PHP session-based cart (darryldecode/cart) with
 * the PayOS payment gateway. Authentication is performed via a JWT token that
 * the React SPA writes into a hidden form field, allowing a standard HTML form
 * POST from the Blade cart page to authenticate against the JWT API guard.
 *
 * Routes (defined in web.php):
 *   POST /cart/checkout       — create order, call PayOS, redirect to order page
 *   GET  /order/{order_code}  — display QR checkout page for a pending order
 */
class CheckoutController extends Controller
{
    /**
     * Process the cart and create a pending PayOS order.
     *
     * Step-by-step:
     *  1. Authenticate the user via the `_jwt_token` hidden field.
     *  2. Read the cart contents (must be non-empty).
     *  3. Generate a unique numeric order code.
     *  4. Call the PayOS SDK to obtain a hosted checkout URL and QR code.
     *     On SDK failure the order is still persisted (for sandbox / no-creds
     *     environments) but without checkout_url / qr_code values.
     *  5. Persist an Order row with status "pending" and a 5-minute expiry.
     *  6. Clear the cart and redirect to `/order/{order_code}`.
     *
     * Called by the "Đặt hàng" form on the cart Blade view.
     *
     * POST /cart/checkout
     *
     * @param  Request  $request  Form POST including `_jwt_token` hidden field.
     * @return RedirectResponse   Redirect to /order/{order_code} on success,
     *                            or back to /SignIn / /pricing on failure.
     */
    public function store(Request $request): RedirectResponse
    {
        // ── 1. Authenticate via JWT token passed in the hidden form field ──
        $token = $request->input('_jwt_token');

        if (! $token) {
            return redirect('/SignIn?redirect_to=/cart')
                ->with('error', 'Vui lòng đăng nhập để tiếp tục.');
        }

        try {
            $user = auth('api')->setToken($token)->authenticate();
        } catch (\Exception $e) {
            return redirect('/SignIn?redirect_to=/cart')
                ->with('error', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }

        if (! $user) {
            return redirect('/SignIn?redirect_to=/cart');
        }

        // ── 2. Read cart contents ──────────────────────────────────────────
        $cartItems = \Cart::getContent();

        if ($cartItems->isEmpty()) {
            return redirect('/pricing')
                ->with('error', 'Giỏ hàng trống. Vui lòng chọn gói dịch vụ.');
        }

        $cartItem   = $cartItems->first();
        $plan       = $cartItem->attributes['plan'];
        $subTotal   = (int) \Cart::getSubTotal();
        $total      = (int) \Cart::getTotal();
        $discount   = max(0, $subTotal - $total);
        $coupon     = session('cart_coupon.code');

        // ── 3. Generate a unique order code ───────────────────────────────
        $orderCode = (int) (time() . rand(10, 99));

        // ── 4. Call PayOS SDK ─────────────────────────────────────────────
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
            // Proceed anyway — order is created without QR (sandbox / no creds)
        }

        // ── 5. Persist order ──────────────────────────────────────────────
        Order::create([
            'user_id'        => $user->id,
            'order_code'     => $orderCode,
            'plan'           => $plan,
            'total_amount'   => $total,
            'coupon_applied' => $coupon,
            'discount_amount'=> $discount,
            'status'         => 'pending',
            'checkout_url'   => $checkoutUrl,
            'qr_code'        => $qrCode,
            'expires_at'     => now()->addMinutes(5),
        ]);

        // ── 6. Clear cart ─────────────────────────────────────────────────
        \Cart::clear();
        \Cart::clearCartConditions();
        session()->forget('cart_coupon');

        Log::channel('single')->info('Order created', [
            'user_id'    => $user->id,
            'order_code' => $orderCode,
            'plan'       => $plan,
            'total'      => $total,
        ]);

        return redirect('/order/' . $orderCode);
    }

    /**
     * Display the QR checkout page for a specific pending order.
     *
     * Performs lazy expiry: if the order is still "pending" but its
     * `expires_at` has passed it is marked "expired" before the view renders,
     * so the countdown timer and QR code are hidden immediately on refresh.
     *
     * GET /order/{order_code}
     *
     * @param  string  $orderCode  Numeric order code from the URL segment.
     * @return View|RedirectResponse  Rendered `resources/views/order.blade.php`,
     *                                or a 404 abort when the code is unknown.
     */
    public function show(string $orderCode): View|RedirectResponse
    {
        $order = Order::where('order_code', $orderCode)->firstOrFail();

        // Auto-expire if timer has passed
        if ($order->status === 'pending' && $order->isExpired()) {
            $order->update(['status' => 'expired']);
        }

        return view('order', [
            'order'            => $order,
            'remainingSeconds' => $order->remainingSeconds(),
            'planLabel'        => config("payos.plans.{$order->plan}.label", $order->plan),
        ]);
    }
}
