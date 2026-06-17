<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
use PayOS\PayOS;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    /**
     * Process the cart and create a pending order.
     * Called by the "Đặt hàng" form on the cart page.
     *
     * POST /cart/checkout
     */
    public function store(Request $request): RedirectResponse
    {
        // ── 1. Authenticate via JWT token passed in the hidden form field ──
        $token = $request->input('_jwt_token');

        if (! $token) {
            return redirect('/login?redirect=cart')
                ->with('error', 'Vui lòng đăng nhập để tiếp tục.');
        }

        try {
            $user = auth('api')->setToken($token)->authenticate();
        } catch (\Exception $e) {
            return redirect('/login?redirect=cart')
                ->with('error', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }

        if (! $user) {
            return redirect('/login?redirect=cart');
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
     * Display the QR checkout page for a specific order.
     *
     * GET /order/{order_code}
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
