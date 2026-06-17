<?php

namespace App\Http\Controllers;

use Darryldecode\Cart\CartCondition;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Manages the shopping cart for plan purchases.
 *
 * Uses the `darryldecode/cart` package (stored in the PHP session) to hold
 * a single subscription plan at a time. Supports optional coupon codes
 * defined in `config/payos.php` that are applied as named CartConditions.
 *
 * Routes (defined in web.php):
 *   GET  /cart           — show cart, optionally pre-loading a plan
 *   POST /cart/clear     — empty the cart and redirect to /pricing
 *   POST /cart/coupon    — apply a coupon code
 *   POST /cart/coupon/remove — remove the active coupon
 */
class CartController extends Controller
{
    /**
     * Show the cart page.
     *
     * When a `?plan=monthly|yearly` query parameter is present the specified
     * plan is loaded into the cart first (replacing any existing item — only
     * one plan is allowed at a time). Cart contents, totals, conditions, and
     * any active coupon are passed to the Blade view.
     *
     * GET /cart?plan=monthly|yearly
     *
     * @param  Request  $request  May contain a `plan` query parameter.
     * @return View               Rendered `resources/views/cart.blade.php`.
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
     * Remove all items and conditions from the cart.
     *
     * Also clears the `cart_coupon` session key and redirects the user back
     * to the pricing page with an informational flash message.
     *
     * POST /cart/clear
     *
     * @return RedirectResponse  Redirect to /pricing.
     */
    public function clear(): RedirectResponse
    {
        \Cart::clear();
        \Cart::clearCartConditions();
        session()->forget('cart_coupon');

        return redirect('/pricing')->with('info', 'Giỏ hàng đã được xóa.');
    }

    /**
     * Apply a coupon code as a cart discount condition.
     *
     * Looks up the submitted code (case-insensitive, trimmed) in the
     * `config/payos.coupons` map. If valid, any previously applied coupon
     * is removed and the new condition is added. The active coupon label
     * is stored in the session for display in the cart view.
     *
     * POST /cart/coupon
     *
     * @param  Request  $request  Form field: `coupon_code` (string).
     * @return RedirectResponse   Back to cart with `coupon_success` or
     *                            `coupon_error` flash message.
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
     * Remove the currently active coupon condition from the cart.
     *
     * Clears both the CartCondition named "coupon" and the `cart_coupon`
     * session key, then redirects back with a flash confirmation.
     *
     * POST /cart/coupon/remove
     *
     * @return RedirectResponse  Back to cart with `coupon_removed` flash message.
     */
    public function removeCoupon(): RedirectResponse
    {
        \Cart::removeCartCondition('coupon');
        session()->forget('cart_coupon');

        return back()->with('coupon_removed', 'Đã xóa mã giảm giá.');
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Clear the cart and add the requested plan as the sole item.
     *
     * Plan details (label, amount) are sourced from `config/payos.plans`.
     * The cart supports only a single plan at a time — any existing item,
     * condition, and active coupon are removed before the new item is added.
     *
     * @param  string  $plan  "monthly" or "yearly".
     * @return void
     */
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
