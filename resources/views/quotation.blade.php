<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bảng Phân Tích Yêu Cầu & Ước Tính Tiến Độ — Kenfinly</title>
    <meta name="description" content="Bảng phân tích yêu cầu và ước tính tiến độ chuẩn cho dự án Hệ thống Quản lý Sự kiện & Phòng họp Thông minh.">
    <meta name="robots" content="noindex, nofollow">

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
            --amber:     #d97706;
            --amber-bg:  #fffbeb;
            --amber-bdr: #fcd34d;
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
            font-size: clamp(20px, 4vw, 32px);
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .hero p {
            font-size: 15px;
            color: rgba(255,255,255,0.82);
            max-width: 600px;
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
        .hero-sub {
            font-size: 13px;
            color: rgba(255,255,255,0.65);
            margin-top: 8px;
        }

        /* ── Page shell ── */
        .page-wrap {
            max-width: 960px;
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

        /* ── Sub-heading ── */
        .sub-heading {
            font-size: 15px;
            font-weight: 700;
            color: var(--blue-dark);
            margin: 24px 0 10px;
            padding-left: 12px;
            border-left: 3px solid var(--blue);
        }

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
            margin-top: 8px;
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
        .box-amber {
            background: var(--amber-bg);
            border-left: 4px solid var(--amber-bdr);
            color: #78350f;
        }
        .box strong { display: block; margin-bottom: 6px; font-size: 14px; }
        .box p { margin-bottom: 0; font-size: 14px; }

        /* ── Table ── */
        .table-wrap {
            overflow-x: auto;
            margin: 20px 0 8px;
            border-radius: var(--radius);
            border: 1px solid var(--slate-200);
            box-shadow: 0 1px 6px rgba(0,0,0,0.05);
        }
        table.scope-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        table.scope-table th {
            background: linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%);
            color: #fff;
            font-weight: 600;
            padding: 13px 16px;
            text-align: left;
            white-space: nowrap;
        }
        table.scope-table td {
            padding: 14px 16px;
            vertical-align: top;
            border-top: 1px solid var(--slate-100);
            color: var(--slate-700);
            line-height: 1.65;
        }
        table.scope-table tr:nth-child(even) td {
            background: var(--slate-50);
        }
        table.scope-table tr:last-child td {
            border-bottom: none;
        }
        table.scope-table td.phase-cell {
            white-space: nowrap;
            font-weight: 700;
            color: var(--slate-900);
        }
        table.scope-table td.phase-cell small {
            display: block;
            font-weight: 400;
            font-size: 12px;
            color: var(--slate-600);
            margin-top: 2px;
        }
        table.scope-table td.center {
            text-align: center;
        }
        table.scope-table tfoot td {
            background: var(--blue-light);
            font-weight: 700;
            color: var(--blue-dark);
            border-top: 2px solid #93c5fd;
        }

        /* ── Badge ── */
        .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 99px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
        }
        .badge-med  { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
        .badge-high { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
        .badge-vhigh{ background: #fecaca; color: #7f1d1d; border: 1px solid #f87171; }

        /* ── Highlight text (critical items) ── */
        .text-critical {
            color: #b91c1c;
            font-weight: 600;
        }

        /* ── Work items list inside table ── */
        ul.work-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        ul.work-list li {
            display: flex;
            gap: 8px;
            margin-bottom: 7px;
            font-size: 14px;
            color: var(--slate-700);
            line-height: 1.55;
        }
        ul.work-list li:last-child { margin-bottom: 0; }
        ul.work-list li::before {
            content: '–';
            color: #93c5fd;
            flex-shrink: 0;
        }

        /* ── Recommendation cards ── */
        .rec-card {
            display: flex;
            gap: 16px;
            background: var(--blue-light);
            border-radius: 12px;
            padding: 20px 22px;
            margin-bottom: 14px;
        }
        .rec-card:last-child { margin-bottom: 0; }
        .rec-num {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: var(--blue);
            color: #fff;
            font-size: 13px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 2px;
        }
        .rec-body strong {
            display: block;
            font-size: 15px;
            color: var(--slate-900);
            margin-bottom: 6px;
        }
        .rec-body p {
            font-size: 14px;
            color: #1e3a8a;
            line-height: 1.65;
            margin-bottom: 0;
        }

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
        .contact-block h3 { font-size: 16px; font-weight: 700; margin-bottom: 10px; }
        .contact-block p  { color: rgba(255,255,255,0.85); font-size: 14px; margin-bottom: 0; }
        .contact-block a  { color: #bfdbfe; text-decoration: underline; }

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
        @media (max-width: 640px) {
            .card { padding: 28px 18px; }
            .topbar-tagline { display: none; }
            .hero { padding: 36px 16px 48px; }
            .contact-block { padding: 22px 18px; }
            .rec-card { flex-direction: column; gap: 10px; }
        }
    </style>
</head>
<body>

    {{-- Top bar --}}
    <div class="topbar">
        <a href="/" class="topbar-logo">Kenfinly</a>
        <span class="topbar-tagline">Tài liệu kỹ thuật dự án</span>
    </div>

    {{-- Hero --}}
    <div class="hero">
        <div class="hero-badge">Tài liệu kỹ thuật</div>
        <h1>Bảng Phân Tích Yêu Cầu &amp; Ước Tính Tiến Độ Chuẩn</h1>
        <p>Dự án: Hệ thống Quản lý Sự kiện &amp; Phòng họp Thông minh (Mini E-Cabinet)</p>
        <p class="hero-sub">Kiến trúc khuyến nghị: Laravel Backend (Cung cấp API) + React Frontend (Web App)</p>
    </div>

    {{-- Main content --}}
    <div class="page-wrap">
        <div class="card">

            {{-- Warning note --}}
            <div class="section">
                <div class="box box-amber">
                    <strong>⚠️ ĐÁNH GIÁ TỔNG QUAN TỪ CHUYÊN GIA (RỦI RO CAO — DỄ LỖ VÌ SỤP TIẾN ĐỘ):</strong>
                    <p>
                        Hệ thống này qua 6 màn hình chi tiết đã lộ diện là một con
                        <strong>Web App Quản lý Điều hành chuyên sâu</strong> chứ không dừng lại ở mức hiển thị
                        thông tin. Khối lượng màn hình Frontend cực kỳ đồ sộ (riêng trang My Account mở ra hơn
                        7 trang độc lập) kết hợp logic Backend đa tầng. Nếu một cá nhân tự nhận làm trong
                        4 tuần thì <strong>99% sẽ vỡ trận hoặc chịu lỗ nặng vì fix bug</strong>. Tài liệu này
                        bóc tách toàn bộ phạm vi thực tế để các bên thầu và khách hàng có căn cứ đàm phán
                        giá hợp lý và tiến độ khả thi.
                    </p>
                </div>
            </div>

            <hr class="divider">

            {{-- Section 1: Scope of Work --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">📋</div>
                    <h2 class="section-title">1. Bóc Tách Phạm Vi Công Việc Toàn Diện (Scope of Work)</h2>
                </div>

                {{-- Subsystem 1 --}}
                <p class="sub-heading">Phân hệ 1: Giao diện Đại biểu &amp; Trung tâm điều hướng (My Account)</p>
                <ul class="policy-list">
                    <li>
                        <span>
                            <strong>Trang chủ &amp; Chi tiết sự kiện:</strong>
                            Tự động phân loại sự kiện (Đang diễn ra, Sắp diễn ra, Đã kết thúc) bằng logic so
                            sánh thời gian thực; Hệ thống Menu 9 Tabs tại trang chi tiết (Lịch trình, Diễn giả,
                            Tài liệu, Hỏi đáp, Khảo sát...) kèm bộ đếm số lượng động.
                        </span>
                    </li>
                    <li>
                        <span>
                            <strong>Trang cá nhân quản trị &amp; điều hướng (My Account):</strong>
                            Dashboard thu nhỏ hiển thị thông tin profile cá nhân, Role quyền hạn (Admin / Đại biểu).
                            Gom các lối tắt dẫn tới các phân hệ độc lập: Lịch trình, Đại biểu &amp; Diễn giả,
                            Kho tài liệu PDF, Cài đặt tài khoản.
                        </span>
                    </li>
                    <li>
                        <span>
                            <strong>Phân hệ tương tác trực tiếp:</strong>
                            Module hiển thị mã QR cá nhân để quét check-in; Tính năng Hỏi đáp &amp; Khảo sát
                            trực tuyến (Form thu thập dữ liệu và đồng bộ trạng thái).
                        </span>
                    </li>
                </ul>

                {{-- Subsystem 2 --}}
                <p class="sub-heading">Phân hệ 2: Giao diện Quản trị cuộc họp nâng cao (Admin Dashboard)</p>
                <ul class="policy-list">
                    <li>
                        <span>
                            <strong>Quản lý cuộc họp (Mini E-Cabinet):</strong>
                            Giao diện danh sách các phiên họp / cuộc họp con thuộc sự kiện cha; Hiển thị Badge
                            thời gian (Tháng / Ngày) trực quan; Quản lý mã định danh cuộc họp (Mã nội bộ).
                        </span>
                    </li>
                    <li>
                        <span>
                            <strong>Bộ lọc &amp; Tìm kiếm đa trường:</strong>
                            Ô tìm kiếm tự do theo 4 trường (Tên, mã, chủ trì, phòng họp); Lọc theo sự kiện cha
                            (Dropdown); Thanh tab lọc nhanh theo trạng thái cuộc họp kèm bộ đếm số lượng;
                            Tính năng reset bộ lọc nhanh một chạm.
                        </span>
                    </li>
                    <li>
                        <span>
                            <strong>Logic tính toán &amp; Nghiệp vụ nâng cao:</strong>
                            Tự động tính toán tỉ lệ % chuyên cần / điểm danh của đại biểu trong từng phiên họp;
                            Quản lý cấu trúc dữ liệu đa tầng (Sự kiện &gt; Phiên họp &gt; Mục chương trình &amp;
                            Tài liệu đính kèm); Liên kết file Ghi âm và tính năng hiển thị Báo cáo tóm tắt AI.
                        </span>
                    </li>
                </ul>
            </div>

            <hr class="divider">

            {{-- Section 2: Timeline --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">📅</div>
                    <h2 class="section-title">2. Kế Hoạch Triển Khai Thực Tế Cho Một Đội Ngũ (Ước Tính 6 – 8 Tuần)</h2>
                </div>
                <p>
                    Để đảm bảo bàn giao sản phẩm chạy mượt mà tại hội trường lớn mà không bị sập tải hay
                    lỗi layout, tiến độ chuẩn cần được phân bổ như sau:
                </p>

                <div class="table-wrap">
                    <table class="scope-table">
                        <thead>
                            <tr>
                                <th style="width:150px">Giai đoạn</th>
                                <th>Đầu mục công việc chi tiết</th>
                                <th style="width:120px" class="center">Mức độ khó</th>
                                <th style="width:140px" class="center">Thời gian</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="phase-cell">
                                    Giai đoạn 1
                                    <small>Tuần 1</small>
                                </td>
                                <td>
                                    <ul class="work-list">
                                        <li>Thiết kế Database chi tiết (Relationships: Events, Meetings, Users, Agendas, Documents).</li>
                                        <li>Cài đặt Base Source Code Laravel, cấu hình bảo mật Auth JWT, phân quyền Role (Admin / Đại biểu).</li>
                                        <li>Hoàn thiện API CRUD Sự kiện, Cuộc họp và bộ lọc tìm kiếm đa trường.</li>
                                    </ul>
                                </td>
                                <td class="center"><span class="badge badge-med">Trung bình</span></td>
                                <td class="center"><strong>8 ngày công</strong></td>
                            </tr>
                            <tr>
                                <td class="phase-cell">
                                    Giai đoạn 2
                                    <small>Tuần 2 – 3</small>
                                </td>
                                <td>
                                    <ul class="work-list">
                                        <li>Xây dựng Base Source React Frontend.</li>
                                        <li>Thiết kế hệ thống Component dùng chung (Card, Button, Badge).</li>
                                        <li>Code giao diện Trang chủ Đại biểu.</li>
                                        <li>Code Trang Chi tiết Sự kiện (9 Tabs).</li>
                                        <li>Code Trang My Account.</li>
                                        <li>Quản lý State và bộ lọc phía Client.</li>
                                    </ul>
                                </td>
                                <td class="center"><span class="badge badge-high">Cao</span></td>
                                <td class="center"><strong>9 ngày công</strong></td>
                            </tr>
                            <tr>
                                <td class="phase-cell">
                                    Giai đoạn 3
                                    <small>Tuần 4</small>
                                </td>
                                <td>
                                    <ul class="work-list">
                                        <li>Code màn hình Admin Dashboard.</li>
                                        <li>Quản lý cuộc họp và Form tạo mới cuộc họp.</li>
                                        <li>Tích hợp bộ lọc nâng cao.</li>
                                        <li>Ghép nối API toàn bộ phân hệ Đại biểu và Admin.</li>
                                        <li>Triển khai HTTP Short Polling cho Thông báo và Hỏi đáp.</li>
                                    </ul>
                                </td>
                                <td class="center"><span class="badge badge-high">Cao</span></td>
                                <td class="center"><strong>8 ngày công</strong></td>
                            </tr>
                            <tr>
                                <td class="phase-cell">
                                    Giai đoạn 4
                                    <small>Tuần 5 – 6</small>
                                </td>
                                <td>
                                    <ul class="work-list">
                                        <li class="text-critical">Kiểm thử chức năng.</li>
                                        <li class="text-critical">Kiểm thử luồng Khảo sát, Hỏi đáp, Chuyên cần.</li>
                                        <li class="text-critical">Responsive Mobile.</li>
                                        <li>Bug Fixing.</li>
                                        <li>SQL Optimization.</li>
                                        <li>Staging Deployment.</li>
                                        <li>Nghiệm thu bàn giao.</li>
                                    </ul>
                                </td>
                                <td class="center"><span class="badge badge-vhigh">Rất cao</span></td>
                                <td class="center">
                                    <strong>10 ngày công</strong>
                                    <br><small style="color:#64748b;font-size:11px">(Dành riêng Test &amp; Fix)</small>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2"><strong>Tổng cộng</strong></td>
                                <td class="center"><span class="badge badge-vhigh">Rất cao</span></td>
                                <td class="center"><strong>35 ngày công</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <hr class="divider">

            {{-- Section 3: Recommendations --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">💡</div>
                    <h2 class="section-title">3. Khuyến Nghị Cho Khách Hàng (Dùng để đàm phán thầu)</h2>
                </div>

                <div class="rec-card">
                    <div class="rec-num">1</div>
                    <div class="rec-body">
                        <strong>Về cơ chế thông báo và tương tác</strong>
                        <p>
                            Do yêu cầu tối ưu hóa chi phí hạ tầng và tránh rủi ro nghẽn mạng tại hội trường,
                            các tính năng liên quan đến "Thông báo Realtime" hay "Hỏi đáp" nên được thống nhất
                            triển khai theo cơ chế cập nhật tự động giãn cách (<strong>HTTP Polling</strong>)
                            thay vì Websocket liên tục.
                        </p>
                    </div>
                </div>

                <div class="rec-card">
                    <div class="rec-num">2</div>
                    <div class="rec-body">
                        <strong>Về các tính năng nâng cao (AI, Ghi âm)</strong>
                        <p>
                            Để đảm bảo tiến độ bàn giao đúng hạn, trong giai đoạn 1 chỉ nên làm ở mức cấu hình
                            đính kèm file ghi âm thông thường và hiển thị Mockup kết quả báo cáo AI. Phần tích
                            hợp API AI tóm tắt tự động cần <strong>tách thành một giai đoạn riêng biệt</strong>
                            để tránh đẩy chi phí gói thầu lên quá cao.
                        </p>
                    </div>
                </div>
            </div>

            <hr class="divider">

            {{-- Contact --}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">📬</div>
                    <h2 class="section-title">Liên hệ tư vấn</h2>
                </div>
                <div class="contact-block">
                    <h3>Getkenka Ltd</h3>
                    <p>Mã số thuế: 0318304909</p>
                    <p>Địa chỉ: Tầng 2, 81 CMT8, Phường Bến Thành, Quận 1, TP.HCM</p>
                    <p style="margin-top:10px">
                        Email: <a href="mailto:purchasevn@getkenka.com">purchasevn@getkenka.com</a>
                        &nbsp;|&nbsp;
                        Điện thoại: <a href="tel:+840941069969">+84 0941 069 969</a>
                    </p>
                </div>
            </div>

        </div>{{-- /card --}}

        <div class="meta">
            <a href="/">← Về trang chủ Kenfinly</a>
            &nbsp;·&nbsp;
            <a href="/chinh-sach-bao-mat">Chính sách bảo mật</a>
            &nbsp;·&nbsp;
            <a href="/dieu-khoan-dich-vu">Điều khoản dịch vụ</a>
        </div>
    </div>{{-- /page-wrap --}}

</body>
</html>
