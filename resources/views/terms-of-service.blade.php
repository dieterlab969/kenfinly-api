<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Điều Khoản Dịch Vụ — Kenfinly</title>
    <meta name="description" content="Điều khoản dịch vụ của ứng dụng quản lý chi tiêu cá nhân Kenfinly. Vui lòng đọc kỹ trước khi sử dụng dịch vụ.">
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
            --amber:      #d97706;
            --amber-bg:   #fef3c7;
            --green:      #16a34a;
            --green-bg:   #dcfce7;
            --red:        #dc2626;
            --red-bg:     #fee2e2;
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
            font-size: clamp(24px, 5vw, 38px);
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 10px;
        }
        .hero p {
            font-size: 15px;
            color: rgba(255,255,255,0.82);
            max-width: 540px;
            margin: 0 auto;
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
        }

        /* ── Section ── */
        .section { margin-bottom: 40px; }
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
            padding: 18px 22px;
            margin: 16px 0;
            font-size: 15px;
        }
        .box-amber {
            background: var(--amber-bg);
            border-left: 4px solid var(--amber);
            color: #78350f;
        }
        .box-red {
            background: var(--red-bg);
            border-left: 4px solid var(--red);
            color: #7f1d1d;
        }
        .box-green {
            background: var(--green-bg);
            border-left: 4px solid var(--green);
            color: #14532d;
        }
        .box-blue {
            background: var(--blue-light);
            border-left: 4px solid var(--blue);
            color: #1e3a8a;
        }
        .box strong {
            display: block;
            margin-bottom: 6px;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* ── Disclaimer block (big red) ── */
        .disclaimer {
            background: #fff1f2;
            border: 2px solid var(--red);
            border-radius: 12px;
            padding: 24px 28px;
            margin: 16px 0;
        }
        .disclaimer-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 17px;
            font-weight: 700;
            color: var(--red);
            margin-bottom: 14px;
        }
        .disclaimer p {
            color: #5f1d1d;
            font-size: 15px;
            margin-bottom: 10px;
        }
        .disclaimer p:last-child { margin-bottom: 0; }

        /* ── Prohibited block ── */
        .prohibited-list {
            list-style: none;
            padding: 0;
            margin: 12px 0;
        }
        .prohibited-list li {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 9px 0;
            border-bottom: 1px solid var(--slate-100);
            color: var(--slate-700);
            font-size: 15px;
        }
        .prohibited-list li:last-child { border-bottom: none; }
        .prohibited-list li .icon {
            flex-shrink: 0;
            font-size: 16px;
            margin-top: 1px;
        }

        /* ── Contact card ── */
        .contact-card {
            background: linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%);
            border-radius: 14px;
            padding: 28px 32px;
            color: #fff;
            margin-top: 8px;
        }
        .contact-card h3 {
            font-size: 17px;
            font-weight: 700;
            margin-bottom: 12px;
        }
        .contact-card p {
            color: rgba(255,255,255,0.85);
            font-size: 15px;
            margin-bottom: 8px;
        }
        .contact-card p:last-child { margin-bottom: 0; }
        .contact-card a { color: #bfdbfe; text-decoration: underline; word-break: break-all; }

        /* ── Divider ── */
        .divider {
            border: none;
            border-top: 1px solid var(--slate-200);
            margin: 36px 0;
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
            .disclaimer { padding: 18px 16px; }
            .contact-card { padding: 22px 18px; }
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
        <h1>Điều Khoản Dịch Vụ</h1>
        <p>Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng ứng dụng Kenfinly. Việc sử dụng dịch vụ đồng nghĩa với việc bạn đồng ý với toàn bộ các điều khoản này.</p>
    </div>

    {{-- Main content --}}
    <div class="page-wrap">
        <div class="card">

            {{-- 1. Định nghĩa và phạm vi dịch vụ --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">📱</div>
                    <h2 class="section-title">1. Định nghĩa và phạm vi dịch vụ</h2>
                </div>
                <p>
                    <strong>Kenfinly</strong> là ứng dụng quản lý tài chính cá nhân do <strong>Getkenka Ltd</strong>
                    ("Công ty", "chúng tôi") phát triển và vận hành. Ứng dụng cung cấp các công cụ hỗ trợ
                    người dùng trong việc:
                </p>
                <ul class="policy-list">
                    <li>Ghi chép và theo dõi các khoản thu nhập, chi tiêu hằng ngày.</li>
                    <li>Phân loại giao dịch theo danh mục (ăn uống, di chuyển, giải trí, v.v.).</li>
                    <li>Lập kế hoạch ngân sách cá nhân và đặt mục tiêu tiết kiệm.</li>
                    <li>Xem báo cáo thống kê thu chi thông qua biểu đồ trực quan.</li>
                    <li>Nhận thông báo nhắc nhở ghi chép chi tiêu theo lịch cá nhân.</li>
                </ul>
                <p>
                    Các Điều Khoản Dịch Vụ này ("Điều Khoản") điều chỉnh mối quan hệ giữa Công ty và
                    người dùng ("bạn") khi truy cập hoặc sử dụng bất kỳ tính năng nào của Kenfinly,
                    bao gồm ứng dụng di động và nền tảng web.
                </p>
            </div>

            <hr class="divider">

            {{-- 2. Điều kiện sử dụng và tài khoản --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">👤</div>
                    <h2 class="section-title">2. Điều kiện sử dụng và tài khoản</h2>
                </div>

                <p>Để sử dụng Kenfinly, bạn phải đáp ứng các điều kiện sau:</p>
                <ul class="policy-list">
                    <li>Từ đủ <strong>16 tuổi</strong> trở lên, hoặc có sự đồng ý của cha mẹ/người giám hộ hợp pháp nếu chưa đủ tuổi.</li>
                    <li>Cung cấp thông tin đăng ký chính xác, trung thực và cập nhật kịp thời khi có thay đổi.</li>
                    <li>Chỉ tạo và sử dụng một tài khoản duy nhất cho mỗi cá nhân.</li>
                    <li>Không sử dụng tài khoản của người khác mà không có sự cho phép.</li>
                </ul>

                <div class="box box-blue">
                    <strong>🔑 Trách nhiệm bảo mật tài khoản</strong>
                    Bạn hoàn toàn chịu trách nhiệm quản lý và bảo mật thông tin đăng nhập tài khoản của
                    mình. Mọi hoạt động được thực hiện dưới tài khoản của bạn đều được coi là do bạn thực
                    hiện. Vui lòng thông báo ngay cho chúng tôi qua email
                    <strong>phanvuhoang@gmail.com</strong> nếu phát hiện truy cập trái phép.
                </div>

                <p>
                    Công ty có quyền tạm ngừng hoặc chấm dứt tài khoản của bạn nếu phát hiện vi phạm
                    các Điều Khoản này, với hoặc không có thông báo trước tùy theo mức độ vi phạm.
                </p>
            </div>

            <hr class="divider">

            {{-- 3. Tuyên bố miễn trừ trách nhiệm tài chính --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">⚠️</div>
                    <h2 class="section-title">3. Tuyên bố miễn trừ trách nhiệm tài chính</h2>
                </div>

                <div class="disclaimer">
                    <div class="disclaimer-title">
                        ⛔ TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM QUAN TRỌNG
                    </div>
                    <p>
                        <strong>Kenfinly là công cụ thống kê và ghi chép tài chính cá nhân.</strong>
                        Ứng dụng <u>không</u> cung cấp dịch vụ tư vấn tài chính, tư vấn đầu tư,
                        tư vấn thuế, tư vấn pháp lý hay bất kỳ dịch vụ chuyên môn tài chính nào khác.
                    </p>
                    <p>
                        Mọi số liệu, biểu đồ và báo cáo trong ứng dụng được tạo ra hoàn toàn
                        dựa trên <strong>dữ liệu do chính bạn nhập vào</strong>. Đây là thông tin
                        thống kê phục vụ mục đích tham khảo cá nhân, <u>không phải</u> lời khuyên
                        hay khuyến nghị về các quyết định tài chính, đầu tư hay tiêu dùng.
                    </p>
                    <p>
                        <strong>Getkenka Ltd không chịu bất kỳ trách nhiệm nào</strong> đối với các
                        tổn thất kinh tế, thiệt hại tài chính hoặc hậu quả bất lợi nào phát sinh
                        từ việc bạn dựa vào thông tin từ ứng dụng để đưa ra quyết định tài chính
                        hay đầu tư.
                    </p>
                    <p>
                        Để được tư vấn tài chính và đầu tư chuyên nghiệp, vui lòng liên hệ
                        chuyên gia tài chính được cấp phép hoạt động hợp pháp tại Việt Nam.
                    </p>
                </div>
            </div>

            <hr class="divider">

            {{-- 4. Quyền sở hữu dữ liệu --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">🗄️</div>
                    <h2 class="section-title">4. Quyền sở hữu dữ liệu</h2>
                </div>
                <p>
                    Dữ liệu giao dịch và thông tin tài chính cá nhân mà bạn nhập vào Kenfinly
                    <strong>thuộc quyền sở hữu của bạn</strong>. Chúng tôi không có quyền sử dụng
                    dữ liệu đó ngoài mục đích cung cấp dịch vụ cho bạn.
                </p>
                <ul class="policy-list">
                    <li>Bạn có thể xuất toàn bộ lịch sử giao dịch dưới dạng file CSV bất kỳ lúc nào tại mục <em>Cài đặt → Xuất dữ liệu</em>.</li>
                    <li>Khi xóa tài khoản, toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn khỏi hệ thống theo quy trình được mô tả trong Chính Sách Bảo Mật.</li>
                    <li>Chúng tôi không bán, không cho thuê và không chia sẻ dữ liệu cá nhân của bạn cho bên thứ ba vì mục đích thương mại.</li>
                </ul>
                <p>
                    Đối với nội dung bạn tạo ra trong ứng dụng (danh mục tùy chỉnh, ghi chú), bạn cấp
                    cho Công ty quyền sử dụng giới hạn, không độc quyền và không thể chuyển nhượng
                    chỉ nhằm mục đích vận hành và cải thiện dịch vụ.
                </p>
            </div>

            <hr class="divider">

            {{-- 5. Các hành vi bị nghiêm cấm --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">🚫</div>
                    <h2 class="section-title">5. Các hành vi bị nghiêm cấm</h2>
                </div>

                <div class="box box-red">
                    <strong>⛔ Vi phạm các điều khoản này có thể dẫn đến chấm dứt tài khoản vĩnh viễn và xử lý theo quy định pháp luật.</strong>
                </div>

                <p>Khi sử dụng Kenfinly, bạn cam kết không thực hiện bất kỳ hành vi nào sau đây:</p>

                <ul class="prohibited-list">
                    <li>
                        <span class="icon">🔓</span>
                        <span><strong>Tấn công hệ thống:</strong> Truy cập trái phép, hack, khai thác lỗ hổng bảo mật, thực hiện tấn công từ chối dịch vụ (DDoS) hoặc bất kỳ hình thức tấn công mạng nào vào cơ sở hạ tầng của Kenfinly.</span>
                    </li>
                    <li>
                        <span class="icon">🤖</span>
                        <span><strong>Thu thập dữ liệu tự động:</strong> Sử dụng bot, scraper, crawler hoặc các công cụ tự động để thu thập, sao chép dữ liệu từ ứng dụng mà không có sự cho phép bằng văn bản của Công ty.</span>
                    </li>
                    <li>
                        <span class="icon">🔁</span>
                        <span><strong>Đảo ngược kỹ thuật:</strong> Dịch ngược (reverse engineer), giải mã, tháo rời hoặc cố gắng tái tạo mã nguồn của ứng dụng.</span>
                    </li>
                    <li>
                        <span class="icon">💳</span>
                        <span><strong>Gian lận tài khoản:</strong> Tạo tài khoản giả mạo, sử dụng thông tin định danh người khác, hoặc thực hiện bất kỳ hành vi gian lận, lừa đảo nào.</span>
                    </li>
                    <li>
                        <span class="icon">⚖️</span>
                        <span><strong>Vi phạm pháp luật:</strong> Sử dụng ứng dụng để thực hiện hoặc hỗ trợ bất kỳ hoạt động bất hợp pháp nào theo quy định pháp luật Việt Nam và quốc tế, bao gồm rửa tiền, trốn thuế.</span>
                    </li>
                    <li>
                        <span class="icon">📤</span>
                        <span><strong>Phát tán nội dung độc hại:</strong> Tải lên hoặc phát tán virus, mã độc, phần mềm gián điệp (spyware) hoặc bất kỳ mã phá hoại nào thông qua ứng dụng.</span>
                    </li>
                    <li>
                        <span class="icon">🔗</span>
                        <span><strong>Chia sẻ trái phép:</strong> Chia sẻ, chuyển nhượng hoặc bán quyền truy cập tài khoản Kenfinly của bạn cho người khác.</span>
                    </li>
                    <li>
                        <span class="icon">🏴</span>
                        <span><strong>Xâm phạm sở hữu trí tuệ:</strong> Sao chép, phân phối, sửa đổi hoặc tạo các sản phẩm phái sinh từ ứng dụng, biểu tượng, thiết kế hoặc nội dung của Kenfinly mà không được phép.</span>
                    </li>
                </ul>
            </div>

            <hr class="divider">

            {{-- 6. Sở hữu trí tuệ --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">©️</div>
                    <h2 class="section-title">6. Sở hữu trí tuệ</h2>
                </div>
                <p>
                    Toàn bộ nội dung của ứng dụng Kenfinly, bao gồm nhưng không giới hạn ở mã nguồn,
                    giao diện, biểu tượng, logo, đồ họa, văn bản và thiết kế, là tài sản sở hữu trí
                    tuệ của <strong>Getkenka Ltd</strong> và được bảo hộ theo pháp luật về sở hữu
                    trí tuệ của Việt Nam và các điều ước quốc tế liên quan.
                </p>
                <p>
                    Bạn được cấp quyền sử dụng ứng dụng theo giấy phép cá nhân, không độc quyền, không
                    thể chuyển nhượng và có thể thu hồi nhằm mục đích sử dụng cá nhân, phi thương mại.
                    Mọi quyền không được cấp rõ ràng đều thuộc về Công ty.
                </p>
            </div>

            <hr class="divider">

            {{-- 7. Giới hạn trách nhiệm dịch vụ --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">🛡️</div>
                    <h2 class="section-title">7. Giới hạn trách nhiệm dịch vụ</h2>
                </div>

                <div class="box box-amber">
                    <strong>⚠️ Dịch vụ được cung cấp theo nguyên tắc "nguyên trạng"</strong>
                    Kenfinly được cung cấp "nguyên trạng" (as-is) và "theo sự sẵn có" (as-available).
                    Chúng tôi không bảo đảm dịch vụ sẽ hoạt động liên tục, không lỗi hoặc đáp ứng
                    mọi yêu cầu cụ thể của bạn.
                </div>

                <p>Trong phạm vi tối đa mà pháp luật cho phép, Getkenka Ltd sẽ không chịu trách nhiệm pháp lý đối với:</p>
                <ul class="policy-list">
                    <li>Thiệt hại gián tiếp, ngẫu nhiên, đặc biệt hoặc mang tính hệ quả phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.</li>
                    <li>Mất mát dữ liệu do sự cố kỹ thuật ngoài tầm kiểm soát của Công ty.</li>
                    <li>Thiệt hại do sự cố bảo mật từ phía người dùng (mất mật khẩu, thiết bị bị đánh cắp).</li>
                    <li>Quyết định tài chính cá nhân của bạn dựa trên thông tin từ ứng dụng.</li>
                </ul>
            </div>

            <hr class="divider">

            {{-- 8. Thay đổi dịch vụ và điều khoản --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">📝</div>
                    <h2 class="section-title">8. Thay đổi dịch vụ và điều khoản</h2>
                </div>
                <p>
                    Công ty có quyền sửa đổi, cập nhật hoặc ngừng cung cấp bất kỳ tính năng nào của
                    Kenfinly vào bất kỳ lúc nào mà không cần thông báo trước. Chúng tôi sẽ nỗ lực
                    thông báo các thay đổi quan trọng qua email hoặc thông báo trong ứng dụng.
                </p>
                <p>
                    Các Điều Khoản này có thể được cập nhật định kỳ. Khi có thay đổi đáng kể, chúng
                    tôi sẽ thông báo trước ít nhất <strong>15 ngày</strong> trước khi điều khoản mới
                    có hiệu lực. Việc tiếp tục sử dụng dịch vụ sau ngày hiệu lực được xem là bạn
                    chấp nhận các điều khoản đã được cập nhật.
                </p>
                <p>
                    Ngày hiệu lực của phiên bản hiện tại: <strong>21 tháng 6, 2026</strong>.
                </p>
            </div>

            <hr class="divider">

            {{-- 9. Luật áp dụng --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">⚖️</div>
                    <h2 class="section-title">9. Luật áp dụng và giải quyết tranh chấp</h2>
                </div>
                <p>
                    Các Điều Khoản này được điều chỉnh và giải thích theo <strong>pháp luật Việt Nam</strong>.
                    Mọi tranh chấp phát sinh từ hoặc liên quan đến các Điều Khoản này sẽ được giải
                    quyết ưu tiên thông qua thương lượng thân thiện giữa các bên trong vòng 30 ngày.
                </p>
                <p>
                    Nếu thương lượng không thành công, tranh chấp sẽ được đưa ra giải quyết tại
                    Tòa án nhân dân có thẩm quyền tại Thành phố Hồ Chí Minh, Việt Nam.
                </p>
            </div>

            <hr class="divider">

            {{-- 10. Liên hệ hỗ trợ --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">📬</div>
                    <h2 class="section-title">10. Liên hệ hỗ trợ</h2>
                </div>
                <p>Nếu bạn có câu hỏi, phản hồi hoặc cần hỗ trợ liên quan đến các Điều Khoản này hoặc dịch vụ Kenfinly, vui lòng liên hệ chúng tôi:</p>

                <div class="contact-card">
                    <h3>📮 Thông tin liên hệ</h3>
                    <p>
                        <strong>Email hỗ trợ kỹ thuật:</strong><br>
                        <a href="mailto:phanvuhoang@gmail.com">phanvuhoang@gmail.com</a>
                    </p>
                    <p>
                        <strong>Email doanh nghiệp:</strong><br>
                        <a href="mailto:purchasevn@getkenka.com">purchasevn@getkenka.com</a>
                    </p>
                    <p>
                        <strong>Công ty:</strong> Getkenka Ltd &nbsp;|&nbsp;
                        Mã số thuế: 0318304909
                    </p>
                    <p>
                        <strong>Địa chỉ:</strong> Tầng 2, 81 CMT8, Phường Bến Thành, Quận 1, TP.HCM
                    </p>
                    <p>
                        <strong>Điện thoại:</strong> +84 0941 069 969
                    </p>
                </div>
            </div>

        </div>{{-- /card --}}

        <div class="meta">
            <p>© {{ date('Y') }} Getkenka Ltd — Kenfinly. Tất cả quyền được bảo lưu.</p>
            <p style="margin-top:6px;">
                <a href="/">Trang chủ</a> &nbsp;·&nbsp;
                <a href="/chinh-sach-bao-mat">Chính sách bảo mật</a> &nbsp;·&nbsp;
                <a href="/pricing">Bảng giá</a> &nbsp;·&nbsp;
                <a href="mailto:phanvuhoang@gmail.com">Liên hệ</a>
            </p>
        </div>
    </div>

</body>
</html>
