<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Giỏ Hàng — {{ config('app.name', 'Kenfinly') }}</title>
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

        /* Navbar */
        .navbar { display:flex; align-items:center; justify-content:space-between; padding:1rem 2rem; background:rgba(15,23,42,.9); backdrop-filter:blur(10px); border-bottom:1px solid rgba(99,102,241,.2); position:sticky; top:0; z-index:50; }
        .navbar-logo { text-decoration:none; display:flex; align-items:center; gap:.5rem; }
        .navbar-logo img { height:34px; }
        .navbar-logo span { font-size:1.3rem; font-weight:700; color:#818cf8; }
        .nav-links a { color:#94a3b8; text-decoration:none; font-size:.9rem; padding:.4rem .9rem; border-radius:6px; transition:all .2s; }
        .nav-links a:hover { color:#e2e8f0; background:rgba(99,102,241,.15); }

        /* Layout */
        .page { max-width:960px; margin:0 auto; padding:2.5rem 1.5rem 5rem; }
        .page-title { font-size:1.7rem; font-weight:800; margin-bottom:.4rem; }
        .page-subtitle { color:#64748b; font-size:.9rem; margin-bottom:2rem; }

        /* Alert */
        .alert { padding:.75rem 1.1rem; border-radius:10px; font-size:.88rem; font-weight:500; margin-bottom:1.2rem; }
        .alert-success { background:rgba(74,222,128,.1); border:1px solid rgba(74,222,128,.3); color:#4ade80; }
        .alert-error   { background:rgba(248,113,113,.1); border:1px solid rgba(248,113,113,.3); color:#f87171; }
        .alert-info    { background:rgba(99,102,241,.1);  border:1px solid rgba(99,102,241,.3);  color:#818cf8; }

        /* Grid */
        .grid { display:grid; grid-template-columns:1fr 360px; gap:1.5rem; align-items:start; }
        @media(max-width:720px){ .grid { grid-template-columns:1fr; } }

        /* Card */
        .card { background:#1e293b; border:1px solid rgba(99,102,241,.2); border-radius:16px; padding:1.6rem; }
        .card-title { font-size:1rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; margin-bottom:1.2rem; }

        /* Empty state */
        .empty { text-align:center; padding:3rem 1rem; }
        .empty-icon { font-size:3rem; margin-bottom:1rem; }
        .empty h3 { font-size:1.2rem; font-weight:700; margin-bottom:.5rem; }
        .empty p { color:#64748b; font-size:.9rem; margin-bottom:1.5rem; }

        /* Cart item */
        .cart-item { display:flex; align-items:center; justify-content:space-between; padding:1rem 0; border-bottom:1px solid rgba(99,102,241,.1); }
        .cart-item:last-child { border-bottom:none; padding-bottom:0; }
        .item-info { display:flex; align-items:center; gap:.9rem; }
        .item-icon { font-size:1.8rem; }
        .item-name { font-size:1rem; font-weight:700; color:#e2e8f0; }
        .item-cycle { font-size:.8rem; color:#64748b; margin-top:.1rem; }
        .item-price { font-size:1.1rem; font-weight:700; color:#818cf8; }
        .btn-remove { background:none; border:none; color:#475569; font-size:1.1rem; cursor:pointer; padding:.2rem .4rem; border-radius:6px; transition:all .2s; }
        .btn-remove:hover { color:#f87171; background:rgba(248,113,113,.1); }

        /* Coupon */
        .coupon-row { display:flex; gap:.6rem; margin-top:1rem; }
        .input-coupon { flex:1; background:#0f172a; border:1px solid rgba(99,102,241,.3); border-radius:8px; color:#e2e8f0; font-size:.88rem; padding:.6rem .9rem; outline:none; transition:border-color .2s; }
        .input-coupon:focus { border-color:#4f46e5; }
        .input-coupon::placeholder { color:#475569; }
        .btn-apply { background:rgba(99,102,241,.15); border:1px solid rgba(99,102,241,.3); color:#818cf8; font-size:.85rem; font-weight:600; padding:.6rem 1rem; border-radius:8px; cursor:pointer; transition:all .2s; white-space:nowrap; }
        .btn-apply:hover { background:rgba(99,102,241,.25); }
        .coupon-badge { display:inline-flex; align-items:center; gap:.4rem; background:rgba(74,222,128,.1); border:1px solid rgba(74,222,128,.3); color:#4ade80; font-size:.8rem; font-weight:600; padding:.3rem .7rem; border-radius:999px; margin-top:.8rem; }
        .coupon-badge button { background:none; border:none; color:#4ade80; cursor:pointer; font-size:.85rem; padding:0 .1rem; line-height:1; }

        /* Summary */
        .summary-row { display:flex; justify-content:space-between; align-items:center; padding:.45rem 0; font-size:.9rem; color:#94a3b8; }
        .summary-row.total { font-size:1.1rem; font-weight:800; color:#e2e8f0; border-top:1px solid rgba(99,102,241,.2); margin-top:.5rem; padding-top:.9rem; }
        .summary-row.discount { color:#4ade80; }
        .vnd { font-size:.75rem; color:#64748b; margin-left:.2rem; }

        /* Checkout button */
        .btn-checkout { display:block; width:100%; padding:.95rem; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff; font-size:1rem; font-weight:700; border:none; border-radius:12px; cursor:pointer; text-align:center; margin-top:1.2rem; transition:all .2s; box-shadow:0 4px 15px rgba(79,70,229,.35); }
        .btn-checkout:hover { background:linear-gradient(135deg,#4338ca,#6d28d9); transform:translateY(-1px); box-shadow:0 6px 20px rgba(79,70,229,.5); }
        .btn-checkout:disabled { opacity:.6; pointer-events:none; }
        .secure-note { text-align:center; color:#475569; font-size:.76rem; margin-top:.7rem; }

        .btn-link { display:inline-block; color:#818cf8; text-decoration:none; font-size:.88rem; padding:.5rem .9rem; border-radius:8px; transition:all .2s; }
        .btn-link:hover { background:rgba(99,102,241,.12); }

        /* ── Auth Modal ─────────────────────────────────────────────────── */
        .modal-backdrop {
            position:fixed; inset:0;
            background:rgba(2,6,23,.75); backdrop-filter:blur(6px);
            z-index:200; display:flex; align-items:center; justify-content:center;
            padding:1rem; opacity:0; pointer-events:none;
            transition:opacity .22s ease;
        }
        .modal-backdrop.open { opacity:1; pointer-events:all; }
        .modal-box {
            background:#1e293b;
            border:1px solid rgba(99,102,241,.35);
            border-radius:22px; padding:2.4rem 2rem;
            max-width:420px; width:100%; text-align:center; position:relative;
            box-shadow:0 30px 70px rgba(0,0,0,.65);
            transform:scale(.94) translateY(14px);
            transition:transform .22s ease, opacity .22s ease;
        }
        .modal-backdrop.open .modal-box { transform:scale(1) translateY(0); }
        .modal-glow {
            width:72px; height:72px; border-radius:50%;
            background:linear-gradient(135deg,rgba(79,70,229,.25),rgba(124,58,237,.25));
            border:1px solid rgba(99,102,241,.3);
            display:flex; align-items:center; justify-content:center;
            font-size:2rem; margin:0 auto 1.2rem;
        }
        .modal-title { font-size:1.25rem; font-weight:800; color:#e2e8f0; margin-bottom:.65rem; line-height:1.35; }
        .modal-body  { font-size:.88rem; color:#94a3b8; line-height:1.65; margin-bottom:1.8rem; }
        .modal-actions { display:flex; flex-direction:column; gap:.65rem; }
        .btn-modal-login {
            display:block; padding:.88rem;
            background:linear-gradient(135deg,#4f46e5,#7c3aed);
            color:#fff; font-size:.95rem; font-weight:700;
            border-radius:12px; text-decoration:none;
            box-shadow:0 4px 18px rgba(79,70,229,.4);
            transition:all .2s;
        }
        .btn-modal-login:hover { background:linear-gradient(135deg,#4338ca,#6d28d9); transform:translateY(-1px); box-shadow:0 6px 22px rgba(79,70,229,.55); }
        .btn-modal-register {
            display:block; padding:.82rem;
            background:rgba(99,102,241,.1); border:1px solid rgba(99,102,241,.3);
            color:#818cf8; font-size:.9rem; font-weight:600;
            border-radius:12px; text-decoration:none;
            transition:all .2s;
        }
        .btn-modal-register:hover { background:rgba(99,102,241,.2); color:#a5b4fc; }
        .btn-modal-dismiss {
            margin-top:.5rem; background:none; border:none;
            color:#475569; font-size:.82rem; cursor:pointer;
            padding:.4rem .8rem; border-radius:6px; transition:color .2s;
        }
        .btn-modal-dismiss:hover { color:#94a3b8; }
        .modal-close-x {
            position:absolute; top:.9rem; right:.9rem;
            background:none; border:none; color:#475569; font-size:1rem;
            cursor:pointer; width:28px; height:28px; border-radius:6px;
            display:flex; align-items:center; justify-content:center;
            transition:all .2s; line-height:1;
        }
        .modal-close-x:hover { color:#e2e8f0; background:rgba(255,255,255,.08); }
        .modal-divider { display:flex; align-items:center; gap:.6rem; margin:.3rem 0; }
        .modal-divider span { flex:1; height:1px; background:rgba(99,102,241,.15); }
        .modal-divider em { font-size:.75rem; color:#475569; font-style:normal; }
    </style>
</head>
<body>

<nav class="navbar">
    <a href="/" class="navbar-logo">
        @if(file_exists(public_path('logos/logo-white.png')))
            <img src="{{ asset('logos/logo-white.png') }}" alt="{{ config('app.name') }}">
        @else
            <span>{{ config('app.name','Kenfinly') }}</span>
        @endif
    </a>
    <div class="nav-links">
        <a href="/pricing">← Bảng giá</a>
    </div>
</nav>

<div class="page">
    <div class="page-title">🛒 Giỏ Hàng</div>
    <div class="page-subtitle">Xem lại đơn hàng của bạn trước khi thanh toán.</div>

    @foreach(['coupon_success'=>'alert-success','coupon_error'=>'alert-error','coupon_removed'=>'alert-info','error'=>'alert-error','info'=>'alert-info'] as $key => $cls)
        @if(session($key))<div class="alert {{ $cls }}">{{ session($key) }}</div>@endif
    @endforeach

    @if($cartItems->isEmpty())
        <div class="card">
            <div class="empty">
                <div class="empty-icon">🛍️</div>
                <h3>Giỏ hàng trống</h3>
                <p>Bạn chưa chọn gói dịch vụ nào.</p>
                <a href="/pricing" class="btn-checkout" style="display:inline-block;width:auto;padding:.8rem 2rem;text-decoration:none;">Xem bảng giá</a>
            </div>
        </div>
    @else
    <div class="grid">

        <!-- Left: items + coupon -->
        <div>
            <div class="card" style="margin-bottom:1rem;">
                <div class="card-title">Gói dịch vụ</div>

                @foreach($cartItems as $item)
                    @php
                        $icon  = $item->id === 'monthly' ? '🚀' : '🏆';
                        $cycle = $item->id === 'monthly' ? 'hàng tháng' : 'hàng năm';
                    @endphp
                    <div class="cart-item">
                        <div class="item-info">
                            <span class="item-icon">{{ $icon }}</span>
                            <div>
                                <div class="item-name">{{ $item->name }}</div>
                                <div class="item-cycle">Thanh toán {{ $cycle }} · VND</div>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:.8rem;">
                            <span class="item-price">{{ number_format($item->price) }} ₫</span>
                            <form method="POST" action="/cart/clear" style="margin:0;">
                                @csrf
                                <button type="submit" class="btn-remove" title="Xóa">✕</button>
                            </form>
                        </div>
                    </div>
                @endforeach
            </div>

            <!-- Coupon -->
            <div class="card">
                <div class="card-title">Mã giảm giá</div>

                @if($coupon)
                    <div class="coupon-badge">
                        🏷️ {{ $coupon['code'] }} — {{ $coupon['label'] }}
                        <form method="POST" action="/cart/coupon/remove" style="margin:0;">
                            @csrf
                            <button type="submit" title="Xóa mã">✕</button>
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
        </div>

        <!-- Right: summary + checkout -->
        <div class="card">
            <div class="card-title">Tóm tắt đơn hàng</div>

            @foreach($cartItems as $item)
                <div class="summary-row">
                    <span>{{ $item->name }}</span>
                    <span>{{ number_format($item->price) }}<span class="vnd">₫</span></span>
                </div>
            @endforeach

            @if($subTotal != $total)
                <div class="summary-row discount">
                    <span>Giảm giá</span>
                    <span>-{{ number_format($subTotal - $total) }}<span class="vnd">₫</span></span>
                </div>
            @endif

            <div class="summary-row total">
                <span>Tổng cộng</span>
                <span>{{ number_format($total) }}<span class="vnd">₫</span></span>
            </div>

            <!-- Checkout form — JWT token injected by JS -->
            <form method="POST" action="/cart/checkout" id="checkoutForm">
                @csrf
                <input type="hidden" name="_jwt_token" id="jwtField">
                <button type="submit" class="btn-checkout" id="checkoutBtn">
                    Đặt hàng &amp; Thanh toán
                </button>
            </form>
            <p class="secure-note">🔒 Thanh toán an toàn qua PayOS / VietQR</p>
        </div>
    </div>
    @endif
</div>

<!-- ── Auth Modal ──────────────────────────────────────────────────────── -->
<div id="authModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="authModalTitle">
    <div class="modal-box">
        <button class="modal-close-x" onclick="closeAuthModal()" aria-label="Đóng">✕</button>
        <div class="modal-glow">🔐</div>
        <h2 class="modal-title" id="authModalTitle">Đăng nhập để thanh toán</h2>
        <p class="modal-body">
            Bạn cần đăng nhập hoặc tạo tài khoản để thực hiện thanh toán và lưu trữ gói dịch vụ.
        </p>
        <div class="modal-actions">
            <a href="/login?redirect_to=/cart" class="btn-modal-login">Đăng nhập</a>
            <div class="modal-divider"><span></span><em>hoặc</em><span></span></div>
            <a href="/register?redirect_to=/cart" class="btn-modal-register">Đăng ký tài khoản mới</a>
            <button class="btn-modal-dismiss" onclick="closeAuthModal()">Tiếp tục xem giỏ hàng</button>
        </div>
    </div>
</div>

<script>
    // ── Auth modal helpers ────────────────────────────────────────────────
    const authModal = document.getElementById('authModal');

    function openAuthModal() {
        authModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeAuthModal() {
        authModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    // Close on backdrop click
    authModal.addEventListener('click', function (e) {
        if (e.target === authModal) closeAuthModal();
    });
    // Close on Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeAuthModal();
    });

    // ── JWT injection + checkout guard ────────────────────────────────────
    const jwtField     = document.getElementById('jwtField');
    const checkoutForm = document.getElementById('checkoutForm');

    if (jwtField) {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        jwtField.value = token;
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function (e) {
            const token = jwtField ? jwtField.value : '';
            if (!token) {
                e.preventDefault();
                openAuthModal();
            }
        });
    }
</script>
</body>
</html>
