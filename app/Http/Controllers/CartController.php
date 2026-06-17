<?php

namespace App\Http\Controllers;

use Darryldecode\Cart\CartCondition;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class CartController extends Controller
{
    /**
     * Show the cart. If a ?plan= query param is present, add that plan
     * to the cart first (replacing any existing item — only 1 plan at a time).
     *
     * GET /cart?plan=monthly|yearly
     */
    public function index(Request $request): View
    {
        $plan = $request->query('plan');

        if (in_array($plan, ['monthly', 'yearly'], true)) {
            $this->addPlanToCart($plan);
        }

        $cartItems  = \Cart::getContent();
        $conditions = \Cart::getConditions();
        $subTotal   = \Cart::getSubTotal();
        $total      = \Cart::getTotal();
        $coupon     = session('cart_coupon');

        return view('cart', compact('cartItems', 'conditions', 'subTotal', 'total', 'coupon'));
    }

    /**
     * Remove all items from the cart.
     *
     * POST /cart/clear
     */
    public function clear(): RedirectResponse
    {
        \Cart::clear();
        \Cart::clearCartConditions();
        session()->forget('cart_coupon');

        return redirect('/pricing')->with('info', 'Giỏ hàng đã được xóa.');
    }

    /**
     * Apply a coupon code as a cart condition.
     *
     * POST /cart/coupon
     */
    public function applyCoupon(Request $request): RedirectResponse
    {
        $code    = strtoupper(trim($request->input('coupon_code', '')));
        $coupons = config('payos.coupons', []);

        if (! isset($coupons[$code])) {
            return back()->with('coupon_error', 'Mã giảm giá không hợp lệ hoặc đã hết hạn.');
        }

        // Remove any previously applied coupon first
        \Cart::removeCartCondition('coupon');

        $coupon    = $coupons[$code];
        $condValue = $coupon['type'] === 'percent'
            ? '-' . $coupon['value'] . '%'
            : '-' . $coupon['value'];

        $condition = new CartCondition([
            'name'   => 'coupon',
            'type'   => 'coupon',
            'target' => 'total',
            'value'  => $condValue,
        ]);

        \Cart::condition($condition);
        session(['cart_coupon' => ['code' => $code, 'label' => $coupon['label']]]);

        return back()->with('coupon_success', 'Đã áp dụng mã giảm giá: ' . $coupon['label']);
    }

    /**
     * Remove the active coupon condition.
     *
     * POST /cart/coupon/remove
     */
    public function removeCoupon(): RedirectResponse
    {
        \Cart::removeCartCondition('coupon');
        session()->forget('cart_coupon');

        return back()->with('coupon_removed', 'Đã xóa mã giảm giá.');
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function addPlanToCart(string $plan): void
    {
        $planConf = config("payos.plans.{$plan}");

        // One plan at a time — clear cart before adding
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
}
