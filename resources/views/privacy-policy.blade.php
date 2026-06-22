<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Chính Sách Bảo Mật — Kenfinly</title>
    <meta name="description" content="Chính sách bảo mật của ứng dụng quản lý chi tiêu cá nhân Kenfinly. Tìm hiểu cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn.">
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
            --blue:      #2563eb;
            --blue-dark: #1d4ed8;
            --blue-light:#dbeafe;
            --slate-50:  #f8fafc;
            --slate-100: #f1f5f9;
            --slate-200: #e2e8f0;
            --slate-600: #475569;
            --slate-700: #334155;
            --slate-800: #1e293b;
            --slate-900: #0f172a;
            --green:     #16a34a;
            --green-bg:  #dcfce7;
            --red:       #dc2626;
            --red-bg:    #fee2e2;
            --radius:    10px;
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

        /* ── Hero banner ── */
        .hero {
            background: linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%);
            padding: 48px 24px 56px;
            text-align: center;
            color: #fff;
        }
        .hero h1 {
            font-size: clamp(24px, 5vw, 38px);
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 10px;
        }
        .hero p {
            font-size: 15px;
            color: rgba(255,255,255,0.82);
            max-width: 520px;
            margin: 0 auto;
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

        /* ── Page shell ── */
        .page-wrap {
            max-width: 780px;
            margin: -28px auto 60px;
            padding: 0 16px;
        }

        /* ── Card ── */
        .card {
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
            padding: 40px 44px;
            margin-bottom: 0;
        }

        /* ── Section ── */
        .section {
            margin-bottom: 40px;
        }
        .section:last-child { margin-bottom: 0; }

        .section-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }
        .section-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: var(--blue-light);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 18px;
        }
        .section-title {
            font-size: 19px;
            font-weight: 700;
            color: var(--slate-900);
        }

        .section p {
            color: var(--slate-700);
            margin-bottom: 12px;
            font-size: 15px;
        }
        .section p:last-child { margin-bottom: 0; }

        /* ── Lists ── */
        ul.policy-list {
            list-style: none;
            padding: 0;
            margin: 12px 0;
        }
        ul.policy-list li {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 8px 0;
            border-bottom: 1px solid var(--slate-100);
            color: var(--slate-700);
            font-size: 15px;
        }
        ul.policy-list li:last-child { border-bottom: none; }
        ul.policy-list li::before {
            content: '';
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--blue);
            margin-top: 7px;
            flex-shrink: 0;
        }

        /* ── Highlight boxes ── */
        .box {
            border-radius: var(--radius);
            padding: 16px 20px;
            margin: 16px 0;
            font-size: 15px;
        }
        .box-green {
            background: var(--green-bg);
            border-left: 4px solid var(--green);
            color: #14532d;
        }
        .box-red {
            background: var(--red-bg);
            border-left: 4px solid var(--red);
            color: #7f1d1d;
        }
        .box-blue {
            background: var(--blue-light);
            border-left: 4px solid var(--blue);
            color: #1e3a8a;
        }
        .box strong { display: block; margin-bottom: 4px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.4px; }

        /* ── Divider ── */
        .divider {
            border: none;
            border-top: 1px solid var(--slate-200);
            margin: 36px 0;
        }

        /* ── Contact block ── */
        .contact-block {
            background: linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%);
            border-radius: 14px;
            padding: 28px 32px;
            color: #fff;
            margin-top: 8px;
        }
        .contact-block h3 {
            font-size: 17px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        .contact-block p { color: rgba(255,255,255,0.85); font-size: 14px; margin-bottom: 8px; }
        .contact-block a { color: #bfdbfe; text-decoration: underline; }
        .contact-block .step {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 12px;
        }
        .contact-block .step-num {
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            width: 26px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            flex-shrink: 0;
            margin-top: 1px;
        }
        .contact-block .step p { margin-bottom: 0; }

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
            .contact-block { padding: 22px 18px; }
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
        <div class="hero-badge">Tài liệu pháp lý</div>
        <h1>Chính Sách Bảo Mật</h1>
        <p>Chúng tôi cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn một cách minh bạch và có trách nhiệm.</p>
    </div>

    {{-- Main content --}}
    <div class="page-wrap">
        <div class="card">

            {{-- 1. Giới thiệu --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">📋</div>
                    <h2 class="section-title">1. Giới thiệu về Kenfinly</h2>
                </div>
                <p>
                    <strong>Kenfinly</strong> là ứng dụng quản lý tài chính cá nhân giúp người dùng theo dõi
                    thu nhập, chi tiêu, lập kế hoạch ngân sách và phân tích thói quen tài chính thông qua các
                    biểu đồ báo cáo trực quan.
                </p>
                <p>
                    Chính sách bảo mật này mô tả cách <strong>Getkenka Ltd</strong> ("chúng tôi", "công ty")
                    thu thập, sử dụng và bảo vệ thông tin của bạn khi bạn sử dụng ứng dụng Kenfinly
                    ("ứng dụng", "dịch vụ"). Bằng cách sử dụng dịch vụ, bạn đồng ý với các điều khoản
                    được nêu trong tài liệu này.
                </p>
                <p>
                    Nếu bạn có bất kỳ câu hỏi nào về chính sách này, vui lòng liên hệ chúng tôi tại
                    <strong>hoangphan@kenka.com.vn</strong>.
                </p>
            </div>

            <hr class="divider">

            {{-- 2. Thông tin thu thập --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">📦</div>
                    <h2 class="section-title">2. Thông tin chúng tôi thu thập</h2>
                </div>

                <p>Chúng tôi chỉ thu thập những thông tin cần thiết để cung cấp dịch vụ:</p>

                <ul class="policy-list">
                    <li><strong>Thông tin tài khoản:</strong>&nbsp;Họ tên, địa chỉ email và ảnh đại diện khi bạn đăng nhập qua Facebook Login hoặc Google.</li>
                    <li><strong>Dữ liệu giao dịch:</strong>&nbsp;Các khoản thu nhập và chi tiêu mà bạn tự nhập vào ứng dụng, bao gồm danh mục, số tiền, ngày tháng và ghi chú.</li>
                    <li><strong>Thông tin thiết bị:</strong>&nbsp;Loại thiết bị, hệ điều hành và mã nhận diện ứng dụng (App ID) để gửi thông báo nhắc nhở.</li>
                    <li><strong>Dữ liệu sử dụng:</strong>&nbsp;Nhật ký sự kiện trong ứng dụng (ví dụ: tính năng nào được dùng nhiều) nhằm cải thiện trải nghiệm người dùng.</li>
                </ul>

                <div class="box box-red">
                    <strong>⛔ Chúng tôi KHÔNG thu thập:</strong>
                    Kenfinly <strong>không bao giờ</strong> yêu cầu hoặc lưu trữ mật khẩu ngân hàng,
                    mã PIN, số thẻ tín dụng / thẻ ghi nợ, số tài khoản ngân hàng, hay bất kỳ
                    thông tin thanh toán nhạy cảm nào của bạn. Ứng dụng hoạt động hoàn toàn dựa
                    trên dữ liệu bạn tự nhập thủ công.
                </div>
            </div>

            <hr class="divider">

            {{-- 3. Cách sử dụng dữ liệu --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">⚙️</div>
                    <h2 class="section-title">3. Cách chúng tôi sử dụng dữ liệu</h2>
                </div>
                <p>Dữ liệu của bạn được sử dụng cho các mục đích dưới đây và <strong>không gì khác ngoài</strong> các mục đích này:</p>
                <ul class="policy-list">
                    <li>Tính toán tổng thu nhập, tổng chi tiêu và số dư tài khoản theo thời gian thực.</li>
                    <li>Vẽ biểu đồ và báo cáo phân tích thói quen tài chính (biểu đồ tròn, biểu đồ cột, xu hướng theo tháng).</li>
                    <li>Gửi thông báo nhắc nhở ghi chép chi tiêu hàng ngày theo lịch bạn đặt.</li>
                    <li>Cung cấp tính năng đặt mục tiêu tiết kiệm và theo dõi tiến độ đạt mục tiêu.</li>
                    <li>Cải thiện hiệu năng và trải nghiệm người dùng dựa trên dữ liệu sử dụng ẩn danh.</li>
                    <li>Hỗ trợ kỹ thuật khi bạn báo cáo sự cố hoặc yêu cầu trợ giúp.</li>
                </ul>
            </div>

            <hr class="divider">

            {{-- 4. Cam kết bảo mật --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">🔒</div>
                    <h2 class="section-title">4. Cam kết bảo mật</h2>
                </div>

                <div class="box box-green">
                    <strong>✅ Cam kết của chúng tôi</strong>
                    Chúng tôi KHÔNG bán, trao đổi hoặc chia sẻ thông tin cá nhân của bạn cho bất kỳ
                    bên thứ ba nào vì mục đích quảng cáo hay thương mại.
                </div>

                <p>Các biện pháp kỹ thuật chúng tôi áp dụng để bảo vệ dữ liệu:</p>
                <ul class="policy-list">
                    <li><strong>Mã hóa truyền tải:</strong>&nbsp;Toàn bộ dữ liệu trao đổi giữa thiết bị và máy chủ được mã hóa bằng giao thức HTTPS / TLS 1.3.</li>
                    <li><strong>Mã hóa lưu trữ:</strong>&nbsp;Mật khẩu tài khoản được băm (hash) bằng thuật toán bcrypt; dữ liệu nhạy cảm được mã hóa tại cơ sở dữ liệu.</li>
                    <li><strong>Xác thực hai yếu tố:</strong>&nbsp;Xác minh email bắt buộc khi đăng ký để đảm bảo chỉ chủ sở hữu địa chỉ email mới có thể truy cập tài khoản.</li>
                    <li><strong>Kiểm soát truy cập:</strong>&nbsp;Chỉ nhân viên được ủy quyền mới có thể truy cập dữ liệu người dùng trong phạm vi công việc cụ thể, và phải tuân thủ thỏa thuận bảo mật nội bộ.</li>
                    <li><strong>Đối tác hạ tầng:</strong>&nbsp;Chúng tôi sử dụng các nhà cung cấp hạ tầng đám mây uy tín tuân thủ tiêu chuẩn bảo mật quốc tế (ISO 27001, SOC 2).</li>
                </ul>

                <div class="box box-blue">
                    Trong trường hợp xảy ra sự cố bảo mật ảnh hưởng đến dữ liệu của bạn, chúng tôi
                    cam kết thông báo cho bạn trong vòng <strong>72 giờ</strong> kể từ khi phát hiện,
                    theo quy định bảo vệ dữ liệu hiện hành.
                </div>
            </div>

            <hr class="divider">

            {{-- 5. Chia sẻ với bên thứ ba --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">🤝</div>
                    <h2 class="section-title">5. Chia sẻ với bên thứ ba</h2>
                </div>
                <p>
                    Chúng tôi <strong>không</strong> bán hoặc chia sẻ dữ liệu cá nhân vì mục đích quảng cáo.
                    Dữ liệu chỉ được chia sẻ với bên thứ ba trong các trường hợp rất hạn chế sau:
                </p>
                <ul class="policy-list">
                    <li><strong>Nhà cung cấp dịch vụ kỹ thuật:</strong>&nbsp;Các đối tác lưu trữ, gửi email giao dịch, phân tích sự cố — chỉ nhận dữ liệu tối thiểu cần thiết và phải ký thỏa thuận xử lý dữ liệu.</li>
                    <li><strong>Yêu cầu pháp lý:</strong>&nbsp;Khi có yêu cầu hợp lệ từ cơ quan nhà nước có thẩm quyền theo quy định pháp luật Việt Nam.</li>
                    <li><strong>Bảo vệ quyền lợi:</strong>&nbsp;Trong trường hợp cần thiết để ngăn chặn gian lận hoặc bảo vệ an toàn cho người dùng.</li>
                </ul>
            </div>

            <hr class="divider">

            {{-- 6. Quyền người dùng & Xóa dữ liệu --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">🗑️</div>
                    <h2 class="section-title">6. Quyền của bạn & Quy trình xóa dữ liệu</h2>
                </div>

                <p>Bạn có đầy đủ các quyền sau đối với dữ liệu cá nhân của mình:</p>
                <ul class="policy-list">
                    <li><strong>Quyền truy cập:</strong>&nbsp;Xem toàn bộ dữ liệu đã lưu trong mục cài đặt tài khoản.</li>
                    <li><strong>Quyền chỉnh sửa:</strong>&nbsp;Cập nhật thông tin cá nhân và dữ liệu giao dịch bất cứ lúc nào.</li>
                    <li><strong>Quyền xóa:</strong>&nbsp;Yêu cầu xóa toàn bộ dữ liệu và tài khoản theo quy trình bên dưới.</li>
                    <li><strong>Quyền phản đối:</strong>&nbsp;Từ chối nhận thông báo tiếp thị (nếu có) bằng cách hủy đăng ký trong phần cài đặt.</li>
                    <li><strong>Quyền di chuyển dữ liệu:</strong>&nbsp;Xuất toàn bộ lịch sử giao dịch dưới dạng file CSV trong phần Cài đặt → Xuất dữ liệu.</li>
                </ul>

                <div class="contact-block">
                    <h3>🗑️ Quy trình xóa tài khoản &amp; dữ liệu</h3>

                    <div class="step">
                        <div class="step-num">1</div>
                        <p>
                            <strong>Xóa trực tiếp trong ứng dụng:</strong><br>
                            Vào <em>Cài đặt → Tài khoản → Xóa tài khoản</em>. Toàn bộ dữ liệu giao dịch,
                            danh mục và lịch sử sẽ bị xóa vĩnh viễn trong vòng <strong>30 ngày</strong>.
                        </p>
                    </div>

                    <div class="step">
                        <div class="step-num">2</div>
                        <p>
                            <strong>Yêu cầu xóa qua email:</strong><br>
                            Gửi email đến <a href="mailto:hoangphan@kenka.com.vn">hoangphan@kenka.com.vn</a>
                            với tiêu đề <em>"Yêu cầu xóa tài khoản Kenfinly"</em> kèm địa chỉ email
                            tài khoản. Chúng tôi sẽ xử lý trong vòng <strong>7 ngày làm việc</strong>
                            và gửi xác nhận khi hoàn tất.
                        </p>
                    </div>

                    <div class="step">
                        <div class="step-num">3</div>
                        <p>
                            <strong>Sau khi xóa:</strong><br>
                            Tất cả thông tin cá nhân, lịch sử giao dịch và dữ liệu liên kết
                            (bao gồm dữ liệu từ Facebook Login) sẽ được xóa vĩnh viễn khỏi
                            hệ thống. Một số thông tin có thể được giữ lại tối đa <strong>90 ngày</strong>
                            trong bản sao lưu trước khi bị xóa hoàn toàn theo quy trình tự động.
                        </p>
                    </div>
                </div>
            </div>

            <hr class="divider">

            {{-- 7. Cookie & Phân tích --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">🍪</div>
                    <h2 class="section-title">7. Cookie &amp; Phân tích</h2>
                </div>
                <p>
                    Ứng dụng web Kenfinly sử dụng cookie kỹ thuật cần thiết để duy trì phiên đăng nhập
                    và đảm bảo hoạt động ổn định. Chúng tôi <strong>không</strong> sử dụng cookie theo dõi
                    hay cookie quảng cáo của bên thứ ba.
                </p>
                <p>
                    Chúng tôi có thể sử dụng công cụ phân tích ẩn danh (không liên kết với danh tính cá nhân)
                    để đo lường hiệu năng ứng dụng và cải thiện trải nghiệm người dùng.
                </p>
            </div>

            <hr class="divider">

            {{-- 8. Thay đổi chính sách --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">📝</div>
                    <h2 class="section-title">8. Thay đổi chính sách bảo mật</h2>
                </div>
                <p>
                    Chúng tôi có thể cập nhật chính sách này khi cần thiết. Khi có thay đổi quan trọng,
                    chúng tôi sẽ thông báo qua email đã đăng ký hoặc thông báo nổi bật trong ứng dụng
                    trước ít nhất <strong>15 ngày</strong> khi thay đổi có hiệu lực.
                </p>
                <p>
                    Ngày hiệu lực của phiên bản hiện tại: <strong>21 tháng 6, 2026</strong>.
                    Việc tiếp tục sử dụng ứng dụng sau ngày có hiệu lực đồng nghĩa với việc bạn
                    chấp nhận chính sách đã được cập nhật.
                </p>
            </div>

            <hr class="divider">

            {{-- 9. Liên hệ --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">📬</div>
                    <h2 class="section-title">9. Liên hệ</h2>
                </div>
                <p>Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ chúng tôi:</p>
                <ul class="policy-list">
                    <li><strong>Công ty:</strong>&nbsp;Getkenka Ltd — Mã số thuế: 0318304909</li>
                    <li><strong>Email bảo mật:</strong>&nbsp;<a href="mailto:hoangphan@kenka.com.vn" style="color:var(--blue)">hoangphan@kenka.com.vn</a></li>
                    <li><strong>Email hỗ trợ:</strong>&nbsp;<a href="mailto:purchasevn@getkenka.com" style="color:var(--blue)">purchasevn@getkenka.com</a></li>
                    <li><strong>Điện thoại:</strong>&nbsp;+84 0941 069 969</li>
                    <li><strong>Địa chỉ:</strong>&nbsp;Tầng 2, 81 CMT8, Phường Bến Thành, Quận 1, TP.HCM</li>
                </ul>
            </div>

        </div>{{-- /card --}}

        <div class="meta">
            <p>© {{ date('Y') }} Getkenka Ltd — Kenfinly. Tất cả quyền được bảo lưu.</p>
            <p style="margin-top:6px;">
                <a href="/">Trang chủ</a> &nbsp;·&nbsp;
                <a href="/pricing">Bảng giá</a> &nbsp;·&nbsp;
                <a href="mailto:hoangphan@kenka.com.vn">Liên hệ</a>
            </p>
        </div>
    </div>

</body>
</html>
