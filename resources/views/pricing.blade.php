<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bảng Giá — {{ config('app.name', 'Kenfinly') }}</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @php
        $favicon = \App\Models\AppSetting::where('key', 'favicon')->value('value');
    @endphp
    @if($favicon && file_exists(public_path('storage/' . $favicon)))
        <link rel="icon" href="{{ asset('storage/' . $favicon) }}">
    @else
        <link rel="icon" href="{{ asset('favicon.png') }}">
    @endif
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            min-height: 100vh;
        }

        /* ── Navbar ── */
        .navbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 2rem;
            background: rgba(15,23,42,0.9);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(99,102,241,0.2);
            position: sticky;
            top: 0;
            z-index: 50;
        }
        .navbar-logo { text-decoration: none; display: flex; align-items: center; gap: 0.5rem; }
        .navbar-logo img { height: 36px; }
        .navbar-logo span { font-size: 1.4rem; font-weight: 700; color: #818cf8; letter-spacing: -0.5px; }
        .navbar-links { display: flex; gap: 1rem; align-items: center; }
        .navbar-links a {
            color: #94a3b8;
            text-decoration: none;
            font-size: 0.9rem;
            padding: 0.4rem 0.9rem;
            border-radius: 6px;
            transition: all 0.2s;
        }
        .navbar-links a:hover { color: #e2e8f0; background: rgba(99,102,241,0.15); }
        .btn-nav-login {
            background: #4f46e5 !important;
            color: #fff !important;
            font-weight: 600;
        }
        .btn-nav-login:hover { background: #4338ca !important; }

        /* ── Currency pill ── */
        .currency-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            background: rgba(99,102,241,0.1);
            border: 1px solid rgba(99,102,241,0.3);
            color: #818cf8;
            font-size: 0.78rem;
            font-weight: 600;
            padding: 0.3rem 0.75rem;
            border-radius: 999px;
            margin-left: 0.5rem;
        }
        .currency-pill.usd { background: rgba(251,191,36,0.08); border-color: rgba(251,191,36,0.3); color: #fbbf24; }

        /* ── Hero ── */
        .hero { text-align: center; padding: 5rem 1rem 3rem; }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            background: rgba(99,102,241,0.15);
            border: 1px solid rgba(99,102,241,0.4);
            color: #818cf8;
            font-size: 0.8rem;
            font-weight: 600;
            padding: 0.35rem 0.9rem;
            border-radius: 999px;
            margin-bottom: 1.5rem;
            letter-spacing: 0.03em;
            text-transform: uppercase;
        }
        .hero h1 {
            font-size: clamp(1.8rem, 4.5vw, 3rem);
            font-weight: 800;
            line-height: 1.2;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #e2e8f0 30%, #818cf8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .hero p {
            color: #94a3b8;
            font-size: 1.05rem;
            max-width: 520px;
            margin: 0 auto 0.5rem;
        }
        .trial-note { color: #4ade80; font-size: 0.85rem; font-weight: 600; margin-top: 0.5rem; }
        .currency-note {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.8rem;
            font-weight: 500;
            margin-top: 0.75rem;
            padding: 0.35rem 0.9rem;
            border-radius: 999px;
        }
        .currency-note.vnd { background: rgba(79,70,229,0.12); border: 1px solid rgba(79,70,229,0.28); color: #818cf8; }
        .currency-note.usd { background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.28); color: #fbbf24; }

        /* ── Flash ── */
        .flash {
            max-width: 480px;
            margin: 1.5rem auto 0;
            padding: 0.8rem 1.2rem;
            border-radius: 10px;
            font-size: 0.9rem;
            font-weight: 500;
            text-align: center;
        }
        .flash-success { background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.35); color: #4ade80; }
        .flash-cancel  { background: rgba(251,191,36,0.12);  border: 1px solid rgba(251,191,36,0.35);  color: #fbbf24; }

        /* ── Cards ── */
        .cards-wrapper {
            display: flex;
            flex-wrap: wrap;
            gap: 1.5rem;
            justify-content: center;
            padding: 1rem 1.5rem 5rem;
            max-width: 1100px;
            margin: 0 auto;
        }
        .card {
            background: #1e293b;
            border: 1px solid rgba(99,102,241,0.2);
            border-radius: 18px;
            padding: 2rem 1.8rem;
            width: 320px;
            display: flex;
            flex-direction: column;
            transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
            position: relative;
            overflow: hidden;
        }
        .card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }

        .card.featured {
            border-color: #4f46e5;
            background: linear-gradient(160deg, #1e1b4b 0%, #1e293b 100%);
            box-shadow: 0 0 0 1px #4f46e5, 0 8px 32px rgba(79,70,229,0.25);
        }
        .card.featured:hover { box-shadow: 0 0 0 1px #4f46e5, 0 24px 48px rgba(79,70,229,0.35); }

        .popular-badge {
            position: absolute;
            top: 0; right: 1.5rem;
            background: linear-gradient(90deg, #4f46e5, #7c3aed);
            color: #fff;
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 0.3rem 0.8rem;
            border-radius: 0 0 10px 10px;
        }

        .plan-icon { font-size: 2rem; margin-bottom: 0.8rem; }
        .plan-name { font-size: 1.25rem; font-weight: 700; color: #e2e8f0; margin-bottom: 0.3rem; }
        .plan-desc { color: #64748b; font-size: 0.85rem; margin-bottom: 1.5rem; }

        .price-block { margin-bottom: 1.8rem; }
        .price-row { display: flex; align-items: baseline; gap: 0.2rem; }
        .price-amount { font-size: 2.4rem; font-weight: 800; color: #e2e8f0; line-height: 1; }
        .price-amount.free { color: #4ade80; }
        .price-symbol { font-size: 1.1rem; color: #94a3b8; margin-left: 2px; }
        .price-period { font-size: 0.85rem; color: #64748b; margin-top: 0.25rem; }
        .price-saving { font-size: 0.78rem; color: #4ade80; font-weight: 600; margin-top: 0.3rem; }
        .price-secondary {
            font-size: 0.78rem;
            color: #475569;
            margin-top: 0.3rem;
        }
        .price-secondary em { font-style: normal; color: #64748b; }

        .divider { height: 1px; background: rgba(99,102,241,0.15); margin-bottom: 1.5rem; }

        .features-heading { font-size: 0.78rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.8rem; }

        .features-list { list-style: none; flex: 1; margin-bottom: 2rem; }
        .features-list li {
            display: flex;
            align-items: flex-start;
            gap: 0.6rem;
            font-size: 0.88rem;
            color: #cbd5e1;
            padding: 0.35rem 0;
        }
        .check { color: #4ade80; font-size: 0.9rem; flex-shrink: 0; margin-top: 1px; }

        /* ── Buttons ── */
        .btn {
            display: block;
            width: 100%;
            padding: 0.85rem 1rem;
            border-radius: 10px;
            font-size: 0.95rem;
            font-weight: 700;
            text-align: center;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
            text-decoration: none;
        }
        .btn-free {
            background: rgba(99,102,241,0.12);
            border: 1px solid rgba(99,102,241,0.3);
            color: #818cf8;
        }
        .btn-free:hover { background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.5); }
        .btn-primary {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: #fff;
            box-shadow: 0 4px 15px rgba(79,70,229,0.35);
        }
        .btn-primary:hover {
            background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
            box-shadow: 0 6px 20px rgba(79,70,229,0.5);
            transform: translateY(-1px);
        }
        .btn-teal {
            background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
            color: #fff;
            box-shadow: 0 4px 15px rgba(8,145,178,0.3);
        }
        .btn-teal:hover {
            background: linear-gradient(135deg, #0d6460 0%, #0779a0 100%);
            box-shadow: 0 6px 20px rgba(8,145,178,0.45);
            transform: translateY(-1px);
        }

        /* ── Footer strip ── */
        .footer-strip {
            text-align: center;
            padding: 0 1.5rem 4rem;
            color: #64748b;
            font-size: 0.88rem;
        }
        .footer-strip a { color: #818cf8; text-decoration: none; }
        .footer-strip a:hover { text-decoration: underline; }

        @media (max-width: 640px) {
            .cards-wrapper { gap: 1rem; }
            .card { width: 100%; max-width: 360px; }
        }

        /* ── Auth-aware navbar ────────────────────────────────────────────── */
        .nav-user-chip { display:flex; align-items:center; gap:.6rem; }
        .nav-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,#4f46e5,#7c3aed); display:flex; align-items:center; justify-content:center; font-size:.85rem; font-weight:800; color:#fff; flex-shrink:0; }
        .nav-username { font-size:.85rem; color:#e2e8f0; font-weight:600; max-width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .btn-nav-dashboard { color:#818cf8; text-decoration:none; font-size:.82rem; font-weight:600; padding:.38rem .85rem; border-radius:8px; background:rgba(99,102,241,.12); border:1px solid rgba(99,102,241,.3); transition:all .2s; white-space:nowrap; }
        .btn-nav-dashboard:hover { background:rgba(99,102,241,.22); color:#a5b4fc; }

        /* ── Auth Modal ───────────────────────────────────────────────────── */
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
    // ── Currency resolution ─────────────────────────────────────────────
    // $currency and $defaultGateway are passed from the route closure in
    // web.php via CurrencyService. If the view is rendered without them
    // (e.g. direct artisan tinker), fall back to VND gracefully.
    $currency       = $currency       ?? 'VND';
    $defaultGateway = $defaultGateway ?? 'payos';
    $isUsd          = $currency === 'USD';

    // Plan amounts — each gateway uses its own config:
    //   PayOS  → config/payos.php  → plans.*.amount      (VND integer)
    //   PayPal → config/paypal.php → plans.*.amount_usd  (USD float)
    $monthlyVnd = config('payos.plans.monthly.amount');
    $yearlyVnd  = config('payos.plans.yearly.amount');
    $monthlyUsd = config('paypal.plans.monthly.amount_usd');
    $yearlyUsd  = config('paypal.plans.yearly.amount_usd');

    // What the visitor actually sees
    $monthlyDisplay = $isUsd ? ('$' . number_format($monthlyUsd, 2))   : number_format($monthlyVnd);
    $monthlySymbol  = $isUsd ? ''                                        : '₫';
    $monthlyPeriod  = $isUsd ? 'per month · USD'                         : 'hàng tháng · VND';

    $yearlyDisplay  = $isUsd ? ('$' . number_format($yearlyUsd, 2))    : number_format($yearlyVnd);
    $yearlySymbol   = $isUsd ? ''                                        : '₫';
    $yearlyPeriod   = $isUsd ? 'per year · USD'                          : 'hàng năm · VND';

    // Savings label
    $savingPct = 0;
    if ($isUsd) {
        $monthlyAnnual = $monthlyUsd * 12;
        $savingPct     = $monthlyAnnual > 0 ? round(100 - ($yearlyUsd / $monthlyAnnual) * 100) : 0;
    } else {
        $monthlyCost = $monthlyVnd * 12;
        $savingPct   = $monthlyCost > 0 ? round(100 - ($yearlyVnd / $monthlyCost) * 100) : 0;
    }

    // Checkout links — gateway hint pre-fills the selector on OPC
    $gatewayParam    = $isUsd ? '&gateway=paypal' : '';
    $checkoutMonthly = '/checkout?plan=monthly' . $gatewayParam;
    $checkoutYearly  = '/checkout?plan=yearly'  . $gatewayParam;
@endphp

<!-- Navbar -->
<nav class="navbar">
    <a href="/" class="navbar-logo">
        @if(file_exists(public_path('logos/logo-white.png')))
            <img src="{{ asset('logos/logo-white.png') }}" alt="{{ config('app.name') }}">
        @else
            <span>{{ config('app.name', 'Kenfinly') }}</span>
        @endif
    </a>
    <div class="navbar-links">
        <a href="/">Trang chủ</a>
        <a href="/pricing" style="color:#818cf8;">Bảng giá</a>
        @if($isUsd)
            <span class="currency-pill usd">🌐 USD</span>
        @else
            <span class="currency-pill">🇻🇳 VND</span>
        @endif
        {{-- Auth area: JS replaces this with user chip when a valid JWT exists --}}
        <div id="navAuthArea">
            <a href="/SignIn" class="btn-nav-login" id="navLoginBtn">Đăng nhập</a>
        </div>
    </div>
</nav>

<!-- Hero -->
<section class="hero">
    <div class="badge">💎 Bảng Giá Dịch Vụ</div>
    <h1>Chọn gói dịch vụ phù hợp cho bạn</h1>
    <p>Mở khóa các tính năng cao cấp và làm chủ tài chính của bạn.</p>
    <p class="trial-note">✓ Tất cả tài khoản mới được dùng thử 7 ngày miễn phí</p>

    @if($isUsd)
        <div class="currency-note usd">
            🌐 Prices shown in <strong>USD</strong> — payment via PayPal
        </div>
    @else
        <div class="currency-note vnd">
            🇻🇳 Giá hiển thị bằng <strong>VND</strong> — thanh toán qua VietQR
        </div>
    @endif

    @php $payment = request('payment'); @endphp
    @if($payment === 'success')
        <div class="flash flash-success">🎉 Thanh toán thành công! Gói đăng ký của bạn đã được kích hoạt.</div>
    @elseif($payment === 'cancelled')
        <div class="flash flash-cancel">⚠️ Thanh toán đã bị hủy. Gói dịch vụ của bạn không thay đổi.</div>
    @endif
</section>

<!-- Cards -->
<div class="cards-wrapper">

    <!-- MIỄN PHÍ / FREE -->
    <div class="card">
        <div class="plan-icon">🆓</div>
        <div class="plan-name">{{ $isUsd ? 'Free' : 'Miễn Phí' }}</div>
        <div class="plan-desc">{{ $isUsd ? 'Basic features for personal use' : 'Các tính năng cơ bản cho mục đích sử dụng cá nhân' }}</div>

        <div class="price-block">
            <div class="price-row">
                <span class="price-amount free">0</span>
                <span class="price-symbol">{{ $isUsd ? '' : '₫' }}</span>
            </div>
            <div class="price-period">{{ $isUsd ? 'forever · no credit card' : 'vĩnh viễn · không cần thẻ tín dụng' }}</div>
        </div>

        <div class="divider"></div>
        <div class="features-heading">{{ $isUsd ? "What's included" : 'Bao gồm những gì' }}</div>

        <ul class="features-list">
            <li><span class="check">✓</span> {{ $isUsd ? 'Basic tracking' : 'Theo dõi cơ bản' }}</li>
            <li><span class="check">✓</span> {{ $isUsd ? '1 Account' : '1 Tài khoản' }}</li>
            <li><span class="check">✓</span> {{ $isUsd ? 'Standard support' : 'Hỗ trợ tiêu chuẩn' }}</li>
        </ul>

        <a href="/login" class="btn btn-free">{{ $isUsd ? 'Get started free' : 'Bắt đầu miễn phí' }}</a>
    </div>

    <!-- CHUYÊN NGHIỆP (Monthly — Featured) -->
    <div class="card featured">
        <div class="popular-badge">{{ $isUsd ? 'Most Popular' : 'Phổ biến nhất' }}</div>
        <div class="plan-icon">🚀</div>
        <div class="plan-name">{{ $isUsd ? 'Professional' : 'Chuyên nghiệp' }}</div>
        <div class="plan-desc">{{ $isUsd ? 'Advanced features for power users' : 'Các tính năng nâng cao dành cho người đam mê' }}</div>

        <div class="price-block">
            <div class="price-row">
                <span class="price-amount">{{ $monthlyDisplay }}</span>
                @if($monthlySymbol)<span class="price-symbol">{{ $monthlySymbol }}</span>@endif
            </div>
            <div class="price-period">{{ $monthlyPeriod }}</div>
            @if($isUsd)
                <div class="price-secondary">
                    ≈ <em>{{ number_format($monthlyVnd) }} ₫</em> for Vietnamese users
                </div>
            @endif
        </div>

        <div class="divider"></div>
        <div class="features-heading">{{ $isUsd ? "What's included" : 'Bao gồm những gì' }}</div>

        <ul class="features-list">
            <li><span class="check">✓</span> {{ $isUsd ? 'Calendar view' : 'Chế độ xem lịch' }}</li>
            <li><span class="check">✓</span> {{ $isUsd ? 'Advanced data visualization' : 'Trực quan hóa dữ liệu nâng cao' }}</li>
            <li><span class="check">✓</span> {{ $isUsd ? 'Filtering & sorting' : 'Lọc và sắp xếp' }}</li>
            <li><span class="check">✓</span> {{ $isUsd ? 'Time-based analytics' : 'Phân tích theo thời gian' }}</li>
            <li><span class="check">✓</span> {{ $isUsd ? 'Predictive insights' : 'Thông tin dự đoán' }}</li>
            <li><span class="check">✓</span> {{ $isUsd ? 'Export reports (PDF, CSV, Excel)' : 'Xuất báo cáo (PDF, CSV, Excel)' }}</li>
        </ul>

        <button type="button" onclick="requireAuth('{{ addslashes($checkoutMonthly) }}')" class="btn btn-primary">
            {{ $isUsd ? 'Buy now — Monthly' : 'Mua ngay — Hàng tháng' }}
        </button>
    </div>

    <!-- PRO HÀNG NĂM (Yearly) -->
    <div class="card">
        <div class="plan-icon">🏆</div>
        <div class="plan-name">{{ $isUsd ? 'Pro Annual' : 'Pro Hàng Năm' }}</div>
        <div class="plan-desc">{{ $isUsd ? 'Best value for power users' : 'Giá trị tốt nhất cho người dùng chuyên sâu' }}</div>

        <div class="price-block">
            <div class="price-row">
                <span class="price-amount">{{ $yearlyDisplay }}</span>
                @if($yearlySymbol)<span class="price-symbol">{{ $yearlySymbol }}</span>@endif
            </div>
            <div class="price-period">{{ $yearlyPeriod }}</div>
            @if($isUsd)
                <div class="price-secondary">
                    ≈ <em>{{ number_format($yearlyVnd) }} ₫</em> for Vietnamese users
                </div>
            @endif
            @if($savingPct > 0)
                <div class="price-saving">💰 {{ $isUsd ? "Save ~{$savingPct}% vs monthly" : "Tiết kiệm ~{$savingPct}% so với gói tháng" }}</div>
            @endif
        </div>

        <div class="divider"></div>
        <div class="features-heading">{{ $isUsd ? "What's included" : 'Bao gồm những gì' }}</div>

        <ul class="features-list">
            <li><span class="check">✓</span> {{ $isUsd ? 'All Pro Monthly features' : 'Tất cả tính năng của gói Pro hàng tháng' }}</li>
            <li><span class="check">✓</span> {{ $isUsd ? 'Annual discount applied' : 'Giảm giá hàng năm' }}</li>
        </ul>

        <button type="button" onclick="requireAuth('{{ addslashes($checkoutYearly) }}')" class="btn btn-teal">
            {{ $isUsd ? 'Buy now — Annual' : 'Mua ngay — Hàng năm' }}
        </button>
    </div>

</div>

<div class="footer-strip">
    @if($isUsd)
        All payments securely processed via <strong style="color:#e2e8f0;">PayPal</strong>. &nbsp;
        Vietnamese users pay via <strong style="color:#e2e8f0;">PayOS / VietQR</strong>. &nbsp;
    @else
        Tất cả thanh toán được xử lý an toàn qua <strong style="color:#e2e8f0;">PayOS / VietQR</strong>. &nbsp;
        Khách quốc tế thanh toán qua <strong style="color:#e2e8f0;">PayPal</strong>. &nbsp;
    @endif
    {{ $isUsd ? 'Questions?' : 'Câu hỏi?' }} <a href="mailto:{{ config('mail.from.address', 'purchasevn@getkenka.com') }}">{{ $isUsd ? 'Contact us' : 'Liên hệ chúng tôi' }}</a>
</div>

{{-- ── Auth Gate Modal ────────────────────────────────────────────────────── --}}
{{-- Shown when a guest clicks "Buy Now". JS updates the login/register links  --}}
{{-- with the intended checkout URL (?redirect_to=...) before opening.         --}}
<div id="authModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="authModalTitle">
    <div class="modal-box">
        <button class="modal-close-x" onclick="closeAuthModal()" aria-label="Đóng">✕</button>
        <div class="modal-glow">🔐</div>
        <h2 class="modal-title" id="authModalTitle">{{ $isUsd ? 'Sign in to continue' : 'Đăng nhập để tiếp tục' }}</h2>
        <p class="modal-body">
            {{ $isUsd
                ? 'You need an account to purchase a plan and activate your Kenfinly subscription.'
                : 'Bạn cần đăng nhập hoặc tạo tài khoản để mua gói dịch vụ và bắt đầu sử dụng Kenfinly.' }}
        </p>
        <div class="modal-actions">
            <a id="modalLoginLink" href="/SignIn?redirect_to=/checkout" class="btn-modal-login">
                {{ $isUsd ? 'Sign in' : 'Đăng nhập' }}
            </a>
            <div class="modal-divider"><span></span><em>{{ $isUsd ? 'or' : 'hoặc' }}</em><span></span></div>
            <a id="modalRegisterLink" href="/SignUp?redirect_to=/checkout" class="btn-modal-register">
                {{ $isUsd ? 'Create a new account' : 'Đăng ký tài khoản mới' }}
            </a>
            <button class="btn-modal-dismiss" onclick="closeAuthModal()">
                {{ $isUsd ? 'Continue browsing' : 'Tiếp tục xem trang' }}
            </button>
        </div>
    </div>
</div>

<script>
(function () {
    'use strict';

    // ── JWT helpers ───────────────────────────────────────────────────────────
    // Decode the payload section of a JWT. Returns null on any parse error.
    function getJwtPayload(t) {
        try {
            const b64 = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(b64));
        } catch (e) { return null; }
    }

    /**
     * Return { token, payload } if a valid, non-expired JWT is found in
     * localStorage/sessionStorage.  Returns null and clears stale storage if
     * the token is absent, malformed, or expired.
     */
    function getValidAuth() {
        const t = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        if (!t) return null;

        const payload = getJwtPayload(t);
        if (!payload) {
            // Malformed token — remove to avoid confusion
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            return null;
        }

        // exp is in seconds; allow 30-second clock-skew buffer
        if (payload.exp && (Date.now() / 1000) > (payload.exp - 30)) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('user');
            return null;
        }

        return { token: t, payload };
    }

    // ── Navbar: show user chip when authenticated ─────────────────────────────
    function initNavbar() {
        const auth = getValidAuth();
        const area = document.getElementById('navAuthArea');
        if (!area || !auth) return;   // guest: leave "Đăng nhập" button as-is

        // Read display name from the stored user object or JWT payload
        let name = '', email = '';
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const u = JSON.parse(stored);
                name  = u.name  || u.full_name || '';
                email = u.email || '';
            }
        } catch (e) {}

        if (!name && auth.payload) {
            name  = auth.payload.name  || '';
            email = auth.payload.email || auth.payload.sub || '';
        }

        const displayName = name || email || 'Tài khoản';
        const initial     = displayName.charAt(0).toUpperCase();
        const dashLabel   = '{{ $isUsd ? "Dashboard →" : "Bảng điều khiển →" }}';

        area.innerHTML =
            '<div class="nav-user-chip">' +
                '<div class="nav-avatar">' + initial + '</div>' +
                '<span class="nav-username">' + escHtml(displayName) + '</span>' +
                '<a href="/" class="btn-nav-dashboard">' + dashLabel + '</a>' +
            '</div>';
    }

    function escHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── "Buy Now" auth gate ───────────────────────────────────────────────────
    /**
     * Called by every "Buy Now" button's onclick.
     * If the user has a valid JWT  → navigate to the checkout URL immediately.
     * If the user is a guest       → open the login modal, pre-wiring its links
     *                                to redirect back to the intended checkout URL
     *                                after the user authenticates.
     */
    window.requireAuth = function (url) {
        if (getValidAuth()) {
            window.location.href = url;
        } else {
            openAuthModal(url);
        }
    };

    // ── Auth modal ────────────────────────────────────────────────────────────
    const authModal = document.getElementById('authModal');

    function openAuthModal(redirectUrl) {
        const dest       = redirectUrl || '/checkout';
        const encoded    = encodeURIComponent(dest);
        const loginLink  = document.getElementById('modalLoginLink');
        const regLink    = document.getElementById('modalRegisterLink');

        if (loginLink)  loginLink.href  = '/SignIn?redirect_to=' + encoded;
        if (regLink)    regLink.href    = '/SignUp?redirect_to=' + encoded;

        authModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    window.closeAuthModal = function () {
        authModal.classList.remove('open');
        document.body.style.overflow = '';
    };

    if (authModal) {
        // Close on backdrop click
        authModal.addEventListener('click', function (e) {
            if (e.target === authModal) window.closeAuthModal();
        });
        // Close on Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') window.closeAuthModal();
        });
    }

    // ── Initialise on DOM ready ───────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavbar);
    } else {
        initNavbar();
    }
}());
</script>

</body>
</html>
