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
        .navbar-links { display: flex; gap: 1rem; }
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
        .btn.loading { opacity: 0.7; pointer-events: none; }
        .btn.loading::after { content: ' ⏳'; }

        .inline-error {
            display: none;
            color: #f87171;
            font-size: 0.8rem;
            text-align: center;
            margin-top: 0.6rem;
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
    </style>
</head>
<body>

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
        <a href="/login" class="btn-nav-login">Đăng nhập</a>
    </div>
</nav>

<!-- Hero -->
<section class="hero">
    <div class="badge">💎 Bảng Giá Dịch Vụ</div>
    <h1>Chọn gói dịch vụ phù hợp cho bạn</h1>
    <p>Mở khóa các tính năng cao cấp và làm chủ tài chính của bạn.</p>
    <p class="trial-note">✓ Tất cả tài khoản mới được dùng thử 7 ngày miễn phí</p>

    @php $payment = request('payment'); @endphp
    @if($payment === 'success')
        <div class="flash flash-success">🎉 Thanh toán thành công! Gói đăng ký của bạn đã được kích hoạt.</div>
    @elseif($payment === 'cancelled')
        <div class="flash flash-cancel">⚠️ Thanh toán đã bị hủy. Gói dịch vụ của bạn không thay đổi.</div>
    @endif
</section>

<!-- Cards -->
<div class="cards-wrapper">

    <!-- MIỄN PHÍ -->
    <div class="card">
        <div class="plan-icon">🆓</div>
        <div class="plan-name">Miễn Phí</div>
        <div class="plan-desc">Các tính năng cơ bản cho mục đích sử dụng cá nhân</div>

        <div class="price-block">
            <div class="price-row">
                <span class="price-amount free">0</span>
                <span class="price-symbol">₫</span>
            </div>
            <div class="price-period">vĩnh viễn · không cần thẻ tín dụng</div>
        </div>

        <div class="divider"></div>
        <div class="features-heading">Bao gồm những gì</div>

        <ul class="features-list">
            <li><span class="check">✓</span> Theo dõi cơ bản</li>
            <li><span class="check">✓</span> 1 Tài khoản</li>
            <li><span class="check">✓</span> Hỗ trợ tiêu chuẩn</li>
        </ul>

        <a href="/login" class="btn btn-free">Bắt đầu miễn phí</a>
    </div>

    <!-- CHUYÊN NGHIỆP (Monthly — Featured) -->
    <div class="card featured">
        <div class="popular-badge">Phổ biến nhất</div>
        <div class="plan-icon">🚀</div>
        <div class="plan-name">Chuyên nghiệp</div>
        <div class="plan-desc">Các tính năng nâng cao dành cho người đam mê</div>

        <div class="price-block">
            <div class="price-row">
                <span class="price-amount">{{ number_format(config('payos.plans.monthly.amount')) }}</span>
                <span class="price-symbol">₫</span>
            </div>
            <div class="price-period">hàng tháng · VND</div>
        </div>

        <div class="divider"></div>
        <div class="features-heading">Bao gồm những gì</div>

        <ul class="features-list">
            <li><span class="check">✓</span> Chế độ xem lịch</li>
            <li><span class="check">✓</span> Trực quan hóa dữ liệu nâng cao</li>
            <li><span class="check">✓</span> Lọc và sắp xếp</li>
            <li><span class="check">✓</span> Phân tích theo thời gian</li>
            <li><span class="check">✓</span> Thông tin dự đoán</li>
            <li><span class="check">✓</span> Xuất báo cáo (PDF, CSV, Excel)</li>
        </ul>

        <a href="/cart?plan=monthly" class="btn btn-primary">Mua ngay — Hàng tháng</a>
    </div>

    <!-- PRO HÀNG NĂM (Yearly) -->
    <div class="card">
        <div class="plan-icon">🏆</div>
        <div class="plan-name">Pro Hàng Năm</div>
        <div class="plan-desc">Giá trị tốt nhất cho người dùng chuyên sâu</div>

        <div class="price-block">
            <div class="price-row">
                <span class="price-amount">{{ number_format(config('payos.plans.yearly.amount')) }}</span>
                <span class="price-symbol">₫</span>
            </div>
            <div class="price-period">hàng năm · VND</div>
            @php
                $monthlyCost = config('payos.plans.monthly.amount') * 12;
                $yearlyCost  = config('payos.plans.yearly.amount');
                $saving      = $monthlyCost > 0 ? round(100 - ($yearlyCost / $monthlyCost) * 100) : 0;
            @endphp
            @if($saving > 0)
                <div class="price-saving">💰 Tiết kiệm ~{{ $saving }}% so với gói tháng</div>
            @endif
        </div>

        <div class="divider"></div>
        <div class="features-heading">Bao gồm những gì</div>

        <ul class="features-list">
            <li><span class="check">✓</span> Tất cả tính năng của gói Pro hàng tháng</li>
            <li><span class="check">✓</span> Giảm giá hàng năm</li>
        </ul>

        <a href="/cart?plan=yearly" class="btn btn-teal">Mua ngay — Hàng năm</a>
    </div>

</div>

<div class="footer-strip">
    Tất cả thanh toán được xử lý an toàn qua <strong style="color:#e2e8f0;">PayOS / VietQR</strong>. &nbsp;
    Câu hỏi? <a href="mailto:{{ config('mail.from.address', 'purchasevn@getkenka.com') }}">Liên hệ chúng tôi</a>
</div>

<script>
    async function buyPlan(plan, btn) {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        if (!token) {
            window.location.href = '/login?redirect=pricing&plan=' + plan;
            return;
        }

        btn.classList.add('loading');
        const errEl = document.getElementById('err-' + plan);
        errEl.style.display = 'none';

        try {
            const res = await fetch('/api/payment/payos/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({ plan }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Không thể tạo liên kết thanh toán.');
            }

            window.location.href = data.checkout_url;
        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
            btn.classList.remove('loading');
        }
    }
</script>
</body>
</html>
