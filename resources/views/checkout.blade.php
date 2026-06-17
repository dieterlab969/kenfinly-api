<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Thanh Toán — {{ config('app.name', 'Kenfinly') }}</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @php $favicon = \App\Models\AppSetting::where('key','favicon')->value('value'); @endphp
    @if($favicon && file_exists(public_path('storage/'.$favicon)))
        <link rel="icon" href="{{ asset('storage/'.$favicon) }}">
    @else
        <link rel="icon" href="{{ asset('favicon.png') }}">
    @endif
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }

        /* ── Navbar ────────────────────────────────────────────────────── */
        .navbar { display:flex; align-items:center; justify-content:space-between; padding:1rem 2rem; background:rgba(15,23,42,.95); backdrop-filter:blur(12px); border-bottom:1px solid rgba(99,102,241,.2); position:sticky; top:0; z-index:50; }
        .navbar-logo { text-decoration:none; display:flex; align-items:center; gap:.5rem; }
        .navbar-logo img { height:34px; }
        .navbar-logo span { font-size:1.3rem; font-weight:700; color:#818cf8; }
        .nav-back { color:#94a3b8; text-decoration:none; font-size:.88rem; padding:.4rem .9rem; border-radius:8px; transition:all .2s; border:1px solid transparent; }
        .nav-back:hover { color:#e2e8f0; border-color:rgba(99,102,241,.3); background:rgba(99,102,241,.1); }

        /* ── Secure bar ─────────────────────────────────────────────── */
        .secure-bar { background:rgba(79,70,229,.08); border-bottom:1px solid rgba(79,70,229,.15); padding:.55rem 2rem; display:flex; align-items:center; justify-content:center; gap:2rem; font-size:.78rem; color:#64748b; }
        .secure-bar span { display:flex; align-items:center; gap:.35rem; }
        .secure-bar em { color:#818cf8; font-style:normal; font-weight:600; }

        /* ── Layout ─────────────────────────────────────────────────── */
        .page { max-width:980px; margin:0 auto; padding:2.5rem 1.5rem 5rem; }
        .page-header { margin-bottom:2rem; }
        .page-title { font-size:1.6rem; font-weight:800; margin-bottom:.3rem; }
        .page-step { display:flex; align-items:center; gap:.5rem; font-size:.82rem; color:#64748b; }
        .step-dot { width:22px; height:22px; border-radius:50%; font-size:.72rem; font-weight:700; display:flex; align-items:center; justify-content:center; }
        .step-dot.done { background:#4ade80; color:#0f172a; }
        .step-dot.active { background:#4f46e5; color:#fff; }
        .step-dot.next { background:#1e293b; border:1px solid #334155; color:#475569; }
        .step-sep { width:28px; height:1px; background:#334155; }

        .grid { display:grid; grid-template-columns:1fr 360px; gap:1.6rem; align-items:start; }
        @media(max-width:760px){ .grid { grid-template-columns:1fr; } }

        /* ── Card ───────────────────────────────────────────────────── */
        .card { background:#1e293b; border:1px solid rgba(99,102,241,.18); border-radius:16px; padding:1.6rem; margin-bottom:1.2rem; }
        .card:last-child { margin-bottom:0; }
        .card-title { font-size:.78rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.07em; margin-bottom:1.2rem; display:flex; align-items:center; gap:.5rem; }
        .card-title-icon { font-size:1rem; }

        /* ── Alert ──────────────────────────────────────────────────── */
        .alert { padding:.75rem 1.1rem; border-radius:10px; font-size:.88rem; font-weight:500; margin-bottom:1.2rem; }
        .alert-success { background:rgba(74,222,128,.1); border:1px solid rgba(74,222,128,.3); color:#4ade80; }
        .alert-error   { background:rgba(248,113,113,.1); border:1px solid rgba(248,113,113,.3); color:#f87171; }
        .alert-info    { background:rgba(99,102,241,.1);  border:1px solid rgba(99,102,241,.3);  color:#818cf8; }
        .alert-warning { background:rgba(251,191,36,.08); border:1px solid rgba(251,191,36,.25); color:#fbbf24; }

        /* ── Account card ────────────────────────────────────────────── */
        .account-row { display:flex; align-items:center; gap:1rem; }
        .account-avatar { width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#4f46e5,#7c3aed); display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:800; color:#fff; flex-shrink:0; }
        .account-name { font-size:.95rem; font-weight:700; color:#e2e8f0; }
        .account-email { font-size:.8rem; color:#64748b; margin-top:.1rem; }
        .account-badge { display:inline-flex; align-items:center; gap:.3rem; background:rgba(74,222,128,.1); border:1px solid rgba(74,222,128,.25); color:#4ade80; font-size:.72rem; font-weight:600; padding:.2rem .55rem; border-radius:999px; margin-top:.4rem; }

        /* ── Coupon ──────────────────────────────────────────────────── */
        .coupon-row { display:flex; gap:.6rem; }
        .input-coupon { flex:1; background:#0f172a; border:1px solid rgba(99,102,241,.3); border-radius:8px; color:#e2e8f0; font-size:.88rem; padding:.6rem .9rem; outline:none; transition:border-color .2s; }
        .input-coupon:focus { border-color:#4f46e5; }
        .input-coupon::placeholder { color:#475569; }
        .btn-apply { background:rgba(99,102,241,.15); border:1px solid rgba(99,102,241,.3); color:#818cf8; font-size:.85rem; font-weight:600; padding:.6rem 1rem; border-radius:8px; cursor:pointer; transition:all .2s; white-space:nowrap; }
        .btn-apply:hover { background:rgba(99,102,241,.28); }
        .coupon-badge { display:inline-flex; align-items:center; gap:.4rem; background:rgba(74,222,128,.1); border:1px solid rgba(74,222,128,.3); color:#4ade80; font-size:.8rem; font-weight:600; padding:.3rem .7rem; border-radius:999px; }
        .coupon-badge button { background:none; border:none; color:#4ade80; cursor:pointer; font-size:.85rem; padding:0 .15rem; line-height:1; }

        /* ── Payment method radio tiles ──────────────────────────────── */
        .gateway-tiles { display:flex; flex-direction:column; gap:.8rem; }
        .gateway-tile { position:relative; cursor:pointer; }
        .gateway-tile input[type="radio"] { position:absolute; opacity:0; width:0; height:0; }
        .tile-body {
            display:flex; align-items:center; gap:1rem;
            padding:1rem 1.2rem;
            background:#0f172a;
            border:2px solid rgba(99,102,241,.18);
            border-radius:12px;
            transition:all .18s;
        }
        .gateway-tile input:checked ~ .tile-body {
            border-color:#4f46e5;
            background:rgba(79,70,229,.08);
            box-shadow:0 0 0 1px rgba(79,70,229,.35);
        }
        .tile-body:hover { border-color:rgba(99,102,241,.4); background:rgba(99,102,241,.05); }
        .tile-radio { width:18px; height:18px; border-radius:50%; border:2px solid #334155; flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:all .18s; }
        .gateway-tile input:checked ~ .tile-body .tile-radio { border-color:#4f46e5; background:#4f46e5; }
        .tile-radio::after { content:''; width:7px; height:7px; border-radius:50%; background:#fff; opacity:0; transition:opacity .18s; }
        .gateway-tile input:checked ~ .tile-body .tile-radio::after { opacity:1; }
        .tile-icon { font-size:1.7rem; flex-shrink:0; }
        .tile-info { flex:1; }
        .tile-name { font-size:.92rem; font-weight:700; color:#e2e8f0; }
        .tile-desc { font-size:.78rem; color:#64748b; margin-top:.15rem; }
        .tile-badge { display:inline-block; background:rgba(74,222,128,.1); border:1px solid rgba(74,222,128,.25); color:#4ade80; font-size:.68rem; font-weight:700; padding:.15rem .45rem; border-radius:4px; margin-left:.4rem; vertical-align:middle; }
        .tile-badge-blue { background:rgba(99,102,241,.12); border-color:rgba(99,102,241,.3); color:#818cf8; }
        .tile-logo { font-size:.75rem; color:#475569; }

        /* ── Sticky right column ─────────────────────────────────────── */
        .sticky-col { position:sticky; top:72px; }

        /* ── Summary rows ────────────────────────────────────────────── */
        .plan-hero { display:flex; align-items:center; gap:.9rem; padding:.9rem 0 1rem; border-bottom:1px solid rgba(99,102,241,.12); margin-bottom:.8rem; }
        .plan-hero-icon { font-size:2rem; }
        .plan-hero-name { font-size:1rem; font-weight:700; color:#e2e8f0; }
        .plan-hero-cycle { font-size:.78rem; color:#64748b; margin-top:.1rem; }
        .summary-row { display:flex; justify-content:space-between; align-items:center; padding:.42rem 0; font-size:.88rem; color:#94a3b8; }
        .summary-row.discount { color:#4ade80; }
        .summary-row.total { font-size:1.05rem; font-weight:800; color:#e2e8f0; border-top:1px solid rgba(99,102,241,.18); margin-top:.5rem; padding-top:.85rem; }
        .vnd { font-size:.72rem; color:#64748b; margin-left:.15rem; }

        /* ── Place order button ───────────────────────────────────────── */
        .btn-place { display:block; width:100%; padding:1rem; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff; font-size:1rem; font-weight:800; border:none; border-radius:12px; cursor:pointer; text-align:center; margin-top:1.3rem; transition:all .2s; box-shadow:0 4px 18px rgba(79,70,229,.4); letter-spacing:.02em; }
        .btn-place:hover { background:linear-gradient(135deg,#4338ca,#6d28d9); transform:translateY(-1px); box-shadow:0 6px 24px rgba(79,70,229,.55); }
        .btn-place:disabled { opacity:.55; pointer-events:none; cursor:default; }
        .btn-place:active { transform:translateY(0); }

        /* ── Trust signals ───────────────────────────────────────────── */
        .trust-row { display:flex; align-items:center; justify-content:center; gap:1.2rem; margin-top:1rem; flex-wrap:wrap; }
        .trust-badge { display:flex; align-items:center; gap:.35rem; font-size:.72rem; color:#475569; }
        .trust-badge em { font-style:normal; }

        /* ── Auth Modal ─────────────────────────────────────────────── */
        .modal-backdrop { position:fixed; inset:0; background:rgba(2,6,23,.78); backdrop-filter:blur(6px); z-index:200; display:flex; align-items:center; justify-content:center; padding:1rem; opacity:0; pointer-events:none; transition:opacity .22s; }
        .modal-backdrop.open { opacity:1; pointer-events:all; }
        .modal-box { background:#1e293b; border:1px solid rgba(99,102,241,.35); border-radius:22px; padding:2.4rem 2rem; max-width:420px; width:100%; text-align:center; position:relative; box-shadow:0 30px 70px rgba(0,0,0,.65); transform:scale(.94) translateY(14px); transition:transform .22s, opacity .22s; }
        .modal-backdrop.open .modal-box { transform:scale(1) translateY(0); }
        .modal-glow { width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg,rgba(79,70,229,.25),rgba(124,58,237,.25)); border:1px solid rgba(99,102,241,.3); display:flex; align-items:center; justify-content:center; font-size:2rem; margin:0 auto 1.2rem; }
        .modal-title { font-size:1.2rem; font-weight:800; color:#e2e8f0; margin-bottom:.6rem; }
        .modal-body { font-size:.87rem; color:#94a3b8; line-height:1.65; margin-bottom:1.7rem; }
        .modal-actions { display:flex; flex-direction:column; gap:.65rem; }
        .btn-modal-login { display:block; padding:.88rem; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff; font-size:.95rem; font-weight:700; border-radius:12px; text-decoration:none; box-shadow:0 4px 18px rgba(79,70,229,.4); transition:all .2s; }
        .btn-modal-login:hover { background:linear-gradient(135deg,#4338ca,#6d28d9); transform:translateY(-1px); }
        .btn-modal-register { display:block; padding:.82rem; background:rgba(99,102,241,.1); border:1px solid rgba(99,102,241,.3); color:#818cf8; font-size:.9rem; font-weight:600; border-radius:12px; text-decoration:none; transition:all .2s; }
        .btn-modal-register:hover { background:rgba(99,102,241,.2); color:#a5b4fc; }
        .modal-divider { display:flex; align-items:center; gap:.6rem; margin:.25rem 0; }
        .modal-divider span { flex:1; height:1px; background:rgba(99,102,241,.15); }
        .modal-divider em { font-size:.75rem; color:#475569; font-style:normal; }
        .btn-modal-dismiss { margin-top:.4rem; background:none; border:none; color:#475569; font-size:.82rem; cursor:pointer; padding:.4rem .8rem; border-radius:6px; transition:color .2s; }
        .btn-modal-dismiss:hover { color:#94a3b8; }
        .modal-close-x { position:absolute; top:.9rem; right:.9rem; background:none; border:none; color:#475569; font-size:1rem; cursor:pointer; width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; transition:all .2s; }
        .modal-close-x:hover { color:#e2e8f0; background:rgba(255,255,255,.08); }
    </style>
</head>
<body>

@php
    // Variables passed from CheckoutController::index() via CurrencyService.
    // Defaults ensure the view renders gracefully even if called without them.
    $currency       = $currency       ?? 'VND';
    $defaultGateway = $defaultGateway ?? 'payos';
    $totalUsd       = $totalUsd       ?? null;
    $isUsd          = $currency === 'USD';
@endphp

{{-- ── Navbar ────────────────────────────────────────────────────────── --}}
<nav class="navbar">
    <a href="/" class="navbar-logo">
        @if(file_exists(public_path('logos/logo-white.png')))
            <img src="{{ asset('logos/logo-white.png') }}" alt="{{ config('app.name') }}">
        @else
            <span>{{ config('app.name','Kenfinly') }}</span>
        @endif
    </a>
    <a href="/cart" class="nav-back">← Giỏ hàng</a>
</nav>

{{-- ── Secure bar ──────────────────────────────────────────────────────── --}}
<div class="secure-bar">
    <span>🔒 <em>SSL</em> Encrypted</span>
    <span>🛡️ Secure <em>Checkout</em></span>
    <span>💳 PCI-DSS Compliant</span>
</div>

<div class="page">

    {{-- Page header --}}
    <div class="page-header">
        <div class="page-title">🛒 Xác nhận & Thanh toán</div>
        <div class="page-step">
            <div class="step-dot done">✓</div>
            <span style="color:#4ade80;font-weight:600;">Chọn gói</span>
            <div class="step-sep"></div>
            <div class="step-dot active">2</div>
            <span style="color:#e2e8f0;font-weight:600;">Thanh toán</span>
            <div class="step-sep"></div>
            <div class="step-dot next">3</div>
            <span>Hoàn tất</span>
        </div>
    </div>

    {{-- Flash alerts --}}
    @foreach(['coupon_success'=>'alert-success','coupon_error'=>'alert-error','coupon_removed'=>'alert-info','error'=>'alert-error','info'=>'alert-info'] as $key => $cls)
        @if(session($key))<div class="alert {{ $cls }}">{{ session($key) }}</div>@endif
    @endforeach
    @if(request()->query('payment') === 'cancelled')
        <div class="alert alert-warning">⚠️ Thanh toán PayPal bị hủy. Vui lòng thử lại hoặc chọn phương thức khác.</div>
    @endif
    @if(session('error'))
        <div class="alert alert-error">{{ session('error') }}</div>
    @endif

    <div class="grid">

        {{-- ═══════════════════════════════════════════════════════════ --}}
        {{-- LEFT COLUMN                                                 --}}
        {{-- ═══════════════════════════════════════════════════════════ --}}
        <div>

            {{-- Account info --}}
            <div class="card">
                <div class="card-title"><span class="card-title-icon">👤</span> Thông tin tài khoản</div>
                <div class="account-row">
                    <div class="account-avatar" id="accountInitial">?</div>
                    <div>
                        <div class="account-name" id="accountName">Đang tải...</div>
                        <div class="account-email" id="accountEmail"></div>
                        <div class="account-badge" id="accountBadge" style="display:none;">✓ Đã xác thực</div>
                    </div>
                </div>
            </div>

            {{-- Coupon --}}
            <div class="card">
                <div class="card-title"><span class="card-title-icon">🏷️</span> Mã giảm giá</div>

                @if($coupon)
                    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.6rem;">
                        <div class="coupon-badge">
                            🏷️ {{ $coupon['code'] }} — {{ $coupon['label'] }}
                        </div>
                        <form method="POST" action="/cart/coupon/remove" style="margin:0;">
                            @csrf
                            <button type="submit" class="btn-apply" style="font-size:.8rem;padding:.45rem .8rem;">Xóa mã</button>
                        </form>
                    </div>
                @else
                    <form method="POST" action="/cart/coupon">
                        @csrf
                        <div class="coupon-row">
                            <input type="text" name="coupon_code" class="input-coupon" placeholder="Nhập mã giảm giá..." maxlength="30" autocomplete="off">
                            <button type="submit" class="btn-apply">Áp dụng</button>
                        </div>
                    </form>
                @endif
            </div>

            {{-- Payment method --}}
            <div class="card">
                <div class="card-title"><span class="card-title-icon">💳</span> Phương thức thanh toán</div>

                <div class="gateway-tiles" id="gatewayTiles">

                    {{-- VietQR / PayOS --}}
                    <label class="gateway-tile">
                        <input type="radio" name="_gateway_select" value="payos" {{ $defaultGateway === 'payos' ? 'checked' : '' }}>
                        <div class="tile-body">
                            <div class="tile-radio"></div>
                            <div class="tile-icon">🏦</div>
                            <div class="tile-info">
                                <div class="tile-name">
                                    VietQR (PayOS)
                                    <span class="tile-badge">Phổ biến</span>
                                </div>
                                <div class="tile-desc">Chuyển khoản ngân hàng nội địa — tức thì, không phí</div>
                                <div class="tile-logo">Hỗ trợ: Vietcombank, MB Bank, BIDV, Techcombank, và 40+ ngân hàng khác</div>
                            </div>
                        </div>
                    </label>

                    {{-- PayPal --}}
                    @if($paypalEnabled)
                    <label class="gateway-tile">
                        <input type="radio" name="_gateway_select" value="paypal" {{ $defaultGateway === 'paypal' ? 'checked' : '' }}>
                        <div class="tile-body">
                            <div class="tile-radio"></div>
                            <div class="tile-icon">🌐</div>
                            <div class="tile-info">
                                <div class="tile-name">
                                    PayPal
                                    <span class="tile-badge tile-badge-blue">Quốc tế</span>
                                </div>
                                <div class="tile-desc">Credit/Debit card & PayPal balance — thanh toán bằng USD</div>
                                <div class="tile-logo">Visa · Mastercard · American Express · PayPal</div>
                            </div>
                        </div>
                    </label>
                    @else
                    <div class="gateway-tile" style="opacity:.45;cursor:not-allowed;">
                        <div class="tile-body" style="pointer-events:none;">
                            <div class="tile-radio"></div>
                            <div class="tile-icon">🌐</div>
                            <div class="tile-info">
                                <div class="tile-name">PayPal <span class="tile-badge" style="background:rgba(100,116,139,.12);border-color:rgba(100,116,139,.3);color:#64748b;">Chưa khả dụng</span></div>
                                <div class="tile-desc">Đang cấu hình — vui lòng sử dụng VietQR</div>
                            </div>
                        </div>
                    </div>
                    @endif

                </div>
            </div>

        </div>{{-- /left --}}

        {{-- ═══════════════════════════════════════════════════════════ --}}
        {{-- RIGHT COLUMN — sticky order summary                        --}}
        {{-- ═══════════════════════════════════════════════════════════ --}}
        <div class="sticky-col">
            <div class="card">
                <div class="card-title"><span class="card-title-icon">📋</span> {{ $isUsd ? 'Order Summary' : 'Tóm tắt đơn hàng' }}</div>

                @foreach($cartItems as $item)
                    @php
                        $icon  = $item->id === 'monthly' ? '🚀' : '🏆';
                        $cycle = $item->id === 'monthly' ? ($isUsd ? 'monthly' : 'hàng tháng') : ($isUsd ? 'yearly' : 'hàng năm');
                    @endphp
                    <div class="plan-hero">
                        <div class="plan-hero-icon">{{ $icon }}</div>
                        <div>
                            <div class="plan-hero-name">{{ $item->name }}</div>
                            <div class="plan-hero-cycle">{{ $isUsd ? 'Billed' : 'Thanh toán' }} {{ $cycle }} · {{ $isUsd ? 'USD' : 'VND' }}</div>
                        </div>
                    </div>
                    <div class="summary-row">
                        <span>{{ $isUsd ? 'Original price' : 'Giá gốc' }}</span>
                        <span>{{ number_format($item->price) }}<span class="vnd">₫</span></span>
                    </div>
                @endforeach

                @if($subTotal != $total)
                    <div class="summary-row discount">
                        <span>🏷️ {{ $isUsd ? 'Discount' : 'Giảm giá' }}</span>
                        <span>−{{ number_format($subTotal - $total) }}<span class="vnd">₫</span></span>
                    </div>
                @endif

                <div class="summary-row total">
                    <span>{{ $isUsd ? 'Total' : 'Tổng thanh toán' }}</span>
                    <span id="totalDisplay">{{ number_format($total) }}<span class="vnd">₫</span></span>
                </div>

                {{-- USD secondary total: shows PayPal charge amount when gateway = paypal --}}
                @if($isUsd && $totalUsd)
                    <div id="usdTotalRow" class="summary-row" style="color:#fbbf24;font-size:.88rem;padding-bottom:.6rem;">
                        <span>🌐 {{ $isUsd ? 'PayPal charge' : 'Thanh toán PayPal' }}</span>
                        <span style="font-weight:700;">${{ number_format($totalUsd, 2) }} USD</span>
                    </div>
                @endif

                {{-- Main checkout form --}}
                <form method="POST" action="/checkout" id="checkoutForm">
                    @csrf
                    <input type="hidden" name="_jwt_token" id="jwtField">
                    <input type="hidden" name="gateway"    id="gatewayField" value="{{ $defaultGateway }}">
                    <button type="submit" class="btn-place" id="placeBtn">
                        🔒 {{ $isUsd ? 'Place Order &amp; Pay' : 'Đặt hàng &amp; Thanh toán' }}
                    </button>
                </form>

                {{-- Trust signals --}}
                <div class="trust-row">
                    <div class="trust-badge">🔒 <em>SSL 256-bit</em></div>
                    <div class="trust-badge">🛡️ <em>Secure Pay</em></div>
                    <div class="trust-badge">✅ <em>PCI-DSS</em></div>
                </div>

                <div style="margin-top:1rem;font-size:.75rem;color:#334155;text-align:center;line-height:1.6;">
                    Bằng cách đặt hàng, bạn đồng ý với <a href="/terms" style="color:#818cf8;">Điều khoản dịch vụ</a> và <a href="/privacy" style="color:#818cf8;">Chính sách bảo mật</a> của chúng tôi.
                </div>
            </div>

            {{-- Support link --}}
            <div style="text-align:center;margin-top:.8rem;font-size:.78rem;color:#475569;">
                Cần hỗ trợ? <a href="mailto:purchasevn@getkenka.com" style="color:#818cf8;">Liên hệ chúng tôi</a>
            </div>
        </div>{{-- /right --}}

    </div>{{-- /grid --}}
</div>{{-- /page --}}

{{-- ── Auth Modal ──────────────────────────────────────────────────────── --}}
<div id="authModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="authModalTitle">
    <div class="modal-box">
        <button class="modal-close-x" onclick="closeAuthModal()" aria-label="Đóng">✕</button>
        <div class="modal-glow">🔐</div>
        <h2 class="modal-title" id="authModalTitle">Đăng nhập để thanh toán</h2>
        <p class="modal-body">Bạn cần đăng nhập hoặc tạo tài khoản để hoàn tất thanh toán và kích hoạt gói dịch vụ.</p>
        <div class="modal-actions">
            <a href="/SignIn?redirect_to=/checkout" class="btn-modal-login">Đăng nhập</a>
            <div class="modal-divider"><span></span><em>hoặc</em><span></span></div>
            <a href="/SignUp?redirect_to=/checkout" class="btn-modal-register">Đăng ký tài khoản mới</a>
            <button class="btn-modal-dismiss" onclick="closeAuthModal()">Tiếp tục xem trang</button>
        </div>
    </div>
</div>

<script>
// ── Auth modal helpers ──────────────────────────────────────────────────
const authModal = document.getElementById('authModal');

function openAuthModal() {
    authModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeAuthModal() {
    authModal.classList.remove('open');
    document.body.style.overflow = '';
}
authModal.addEventListener('click', (e) => { if (e.target === authModal) closeAuthModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAuthModal(); });

// ── JWT injection & user info ───────────────────────────────────────────
const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
const jwtField = document.getElementById('jwtField');
if (jwtField) jwtField.value = token;

function getJwtPayload(t) {
    try {
        const b64 = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(b64));
    } catch (e) { return null; }
}

// Populate account card from localStorage user data
function populateAccount() {
    const nameEl    = document.getElementById('accountName');
    const emailEl   = document.getElementById('accountEmail');
    const initEl    = document.getElementById('accountInitial');
    const badgeEl   = document.getElementById('accountBadge');

    // Try localStorage 'user' first (set by React AuthContext on login)
    try {
        const stored = localStorage.getItem('user');
        if (stored) {
            const u = JSON.parse(stored);
            const name  = u.name  || u.full_name || '';
            const email = u.email || '';
            if (name || email) {
                nameEl.textContent  = name  || 'Người dùng';
                emailEl.textContent = email;
                initEl.textContent  = (name || email).charAt(0).toUpperCase();
                badgeEl.style.display = 'inline-flex';
                return;
            }
        }
    } catch(e) {}

    // Fallback: decode JWT payload
    if (token) {
        const payload = getJwtPayload(token);
        if (payload) {
            nameEl.textContent  = payload.name  || payload.sub || 'Đã đăng nhập';
            emailEl.textContent = payload.email || '';
            initEl.textContent  = (payload.name || payload.email || '?').charAt(0).toUpperCase();
            badgeEl.style.display = 'inline-flex';
            return;
        }
    }

    nameEl.textContent = 'Chưa đăng nhập';
}
populateAccount();

// ── Gateway radio → hidden field sync ──────────────────────────────────
const radios      = document.querySelectorAll('input[name="_gateway_select"]');
const gatewayField = document.getElementById('gatewayField');

radios.forEach(r => {
    r.addEventListener('change', () => {
        if (r.checked) gatewayField.value = r.value;
    });
});

// ── Checkout form guard ─────────────────────────────────────────────────
const checkoutForm = document.getElementById('checkoutForm');
const placeBtn     = document.getElementById('placeBtn');

if (checkoutForm) {
    checkoutForm.addEventListener('submit', function(e) {
        const t = jwtField ? jwtField.value : '';
        if (!t) {
            e.preventDefault();
            openAuthModal();
            return;
        }
        // Prevent double-submit
        if (placeBtn) {
            placeBtn.disabled = true;
            placeBtn.textContent = '⏳ Đang xử lý...';
        }
    });
}

// ── Show auth modal on page load if no token ───────────────────────────
if (!token) {
    // Small delay so page renders first
    setTimeout(openAuthModal, 350);
}
</script>
</body>
</html>
