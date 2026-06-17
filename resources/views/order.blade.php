<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Thanh Toán #{{ $order->order_code }} — {{ config('app.name', 'Kenfinly') }}</title>
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
        .page { flex:1; display:flex; align-items:flex-start; justify-content:center; padding:2.5rem 1rem 4rem; gap:2rem; flex-wrap:wrap; }

        /* QR Card */
        .qr-card { background:#1e293b; border:1px solid rgba(99,102,241,.25); border-radius:20px; padding:2rem; width:340px; text-align:center; }
        .qr-card.expired { opacity:.55; pointer-events:none; }
        .qr-card.paid    { border-color:#4ade80; box-shadow:0 0 0 1px #4ade80, 0 8px 32px rgba(74,222,128,.2); }

        .qr-status-badge { display:inline-flex; align-items:center; gap:.4rem; font-size:.75rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; padding:.3rem .8rem; border-radius:999px; margin-bottom:1rem; }
        .badge-pending  { background:rgba(251,191,36,.12); border:1px solid rgba(251,191,36,.3); color:#fbbf24; }
        .badge-paid     { background:rgba(74,222,128,.12); border:1px solid rgba(74,222,128,.3); color:#4ade80; }
        .badge-expired  { background:rgba(248,113,113,.12); border:1px solid rgba(248,113,113,.3); color:#f87171; }

        .qr-title { font-size:1rem; font-weight:700; color:#e2e8f0; margin-bottom:.3rem; }
        .qr-subtitle { font-size:.82rem; color:#64748b; margin-bottom:1.4rem; }

        /* QR Image */
        .qr-frame { background:#fff; border-radius:14px; padding:1rem; display:inline-flex; align-items:center; justify-content:center; margin-bottom:1.2rem; position:relative; }
        .qr-frame img { display:block; width:220px; height:220px; border-radius:4px; }
        .qr-overlay { position:absolute; inset:0; background:rgba(15,23,42,.75); backdrop-filter:blur(4px); border-radius:14px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.4rem; }
        .qr-overlay-icon { font-size:2.5rem; }
        .qr-overlay-text { font-size:.85rem; font-weight:700; color:#f87171; }

        .qr-placeholder { width:220px; height:220px; background:#1e293b; border:2px dashed rgba(99,102,241,.3); border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.5rem; color:#475569; font-size:.8rem; }
        .qr-placeholder span { font-size:2rem; }

        /* Countdown */
        .countdown-wrap { margin-bottom:1.2rem; }
        .countdown-label { font-size:.75rem; color:#64748b; margin-bottom:.4rem; }
        .countdown { font-size:2.4rem; font-weight:800; letter-spacing:.05em; font-variant-numeric:tabular-nums; }
        .countdown.warning { color:#fbbf24; }
        .countdown.danger  { color:#f87171; }
        .countdown.done    { color:#f87171; font-size:1.6rem; }

        .progress-bar-bg { background:#0f172a; border-radius:999px; height:4px; margin-top:.5rem; overflow:hidden; }
        .progress-bar    { background:linear-gradient(90deg,#4f46e5,#7c3aed); height:100%; border-radius:999px; transition:width 1s linear; }

        /* Info rows */
        .info-grid { text-align:left; margin-top:1.2rem; }
        .info-row { display:flex; justify-content:space-between; padding:.4rem 0; border-bottom:1px solid rgba(99,102,241,.1); font-size:.85rem; }
        .info-row:last-child { border-bottom:none; }
        .info-label { color:#64748b; }
        .info-value { font-weight:600; color:#e2e8f0; }

        /* Checkout link fallback */
        .fallback-link { display:inline-block; margin-top:1rem; color:#818cf8; font-size:.82rem; word-break:break-all; }

        /* Right panel */
        .side-panel { width:320px; }
        .panel-card { background:#1e293b; border:1px solid rgba(99,102,241,.2); border-radius:16px; padding:1.6rem; margin-bottom:1.2rem; }
        .panel-title { font-size:.8rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.06em; margin-bottom:1rem; }

        .step { display:flex; gap:.8rem; padding:.6rem 0; }
        .step-num { width:24px; height:24px; border-radius:50%; background:rgba(99,102,241,.2); border:1px solid rgba(99,102,241,.4); color:#818cf8; font-size:.75rem; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .step-text { font-size:.85rem; color:#94a3b8; line-height:1.5; }

        .btn-back { display:block; width:100%; padding:.8rem; background:rgba(99,102,241,.1); border:1px solid rgba(99,102,241,.25); color:#818cf8; font-size:.9rem; font-weight:600; border-radius:10px; text-align:center; text-decoration:none; transition:all .2s; cursor:pointer; }
        .btn-back:hover { background:rgba(99,102,241,.2); }
        .btn-paid { display:block; width:100%; padding:.9rem; background:linear-gradient(135deg,#059669,#10b981); color:#fff; font-size:.95rem; font-weight:700; border:none; border-radius:10px; text-align:center; text-decoration:none; box-shadow:0 4px 15px rgba(16,185,129,.3); }

        @media(max-width:700px){
            .page { flex-direction:column; align-items:center; }
            .side-panel { width:100%; max-width:360px; }
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
    <div style="font-size:.85rem;color:#64748b;">Mã đơn: <strong style="color:#818cf8;">#{{ $order->order_code }}</strong></div>
</nav>

<div class="page">

    {{-- ── QR Card ── --}}
    <div class="qr-card {{ $order->status }}" id="qrCard">

        {{-- Status badge --}}
        @if($order->isPaid())
            <div class="qr-status-badge badge-paid">✓ Đã thanh toán</div>
        @elseif($order->isExpired())
            <div class="qr-status-badge badge-expired">⏱ Hết hạn</div>
        @else
            <div class="qr-status-badge badge-pending" id="statusBadge">⏳ Chờ thanh toán</div>
        @endif

        <div class="qr-title">Quét mã để thanh toán</div>
        <div class="qr-subtitle">Sử dụng app ngân hàng hỗ trợ VietQR</div>

        {{-- QR image --}}
        <div class="qr-frame" id="qrFrame">
            @if($order->isPaid())
                <img src="{{ asset('logos/logo-white.png') }}" alt="paid" style="width:120px;height:120px;object-fit:contain;">
                <div class="qr-overlay" style="background:rgba(5,150,105,.6);">
                    <div class="qr-overlay-icon">✅</div>
                    <div class="qr-overlay-text" style="color:#4ade80;">Thanh toán thành công</div>
                </div>
            @elseif($order->qr_code)
                <img id="qrImg"
                     src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&format=png&data={{ urlencode($order->qr_code) }}"
                     alt="VietQR"
                     onerror="this.style.display='none';document.getElementById('qrFallback').style.display='flex';">
                <div id="qrFallback" class="qr-placeholder" style="display:none;">
                    <span>📲</span>Không tải được mã QR
                </div>
                {{-- Expired overlay (hidden initially, shown by JS when timer hits 0) --}}
                <div class="qr-overlay" id="expiredOverlay" style="display:none;">
                    <div class="qr-overlay-icon">⏱</div>
                    <div class="qr-overlay-text">Đã hết hạn</div>
                </div>
            @else
                <div class="qr-placeholder">
                    <span>🔗</span>
                    <span>QR chưa sẵn sàng</span>
                    <span style="font-size:.7rem;">Cấu hình PAYOS_* trong .env</span>
                </div>
            @endif
        </div>

        {{-- Countdown --}}
        @if(!$order->isPaid() && !$order->isExpired())
            <div class="countdown-wrap">
                <div class="countdown-label">Thời gian còn lại</div>
                <div class="countdown" id="countdown">5:00</div>
                <div class="progress-bar-bg">
                    <div class="progress-bar" id="progressBar" style="width:100%;"></div>
                </div>
            </div>
        @elseif($order->isPaid())
            <div class="countdown-wrap">
                <div class="countdown" style="color:#4ade80;font-size:1.6rem;">✓ Hoàn tất</div>
            </div>
        @else
            <div class="countdown-wrap">
                <div class="countdown done">Đã hết hạn</div>
            </div>
        @endif

        {{-- Order info --}}
        <div class="info-grid">
            <div class="info-row">
                <span class="info-label">Gói</span>
                <span class="info-value">{{ $planLabel }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Số tiền</span>
                <span class="info-value">{{ number_format($order->total_amount) }} ₫</span>
            </div>
            @if($order->coupon_applied)
                <div class="info-row">
                    <span class="info-label">Mã giảm giá</span>
                    <span class="info-value" style="color:#4ade80;">{{ $order->coupon_applied }} (−{{ number_format($order->discount_amount) }} ₫)</span>
                </div>
            @endif
            <div class="info-row">
                <span class="info-label">Mã đơn</span>
                <span class="info-value">#{{ $order->order_code }}</span>
            </div>
        </div>

        @if($order->checkout_url && !$order->isPaid() && !$order->isExpired())
            <a href="{{ $order->checkout_url }}" target="_blank" class="fallback-link">🔗 Mở trang thanh toán PayOS</a>
        @endif
    </div>

    {{-- ── Side Panel ── --}}
    <div class="side-panel">

        @if($order->isPaid())
            <div class="panel-card" style="text-align:center;border-color:#4ade80;">
                <div style="font-size:2.5rem;margin-bottom:.8rem;">🎉</div>
                <div style="font-size:1.1rem;font-weight:800;color:#4ade80;margin-bottom:.4rem;">Thanh toán thành công!</div>
                <div style="font-size:.85rem;color:#94a3b8;margin-bottom:1.2rem;">Gói {{ $planLabel }} đã được kích hoạt cho tài khoản của bạn.</div>
                <a href="/" class="btn-paid">Vào ứng dụng →</a>
            </div>
        @elseif($order->isExpired())
            <div class="panel-card" style="text-align:center;">
                <div style="font-size:2.5rem;margin-bottom:.8rem;">⏱</div>
                <div style="font-size:1rem;font-weight:700;color:#f87171;margin-bottom:.4rem;">Đơn hàng đã hết hạn</div>
                <div style="font-size:.85rem;color:#94a3b8;margin-bottom:1.2rem;">Mã QR không còn hiệu lực. Vui lòng tạo đơn hàng mới.</div>
                <a href="/pricing" class="btn-back">Quay lại bảng giá</a>
            </div>
        @else
            <div class="panel-card">
                <div class="panel-title">Hướng dẫn thanh toán</div>
                <div class="step"><div class="step-num">1</div><div class="step-text">Mở ứng dụng ngân hàng trên điện thoại hỗ trợ VietQR.</div></div>
                <div class="step"><div class="step-num">2</div><div class="step-text">Chọn chức năng <strong>Quét QR</strong> hoặc <strong>Chuyển tiền QR</strong>.</div></div>
                <div class="step"><div class="step-num">3</div><div class="step-text">Quét mã QR và xác nhận số tiền <strong>{{ number_format($order->total_amount) }} ₫</strong>.</div></div>
                <div class="step"><div class="step-num">4</div><div class="step-text">Xác nhận giao dịch — trang này sẽ tự động cập nhật.</div></div>
            </div>

            <div class="panel-card">
                <div class="panel-title">Lưu ý</div>
                <div style="font-size:.82rem;color:#64748b;line-height:1.7;">
                    • Mã QR có hiệu lực trong <strong style="color:#fbbf24;">5 phút</strong>.<br>
                    • Không tắt trang này trong khi thanh toán.<br>
                    • Sau khi thanh toán, gói sẽ được kích hoạt tự động.<br>
                    • Cần hỗ trợ? <a href="mailto:purchasevn@getkenka.com" style="color:#818cf8;">Liên hệ chúng tôi</a>
                </div>
            </div>

            <a href="/pricing" class="btn-back">← Quay lại bảng giá</a>
        @endif
    </div>
</div>

<script>
    // ── Countdown Timer ─────────────────────────────────────────────────────
    const TOTAL_SECONDS   = {{ $remainingSeconds }};
    const countdownEl     = document.getElementById('countdown');
    const progressBar     = document.getElementById('progressBar');
    const expiredOverlay  = document.getElementById('expiredOverlay');
    const statusBadge     = document.getElementById('statusBadge');

    if (countdownEl && TOTAL_SECONDS > 0) {
        let remaining = TOTAL_SECONDS;

        function formatTime(s) {
            const m = Math.floor(s / 60);
            const sec = s % 60;
            return m + ':' + String(sec).padStart(2, '0');
        }

        function updateCountdown() {
            countdownEl.textContent = formatTime(remaining);

            // Update progress bar
            if (progressBar) {
                const pct = (remaining / 300) * 100;  // 300 = 5 min total
                progressBar.style.width = Math.max(0, pct) + '%';
            }

            // Color shifts
            if (remaining <= 60) {
                countdownEl.className = 'countdown danger';
            } else if (remaining <= 120) {
                countdownEl.className = 'countdown warning';
            }

            if (remaining <= 0) {
                clearInterval(timer);
                clearInterval(pollTimer);
                countdownEl.className = 'countdown done';
                countdownEl.textContent = 'Đã hết hạn';
                if (progressBar) progressBar.style.width = '0%';
                if (expiredOverlay) expiredOverlay.style.display = 'flex';
                if (statusBadge) {
                    statusBadge.className = 'qr-status-badge badge-expired';
                    statusBadge.textContent = '⏱ Hết hạn';
                }
                return;
            }

            remaining--;
        }

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);

        // ── Payment Status Polling ──────────────────────────────────────────
        const ORDER_CODE = '{{ $order->order_code }}';
        let pollTimer;

        async function pollStatus() {
            try {
                const res  = await fetch('/api/orders/' + ORDER_CODE + '/status');
                const data = await res.json();

                if (data.status === 'paid') {
                    clearInterval(timer);
                    clearInterval(pollTimer);
                    // Redirect to success page
                    window.location.href = '/pricing?payment=success';
                }
            } catch (e) {
                // Network error — continue polling
            }
        }

        pollTimer = setInterval(pollStatus, 5000);

    } else if (countdownEl && TOTAL_SECONDS <= 0) {
        // Already expired on page load
        countdownEl.className = 'countdown done';
        countdownEl.textContent = 'Đã hết hạn';
        if (progressBar) progressBar.style.width = '0%';
    }
</script>
</body>
</html>
