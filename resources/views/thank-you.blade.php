<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Thanh toán thành công — {{ config('app.name', 'Kenfinly') }}</title>
    @php $favicon = \App\Models\AppSetting::where('key','favicon')->value('value'); @endphp
    @if($favicon && file_exists(public_path('storage/'.$favicon)))
        <link rel="icon" href="{{ asset('storage/'.$favicon) }}">
    @else
        <link rel="icon" href="{{ asset('favicon.png') }}">
    @endif
    <style>
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#0f172a; color:#e2e8f0; min-height:100vh; display:flex; flex-direction:column; }

        /* Navbar */
        .navbar { display:flex; align-items:center; justify-content:space-between; padding:1rem 2rem; background:rgba(15,23,42,.9); backdrop-filter:blur(10px); border-bottom:1px solid rgba(99,102,241,.2); }
        .navbar-logo { text-decoration:none; display:flex; align-items:center; gap:.5rem; }
        .navbar-logo img { height:34px; }
        .navbar-logo span { font-size:1.3rem; font-weight:700; color:#818cf8; }

        /* Page */
        .page { flex:1; display:flex; align-items:flex-start; justify-content:center; padding:3rem 1rem 5rem; gap:2rem; flex-wrap:wrap; }

        /* Success icon animation */
        @keyframes pop-in {
            0%   { transform:scale(0.5); opacity:0; }
            70%  { transform:scale(1.1); }
            100% { transform:scale(1);   opacity:1; }
        }
        @keyframes draw-circle {
            0%   { stroke-dashoffset:251; }
            100% { stroke-dashoffset:0; }
        }
        @keyframes draw-check {
            0%   { stroke-dashoffset:80; }
            100% { stroke-dashoffset:0; }
        }

        .success-icon { display:flex; justify-content:center; margin-bottom:1.6rem; animation:pop-in .5s cubic-bezier(.34,1.56,.64,1) both; }
        .success-icon svg { width:88px; height:88px; }
        .circle-bg   { fill:none; stroke:rgba(74,222,128,.15); stroke-width:4; }
        .circle-ring { fill:none; stroke:#4ade80; stroke-width:4; stroke-dasharray:251; stroke-dashoffset:251; stroke-linecap:round; transform-origin:50% 50%; transform:rotate(-90deg); animation:draw-circle .6s .3s ease-out forwards; }
        .check-mark  { fill:none; stroke:#4ade80; stroke-width:5; stroke-dasharray:80; stroke-dashoffset:80; stroke-linecap:round; stroke-linejoin:round; animation:draw-check .4s .85s ease-out forwards; }

        /* Main card */
        .card { background:#1e293b; border:1px solid rgba(74,222,128,.25); border-radius:20px; padding:2.4rem 2rem; width:100%; max-width:500px; text-align:center; box-shadow:0 0 0 1px rgba(74,222,128,.12), 0 20px 60px rgba(0,0,0,.4); }

        .card-title    { font-size:1.55rem; font-weight:800; color:#e2e8f0; margin-bottom:.5rem; }
        .card-subtitle { font-size:.9rem; color:#94a3b8; margin-bottom:2rem; line-height:1.6; }

        /* Subscription banner */
        .sub-banner { background:linear-gradient(135deg,rgba(79,70,229,.18),rgba(124,58,237,.18)); border:1px solid rgba(99,102,241,.3); border-radius:12px; padding:1rem 1.2rem; margin-bottom:1.8rem; display:flex; align-items:center; gap:.9rem; text-align:left; }
        .sub-banner-icon { font-size:1.8rem; flex-shrink:0; }
        .sub-banner-text { flex:1; }
        .sub-banner-label { font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#818cf8; margin-bottom:.2rem; }
        .sub-banner-value { font-size:.95rem; font-weight:700; color:#e2e8f0; }
        .sub-banner-sub   { font-size:.78rem; color:#64748b; margin-top:.1rem; }

        /* Order details */
        .details { background:#0f172a; border-radius:12px; padding:1.2rem 1.4rem; margin-bottom:1.8rem; text-align:left; }
        .details-title { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#475569; margin-bottom:.8rem; }
        .detail-row { display:flex; justify-content:space-between; align-items:center; padding:.45rem 0; border-bottom:1px solid rgba(99,102,241,.08); font-size:.85rem; }
        .detail-row:last-child { border-bottom:none; }
        .detail-label { color:#64748b; }
        .detail-value { font-weight:600; color:#e2e8f0; }
        .detail-value.green  { color:#4ade80; }
        .detail-value.indigo { color:#818cf8; }

        /* Gateway badge */
        .gateway-badge { display:inline-flex; align-items:center; gap:.3rem; background:rgba(99,102,241,.12); border:1px solid rgba(99,102,241,.25); color:#818cf8; font-size:.75rem; font-weight:600; padding:.2rem .6rem; border-radius:999px; }

        /* CTAs */
        .cta-group { display:flex; flex-direction:column; gap:.8rem; }
        .btn-primary { display:block; width:100%; padding:.9rem; background:linear-gradient(135deg,#059669,#10b981); color:#fff; font-size:.95rem; font-weight:700; border-radius:10px; text-align:center; text-decoration:none; box-shadow:0 4px 20px rgba(16,185,129,.25); transition:opacity .2s; }
        .btn-primary:hover { opacity:.9; }
        .btn-secondary { display:block; width:100%; padding:.75rem; background:rgba(99,102,241,.1); border:1px solid rgba(99,102,241,.25); color:#818cf8; font-size:.88rem; font-weight:600; border-radius:10px; text-align:center; text-decoration:none; transition:background .2s; }
        .btn-secondary:hover { background:rgba(99,102,241,.18); }

        /* Side tips */
        .tips-card { background:#1e293b; border:1px solid rgba(99,102,241,.15); border-radius:16px; padding:1.6rem; width:300px; height:fit-content; }
        .tips-title { font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#475569; margin-bottom:1.1rem; }
        .tip { display:flex; gap:.8rem; padding:.55rem 0; }
        .tip-icon { font-size:1.1rem; flex-shrink:0; margin-top:.05rem; }
        .tip-text { font-size:.83rem; color:#94a3b8; line-height:1.55; }
        .tip-text strong { color:#e2e8f0; }

        /* Generic success (no order data) */
        .generic-notice { font-size:.82rem; color:#475569; margin-top:1.5rem; padding-top:1.2rem; border-top:1px solid rgba(99,102,241,.1); }

        @media(max-width:700px){
            .page { flex-direction:column; align-items:center; }
            .tips-card { width:100%; max-width:500px; }
            .card { padding:1.8rem 1.4rem; }
        }
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
    <div style="font-size:.82rem;color:#4ade80;font-weight:600;">✓ Giao dịch thành công</div>
</nav>

<div class="page">

    {{-- ── Main confirmation card ── --}}
    <div class="card">

        {{-- Animated check --}}
        <div class="success-icon">
            <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle class="circle-bg"   cx="44" cy="44" r="40"/>
                <circle class="circle-ring" cx="44" cy="44" r="40"/>
                <polyline class="check-mark" points="27,44 38,55 61,32"/>
            </svg>
        </div>

        <div class="card-title">Thanh toán thành công! 🎉</div>
        <div class="card-subtitle">
            Cảm ơn bạn đã tin dùng Kenfinly.<br>
            Gói đăng ký của bạn đã được kích hoạt ngay lập tức.
        </div>

        @if($order)

            {{-- Subscription banner --}}
            @php
                $planLabels = ['monthly' => 'Gói Tháng', 'yearly' => 'Gói Năm'];
                $planLabel  = $planLabels[$order['plan']] ?? ucfirst($order['plan']);
                $gatewayLabel = $order['gateway'] === 'paypal' ? 'PayPal' : 'VietQR / PayOS';
            @endphp

            <div class="sub-banner">
                <div class="sub-banner-icon">🚀</div>
                <div class="sub-banner-text">
                    <div class="sub-banner-label">Gói đăng ký đã kích hoạt</div>
                    <div class="sub-banner-value">{{ $planLabel }}</div>
                    @if($order['expires_at'])
                        <div class="sub-banner-sub">Có hiệu lực đến {{ $order['expires_at'] }}</div>
                    @endif
                </div>
            </div>

            {{-- Order details --}}
            <div class="details">
                <div class="details-title">Chi tiết đơn hàng</div>

                <div class="detail-row">
                    <span class="detail-label">Mã đơn hàng</span>
                    <span class="detail-value indigo">#{{ $order['order_code'] }}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Gói dịch vụ</span>
                    <span class="detail-value">{{ $planLabel }}</span>
                </div>

                @if(!empty($order['coupon_applied']))
                <div class="detail-row">
                    <span class="detail-label">Mã giảm giá</span>
                    <span class="detail-value green">{{ $order['coupon_applied'] }} (−{{ number_format($order['discount_amount']) }} ₫)</span>
                </div>
                @endif

                <div class="detail-row">
                    <span class="detail-label">Số tiền đã thanh toán</span>
                    <span class="detail-value">
                        @if($order['gateway'] === 'paypal' && !empty($order['amount_usd']))
                            ${{ number_format($order['amount_usd'], 2) }} USD
                        @else
                            {{ number_format($order['total_amount']) }} ₫
                        @endif
                    </span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Phương thức</span>
                    <span class="detail-value"><span class="gateway-badge">{{ $gatewayLabel }}</span></span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Ngày thanh toán</span>
                    <span class="detail-value">{{ $order['paid_at'] }}</span>
                </div>
            </div>

        @else

            {{-- Generic success (user refreshed the page — session flash gone) --}}
            <div class="sub-banner" style="margin-bottom:2rem;">
                <div class="sub-banner-icon">✅</div>
                <div class="sub-banner-text">
                    <div class="sub-banner-label">Đăng ký đã được kích hoạt</div>
                    <div class="sub-banner-value">Gói của bạn đang hoạt động</div>
                    <div class="sub-banner-sub">Đăng nhập để xem chi tiết tài khoản</div>
                </div>
            </div>

        @endif

        {{-- CTAs --}}
        <div class="cta-group">
            <a href="/" class="btn-primary">Vào ứng dụng →</a>
            <a href="/pricing" class="btn-secondary">Xem trang gói dịch vụ</a>
        </div>

        @if($order)
        <div class="generic-notice">
            Một email xác nhận sẽ được gửi đến địa chỉ email đã đăng ký của bạn.<br>
            Cần hỗ trợ? <a href="mailto:purchasevn@getkenka.com" style="color:#818cf8;">purchasevn@getkenka.com</a>
        </div>
        @endif

    </div>

    {{-- ── Side tips ── --}}
    <div class="tips-card">
        <div class="tips-title">Bước tiếp theo</div>

        <div class="tip">
            <div class="tip-icon">📊</div>
            <div class="tip-text"><strong>Khám phá bảng điều khiển</strong> — theo dõi thu nhập, chi tiêu và ngân sách của bạn.</div>
        </div>

        <div class="tip">
            <div class="tip-icon">🏦</div>
            <div class="tip-text"><strong>Kết nối tài khoản ngân hàng</strong> — thêm tài khoản để tự động ghi lại giao dịch.</div>
        </div>

        <div class="tip">
            <div class="tip-icon">🎯</div>
            <div class="tip-text"><strong>Đặt mục tiêu tiết kiệm</strong> — tạo thói quen tiết kiệm hàng ngày với Saving Habit Tracker.</div>
        </div>

        <div class="tip">
            <div class="tip-icon">📥</div>
            <div class="tip-text"><strong>Nhập dữ liệu cũ</strong> — sử dụng tính năng nhập CSV để đưa lịch sử giao dịch vào hệ thống.</div>
        </div>

        <div class="tip" style="margin-top:.5rem;padding-top:1rem;border-top:1px solid rgba(99,102,241,.12);">
            <div class="tip-icon">💬</div>
            <div class="tip-text">
                Câu hỏi? <a href="mailto:purchasevn@getkenka.com" style="color:#818cf8;">Liên hệ đội ngũ hỗ trợ</a>
            </div>
        </div>
    </div>

</div>

</body>
</html>
