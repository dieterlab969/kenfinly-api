<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Hướng Dẫn Xóa Dữ Liệu Người Dùng — Kenfinly</title>
    <meta name="description" content="Hướng dẫn xóa dữ liệu tài khoản Kenfinly. Tuân thủ chính sách xóa dữ liệu người dùng của Meta/Facebook.">
    <meta name="robots" content="index, follow">

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

        :root {
            --blue:       #2563eb;
            --blue-dark:  #1d4ed8;
            --blue-light: #dbeafe;
            --slate-50:   #f8fafc;
            --slate-100:  #f1f5f9;
            --slate-200:  #e2e8f0;
            --slate-600:  #475569;
            --slate-700:  #334155;
            --slate-800:  #1e293b;
            --slate-900:  #0f172a;
            --red:        #dc2626;
            --red-bg:     #fee2e2;
            --green:      #16a34a;
            --green-bg:   #dcfce7;
            --radius:     10px;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                         'Helvetica Neue', Arial, sans-serif;
            background: var(--slate-50);
            color: var(--slate-800);
            line-height: 1.75;
            font-size: 16px;
        }

        /* ── Top bar ── */
        .topbar {
            background: linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%);
            padding: 18px 24px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .topbar-logo {
            font-size: 22px;
            font-weight: 800;
            color: #fff;
            letter-spacing: -0.5px;
            text-decoration: none;
        }
        .topbar-tagline {
            font-size: 13px;
            color: rgba(255,255,255,0.75);
            margin-left: auto;
        }

        /* ── Hero ── */
        .hero {
            background: linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%);
            padding: 48px 24px 56px;
            text-align: center;
            color: #fff;
        }
        .hero-badge {
            display: inline-block;
            background: rgba(255,255,255,0.18);
            border: 1px solid rgba(255,255,255,0.3);
            color: #fff;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 14px;
            border-radius: 99px;
            margin-bottom: 18px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .hero h1 {
            font-size: clamp(22px, 5vw, 34px);
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 10px;
        }
        .hero p {
            font-size: 15px;
            color: rgba(255,255,255,0.82);
            max-width: 500px;
            margin: 0 auto;
        }

        /* ── Page shell ── */
        .page-wrap {
            max-width: 720px;
            margin: -28px auto 60px;
            padding: 0 16px;
        }

        /* ── Card ── */
        .card {
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
            padding: 40px 44px;
        }

        /* ── Intro text ── */
        .intro {
            color: var(--slate-700);
            font-size: 15px;
            margin-bottom: 32px;
            padding-bottom: 28px;
            border-bottom: 1px solid var(--slate-200);
        }

        /* ── Method block ── */
        .method {
            margin-bottom: 28px;
        }
        .method-header {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 16px;
        }
        .method-badge {
            background: var(--blue);
            color: #fff;
            font-size: 13px;
            font-weight: 700;
            padding: 5px 14px;
            border-radius: 99px;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .method-title {
            font-size: 17px;
            font-weight: 700;
            color: var(--slate-900);
        }

        /* ── Steps ── */
        .steps {
            list-style: none;
            padding: 0;
            margin: 0;
            counter-reset: step-counter;
        }
        .steps li {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            padding: 12px 0;
            border-bottom: 1px solid var(--slate-100);
            font-size: 15px;
            color: var(--slate-700);
            counter-increment: step-counter;
        }
        .steps li:last-child { border-bottom: none; }
        .steps li::before {
            content: counter(step-counter);
            background: var(--blue-light);
            color: var(--blue);
            font-weight: 700;
            font-size: 13px;
            min-width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 1px;
        }

        /* ── SLA tag ── */
        .sla {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: var(--green-bg);
            color: var(--green);
            font-size: 13px;
            font-weight: 600;
            padding: 4px 12px;
            border-radius: 99px;
            margin-top: 10px;
        }

        /* ── Divider ── */
        .divider {
            border: none;
            border-top: 1px solid var(--slate-200);
            margin: 28px 0;
        }

        /* ── OR separator ── */
        .or-sep {
            display: flex;
            align-items: center;
            gap: 16px;
            margin: 24px 0;
            color: var(--slate-600);
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .or-sep::before,
        .or-sep::after {
            content: '';
            flex: 1;
            border-top: 1px solid var(--slate-200);
        }

        /* ── Email CTA ── */
        .email-cta {
            background: var(--slate-50);
            border: 1.5px solid var(--slate-200);
            border-radius: 12px;
            padding: 22px 24px;
        }
        .email-cta p {
            font-size: 15px;
            color: var(--slate-700);
            margin-bottom: 10px;
        }
        .email-cta p:last-child { margin-bottom: 0; }
        .email-cta .label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--slate-600);
            margin-bottom: 4px;
        }
        .email-cta a {
            color: var(--blue);
            font-weight: 600;
            text-decoration: none;
            word-break: break-all;
        }
        .email-cta a:hover { text-decoration: underline; }
        .email-cta .subject {
            font-family: 'Courier New', monospace;
            background: var(--blue-light);
            color: #1e3a8a;
            font-size: 13px;
            padding: 6px 12px;
            border-radius: 6px;
            display: inline-block;
            margin-top: 4px;
        }

        /* ── Commitment box ── */
        .commitment {
            background: var(--red-bg);
            border: 1.5px solid var(--red);
            border-radius: 12px;
            padding: 22px 26px;
            margin-top: 28px;
        }
        .commitment-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 700;
            color: var(--red);
            margin-bottom: 10px;
        }
        .commitment p {
            font-size: 15px;
            color: #7f1d1d;
            line-height: 1.7;
        }

        /* ── Footer meta ── */
        .meta {
            text-align: center;
            margin-top: 32px;
            font-size: 13px;
            color: var(--slate-600);
        }
        .meta a { color: var(--blue); text-decoration: none; }
        .meta a:hover { text-decoration: underline; }

        /* ── Responsive ── */
        @media (max-width: 600px) {
            .card { padding: 28px 20px; }
            .topbar-tagline { display: none; }
            .hero { padding: 36px 16px 48px; }
        }
    </style>
