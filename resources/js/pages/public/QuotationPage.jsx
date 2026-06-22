import React from 'react';
import { AlertTriangle, FileText, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import PublicLayout from '../../components/public/PublicLayout';

function Badge({ level }) {
    const styles = {
        medium: 'bg-amber-100 text-amber-800 border border-amber-200',
        high:   'bg-red-100   text-red-800   border border-red-200',
        vhigh:  'bg-red-200   text-red-900   border border-red-300',
    };
    const labels = {
        medium: 'Trung bình',
        high:   'Cao',
        vhigh:  'Rất cao',
    };
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${styles[level]}`}>
            {labels[level]}
        </span>
    );
}

function SectionHeading({ number, children }) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {number}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{children}</h2>
        </div>
    );
}

function SubHeading({ children }) {
    return (
        <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-700 mt-8 mb-3">
            <ChevronRight className="w-5 h-5 flex-shrink-0" />
            {children}
        </h3>
    );
}

const phases = [
    {
        label:    'Giai đoạn 1',
        weeks:    '(Tuần 1 – 2)',
        level:    'medium',
        days:     '12 ngày công',
        note:     null,
        items: [
            'Thiết kế Database chi tiết (Relationships: Events, Meetings, Users, Agendas, Documents).',
            'Cài đặt Base Source Code Laravel, cấu hình bảo mật Auth JWT, phân quyền Role (Admin / Đại biểu).',
            'Hoàn thiện toàn bộ API CRUD Sự kiện, Cuộc họp, và API bộ lọc nâng cao đa trường.',
        ],
    },
    {
        label:    'Giai đoạn 2',
        weeks:    '(Tuần 3 – 4)',
        level:    'high',
        days:     '12 ngày công',
        note:     null,
        items: [
            'Xây dựng Base Source React Frontend, thiết kế hệ thống Component dùng chung (Card, Button, Badge).',
            'Code giao diện Trang chủ Đại biểu, Trang chi tiết sự kiện (Hệ thống 9 Tabs) và Trang cá nhân điều hướng (My Account).',
            'Quản lý State phức tạp cho các bộ lọc phía Client.',
        ],
    },
    {
        label:    'Giai đoạn 3',
        weeks:    '(Tuần 5 – 6)',
        level:    'high',
        days:     '12 ngày công',
        note:     null,
        items: [
            'Code màn hình Admin: Quản lý cuộc họp, Form tạo mới cuộc họp, tích hợp bộ lọc nâng cao.',
            'Ghép nối API (Integration) toàn bộ phân hệ Đại biểu và Admin.',
            'Triển khai giải pháp thay thế Websocket bằng cơ chế HTTP Short Polling cho mục "Thông báo" và "Hỏi đáp".',
        ],
    },
    {
        label:    'Giai đoạn 4',
        weeks:    '(Tuần 7 – 8)',
        level:    'vhigh',
        days:     '12 ngày công',
        note:     'Dành riêng cho Test & Fix',
        items: [
            'Kiểm thử chức năng (Functional Testing): Khảo sát, tính % chuyên cần, tìm kiếm lọc nâng cao.',
            'Tối ưu Responsive Thiết bị: Ép giao diện chạy mượt trên các dòng Mobile của Đại biểu.',
            'Sửa lỗi hệ thống (Bug fixing), tối ưu câu lệnh SQL, chạy thử nghiệm (Staging) và nghiệm thu bàn giao.',
        ],
        highlights: [0, 1],
    },
];

export default function QuotationPage() {
    return (
        <PublicLayout>

            {/* ── Hero ── */}
            <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                            <FileText className="w-4 h-4" />
                            Tài liệu kỹ thuật
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6 uppercase tracking-wide">
                            Bảng Phân Tích Yêu Cầu &amp; Ước Tính Tiến Độ Chuẩn
                        </h1>
                        <p className="text-lg md:text-xl text-blue-100 italic">
                            Dự án: Hệ thống Quản lý Sự kiện &amp; Phòng họp Thông minh (Mini E-Cabinet)
                        </p>
                        <p className="text-blue-200 mt-2">
                            Kiến trúc khuyến nghị: Laravel Backend (Cung cấp API) + React Frontend (Web App)
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Warning banner ── */}
            <section className="bg-amber-50 border-b border-amber-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex gap-4">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-amber-700" />
                            </div>
                        </div>
                        <div>
                            <p className="font-bold text-amber-900 mb-2">
                                ⚠️ ĐÁNH GIÁ TỔNG QUAN TỪ CHUYÊN GIA (RỦI RO CAO – DỄ LỖ VÌ SỤP TIẾN ĐỘ):
                            </p>
                            <p className="text-amber-800 leading-relaxed">
                                Hệ thống này qua 6 màn hình chi tiết đã lộ diện là một con{' '}
                                <strong>Web App Quản lý Điều hành chuyên sâu</strong> chứ không dừng lại ở
                                mức hiển thị thông tin. Khối lượng màn hình Frontend cực kỳ đồ sộ (riêng
                                trang My Account mở ra hơn 7 trang độc lập) kết hợp logic Backend đa tầng.
                                Nếu một cá nhân tự nhận làm trong 4 tuần thì{' '}
                                <strong className="text-red-700">99% sẽ vỡ trận hoặc chịu lỗ nặng vì fix bug.</strong>{' '}
                                Tài liệu này bóc tách toàn bộ phạm vi thực tế để các bên thầu và khách hàng
                                có căn cứ đàm phán giá hợp lý và tiến độ khả thi.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 1: Scope of Work ── */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeading number="1">
                        Bóc Tách Phạm Vi Công Việc Toàn Diện (Scope of Work)
                    </SectionHeading>

                    {/* Subsystem 1 */}
                    <div className="mb-10 bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100">
                        <SubHeading>Phân hệ 1: Giao diện Đại biểu &amp; Trung tâm điều hướng (My Account)</SubHeading>
                        <ul className="space-y-4 mt-4">
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 leading-relaxed">
                                    <strong className="text-gray-900">Trang chủ &amp; Chi tiết sự kiện:</strong>{' '}
                                    Tự động phân loại sự kiện (Đang diễn ra, Sắp diễn ra, Đã kết thúc) bằng
                                    logic so sánh thời gian thực; Hệ thống Menu 9 Tabs tại trang chi tiết
                                    (Lịch trình, Diễn giả, Tài liệu, Hỏi đáp, Khảo sát...) kèm bộ đếm số lượng động.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 leading-relaxed">
                                    <strong className="text-gray-900">Trang cá nhân quản trị &amp; điều hướng (My Account):</strong>{' '}
                                    Dashboard thu nhỏ hiển thị thông tin profile cá nhân, Role quyền hạn (Admin / Đại biểu).
                                    Gom các lối tắt dẫn tới các phân hệ độc lập: Lịch trình, Đại biểu &amp; Diễn giả,
                                    Kho tài liệu PDF, Cài đặt tài khoản.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 leading-relaxed">
                                    <strong className="text-gray-900">Phân hệ tương tác trực tiếp:</strong>{' '}
                                    Module hiển thị mã QR cá nhân để quét check-in; Tính năng Hỏi đáp &amp; Khảo sát
                                    trực tuyến (Form thu thập dữ liệu và đồng bộ trạng thái).
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Subsystem 2 */}
                    <div className="bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100">
                        <SubHeading>Phân hệ 2: Giao diện Quản trị cuộc họp nâng cao (Admin Dashboard)</SubHeading>
                        <ul className="space-y-4 mt-4">
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 leading-relaxed">
                                    <strong className="text-gray-900">Quản lý cuộc họp (Mini E-Cabinet):</strong>{' '}
                                    Giao diện danh sách các phiên họp / cuộc họp con thuộc sự kiện cha; Hiển thị Badge
                                    thời gian (Tháng / Ngày) trực quan; Quản lý mã định danh cuộc họp (Mã nội bộ).
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 leading-relaxed">
                                    <strong className="text-gray-900">Bộ lọc &amp; Tìm kiếm đa trường:</strong>{' '}
                                    Ô tìm kiếm tự do theo 4 trường (Tên, mã, chủ trì, phòng họp); Lọc theo sự kiện cha
                                    (Dropdown); Thanh tab lọc nhanh theo trạng thái cuộc họp kèm bộ đếm số lượng;
                                    Tính năng reset bộ lọc nhanh một chạm.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 leading-relaxed">
                                    <strong className="text-gray-900">Logic tính toán &amp; Nghiệp vụ nâng cao:</strong>{' '}
                                    Tự động tính toán tỉ lệ % chuyên cần / điểm danh của đại biểu trong từng phiên họp;
                                    Quản lý cấu trúc dữ liệu đa tầng (Sự kiện &gt; Phiên họp &gt; Mục chương trình &amp;
                                    Tài liệu đính kèm); Liên kết file Ghi âm và hiển thị Báo cáo tóm tắt AI.
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* ── Section 2: Timeline table ── */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeading number="2">
                        Kế Hoạch Triển Khai Thực Tế Cho Một Đội Ngũ (Ước Tính 6 – 8 Tuần)
                    </SectionHeading>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Để đảm bảo bàn giao sản phẩm chạy mượt mà tại hội trường lớn mà không bị sập tải hay lỗi
                        layout, tiến độ chuẩn cần được phân bổ như sau:
                    </p>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                    <th className="px-6 py-4 text-left font-semibold w-40">Giai đoạn</th>
                                    <th className="px-6 py-4 text-left font-semibold">Đầu mục công việc chi tiết</th>
                                    <th className="px-6 py-4 text-center font-semibold w-36">Mức độ khó</th>
                                    <th className="px-6 py-4 text-center font-semibold w-40">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody>
                                {phases.map((phase, idx) => (
                                    <tr
                                        key={idx}
                                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                    >
                                        <td className="px-6 py-5 align-top">
                                            <p className="font-bold text-gray-900">{phase.label}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">{phase.weeks}</p>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <ul className="space-y-2">
                                                {phase.items.map((item, i) => {
                                                    const isHighlighted = phase.highlights?.includes(i);
                                                    return (
                                                        <li key={i} className="flex gap-2">
                                                            <span className="text-blue-400 mt-1 flex-shrink-0">–</span>
                                                            <span className={`leading-relaxed ${isHighlighted ? 'text-red-700 font-semibold' : 'text-gray-700'}`}>
                                                                {item}
                                                            </span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </td>
                                        <td className="px-6 py-5 align-top text-center">
                                            <Badge level={phase.level} />
                                        </td>
                                        <td className="px-6 py-5 align-top text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Clock className="w-4 h-4 text-blue-500" />
                                                <span className="font-bold text-gray-900">{phase.days}</span>
                                                {phase.note && (
                                                    <span className="text-xs text-gray-500 italic">({phase.note})</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-blue-50 border-t-2 border-blue-200">
                                    <td colSpan={2} className="px-6 py-4 font-bold text-gray-900">
                                        Tổng cộng
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Badge level="vhigh" />
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-blue-700">
                                        48 ngày công
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-4">
                        {phases.map((phase, idx) => (
                            <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-white">{phase.label}</p>
                                        <p className="text-blue-100 text-xs">{phase.weeks}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold text-sm">{phase.days}</p>
                                        {phase.note && <p className="text-blue-100 text-xs italic">{phase.note}</p>}
                                    </div>
                                </div>
                                <div className="px-5 py-4">
                                    <div className="mb-3">
                                        <Badge level={phase.level} />
                                    </div>
                                    <ul className="space-y-2">
                                        {phase.items.map((item, i) => {
                                            const isHighlighted = phase.highlights?.includes(i);
                                            return (
                                                <li key={i} className="flex gap-2 text-sm">
                                                    <span className="text-blue-400 mt-0.5 flex-shrink-0">–</span>
                                                    <span className={`leading-relaxed ${isHighlighted ? 'text-red-700 font-semibold' : 'text-gray-700'}`}>
                                                        {item}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        ))}
                        <div className="bg-blue-50 rounded-xl border border-blue-200 px-5 py-4 flex items-center justify-between">
                            <span className="font-bold text-gray-900">Tổng cộng</span>
                            <span className="font-bold text-blue-700">48 ngày công</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 3: Recommendations ── */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeading number="3">
                        Khuyến Nghị Cho Khách Hàng (Dùng để đàm phán thầu)
                    </SectionHeading>
                    <div className="space-y-4">
                        <div className="flex gap-4 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">1</div>
                            <div>
                                <p className="font-semibold text-gray-900 mb-1">Về cơ chế thông báo và tương tác</p>
                                <p className="text-gray-700 leading-relaxed">
                                    Do yêu cầu tối ưu hóa chi phí hạ tầng và tránh rủi ro nghẽn mạng tại hội trường,
                                    các tính năng liên quan đến "Thông báo Realtime" hay "Hỏi đáp" nên được thống nhất
                                    triển khai theo cơ chế cập nhật tự động giãn cách (<strong>HTTP Polling</strong>) thay
                                    vì Websocket liên tục.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">2</div>
                            <div>
                                <p className="font-semibold text-gray-900 mb-1">Về các tính năng nâng cao (AI, Ghi âm)</p>
                                <p className="text-gray-700 leading-relaxed">
                                    Để đảm bảo tiến độ bàn giao đúng hạn, trong giai đoạn 1 chỉ nên làm ở mức cấu hình
                                    đính kèm file ghi âm thông thường và hiển thị Mockup kết quả báo cáo AI. Phần tích
                                    hợp API AI tóm tắt tự động cần{' '}
                                    <strong>tách thành một giai đoạn riêng biệt</strong> để tránh đẩy chi phí gói thầu
                                    lên quá cao.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer CTA ── */}
            <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <FileText className="w-14 h-14 mx-auto mb-5 opacity-80" />
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                        Cần tư vấn thêm về dự án?
                    </h2>
                    <p className="text-blue-100 text-lg mb-8">
                        Liên hệ đội ngũ Getkenka để được tư vấn chi tiết về phạm vi công việc và mức giá phù hợp.
                    </p>
                    <a
                        href="mailto:purchasevn@getkenka.com"
                        className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all shadow-lg"
                    >
                        purchasevn@getkenka.com
                    </a>
                </div>
            </section>

        </PublicLayout>
    );
}
