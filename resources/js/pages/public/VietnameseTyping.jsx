import React, { useState, useEffect } from 'react';
import { Copy, Trash2, Keyboard } from 'lucide-react';
import Layout2 from '../../components/public/Layout2';
import { useTranslation } from '../../contexts/TranslationContext';
import gtmTracking from '../../utils/gtmTracking';

function VietnameseTypingTool() {
    const [text, setText] = useState('');
    const { t } = useTranslation();

    useEffect(() => {
        // Track page view if tracking exists
        if (gtmTracking?.trackTextCasePageView) {
            gtmTracking.trackTextCasePageView();
        }
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        if (gtmTracking?.trackTextCaseAction) {
            gtmTracking.trackTextCaseAction('copy');
        }
    };

    const handleClear = () => {
        setText('');
        if (gtmTracking?.trackTextCaseAction) {
            gtmTracking.trackTextCaseAction('clear');
        }
    };

    return (
        <Layout2>
            <div className="w-full">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
                        <Keyboard className="w-10 h-10 text-blue-600" />
                        {t('vietnamese_typing.title') || 'Gõ Tiếng Việt'}
                    </h1>
                    <p className="text-lg text-gray-600">
                        {t('vietnamese_typing.subtitle') || 'Công cụ hỗ trợ soạn thảo văn bản Tiếng Việt có dấu trực tuyến.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Ad Space */}
                    <div className="hidden lg:block bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-center text-gray-400 text-sm italic h-[500px] text-center">
                        {t('textcase.ad_inquiry') || 'Advertisement Space'}
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="relative">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder={t('vietnamese_typing.placeholder') || 'Nhập văn bản Tiếng Việt tại đây...'}
                                className="w-full h-96 p-6 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none shadow-sm font-sans"
                                lang="vi"
                                spellCheck="false"
                            />
                            <div className="absolute bottom-4 right-4 text-xs text-gray-400">
                                {text.length} {t('common.characters') || 'ký tự'}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
                            <button 
                                onClick={handleCopy} 
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                <Copy size={18} /> {t('common.copy') || 'Sao chép'}
                            </button>
                            <button 
                                onClick={handleClear} 
                                className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all active:scale-95"
                            >
                                <Trash2 size={18} /> {t('common.clear') || 'Xóa tất cả'}
                            </button>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mt-8">
                            <h2 className="text-lg font-bold text-blue-900 mb-2">
                                {t('vietnamese_typing.guide_title') || 'Hướng dẫn gõ dấu'}
                            </h2>
                            <p className="text-sm text-blue-800 leading-relaxed">
                                {t('vietnamese_typing.guide_desc') || 'Trình duyệt hiện nay hầu hết đều hỗ trợ gõ Tiếng Việt mặc định. Bạn có thể sử dụng các bộ gõ như Unikey, EVKey với bảng mã Unicode để gõ trực tiếp vào ô văn bản trên.'}
                            </p>
                        </div>
                    </div>

                    {/* Right Ad Space */}
                    <div className="hidden lg:block bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-center text-gray-400 text-sm italic h-[500px] text-center">
                        {t('textcase.ad_inquiry') || 'Advertisement Space'}
                    </div>
                </div>

                {/* Bottom Ad Space */}
                <div className="mt-12 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 flex items-center justify-center text-gray-400 text-sm italic min-h-[100px] text-center">
                    {t('textcase.ad_inquiry') || 'Advertisement Space'}
                </div>
            </div>
        </Layout2>
    );
}

export default VietnameseTypingTool;