</head>
<body>

    {{-- Top bar --}}
    <div class="topbar">
        <a href="/" class="topbar-logo">Kenfinly</a>
        <span class="topbar-tagline">Quản lý chi tiêu cá nhân</span>
    </div>

    {{-- Hero --}}
    <div class="hero">
        <div class="hero-badge">Meta / Facebook — Data Deletion</div>
        <h1>Hướng Dẫn Xóa Dữ Liệu Người Dùng</h1>
        <p>Bạn có thể yêu cầu xóa toàn bộ dữ liệu cá nhân khỏi hệ thống Kenfinly bất kỳ lúc nào theo một trong hai cách dưới đây.</p>
    </div>

    {{-- Main --}}
    <div class="page-wrap">
        <div class="card">

            <p class="intro">
                Khi bạn sử dụng tính năng <strong>Đăng nhập bằng Facebook</strong> trong ứng dụng Kenfinly,
                chúng tôi chỉ lưu trữ tên, địa chỉ email và ảnh đại diện của bạn.
                Theo yêu cầu của Meta Platform và quy định bảo vệ dữ liệu, bạn có quyền
                yêu cầu xóa hoàn toàn các thông tin này cùng toàn bộ dữ liệu tài khoản.
            </p>

            {{-- Method 1 --}}
            <div class="method">
                <div class="method-header">
                    <span class="method-badge">Cách 1</span>
                    <h2 class="method-title">Xóa trực tiếp trong ứng dụng</h2>
                </div>

                <ol class="steps">
                    <li>Đăng nhập vào ứng dụng <strong>Kenfinly</strong> trên điện thoại.</li>
                    <li>Nhấn vào biểu tượng <strong>tài khoản / cài đặt</strong> ở góc màn hình.</li>
                    <li>Chọn mục <strong>"Cài đặt tài khoản"</strong>.</li>
                    <li>Cuộn xuống và nhấn <strong>"Xóa tài khoản"</strong>.</li>
                    <li>Xác nhận yêu cầu xóa. Hệ thống sẽ xử lý ngay lập tức.</li>
                </ol>

                <div>
                    <span class="sla">✅ Hoàn tất trong vòng 24 giờ</span>
                </div>
            </div>

            <div class="or-sep">hoặc</div>

            {{-- Method 2 --}}
            <div class="method">
                <div class="method-header">
                    <span class="method-badge">Cách 2</span>
                    <h2 class="method-title">Gửi yêu cầu qua email</h2>
                </div>

                <div class="email-cta">
                    <p class="label">Địa chỉ email nhận yêu cầu</p>
                    <p>
                        <a href="mailto:phanvuhoang@gmail.com">phanvuhoang@gmail.com</a>
                    </p>

                    <p class="label" style="margin-top:14px;">Tiêu đề email (vui lòng sao chép nguyên văn)</p>
                    <span class="subject">Yêu cầu xóa dữ liệu tài khoản Kenfinly</span>

                    <p style="margin-top:14px;">
                        Trong nội dung email, vui lòng cung cấp <strong>địa chỉ email</strong>
                        đã đăng ký tài khoản Kenfinly để chúng tôi xác định và xử lý đúng yêu cầu.
                    </p>

                    <div style="margin-top:10px;">
                        <span class="sla">✅ Phản hồi xác nhận trong vòng 3 ngày làm việc</span>
                    </div>
                </div>
            </div>

            <hr class="divider">

            {{-- Commitment --}}
            <div class="commitment">
                <div class="commitment-title">
                    🗑️ Cam kết xóa dữ liệu vĩnh viễn
                </div>
                <p>
                    Sau khi yêu cầu xóa được xử lý, <strong>toàn bộ dữ liệu</strong> của bạn trên hệ thống
                    Kenfinly — bao gồm thông tin cá nhân (tên, email, ảnh đại diện từ Facebook),
                    lịch sử giao dịch thu chi, kế hoạch ngân sách và mục tiêu tiết kiệm —
                    sẽ bị <strong>hủy bỏ hoàn toàn và vĩnh viễn</strong> trên toàn bộ hệ thống
                    lưu trữ đám mây của chúng tôi.
                    <strong>Dữ liệu đã xóa không thể khôi phục</strong> dưới bất kỳ hình thức nào.
                </p>
            </div>

        </div>{{-- /card --}}

        <div class="meta">
            <p>© {{ date('Y') }} Getkenka Ltd — Kenfinly. Mã số thuế: 0318304909</p>
            <p style="margin-top:6px;">
                <a href="/">Trang chủ</a> &nbsp;·&nbsp;
                <a href="/chinh-sach-bao-mat">Chính sách bảo mật</a> &nbsp;·&nbsp;
                <a href="/dieu-khoan-dich-vu">Điều khoản dịch vụ</a> &nbsp;·&nbsp;
                <a href="mailto:phanvuhoang@gmail.com">Liên hệ</a>
            </p>
        </div>
    </div>

</body>
</html>
