import React, { useState } from 'react';
import { Copy, Download, Trash2, ArrowRight } from 'lucide-react';
import PublicLayout from '../../components/public/PublicLayout';
import { useTranslation } from '../../contexts/TranslationContext';

function TextCaseConverter() {
    const [text, setText] = useState('');
    const { t } = useTranslation();

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([text], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "converted-text.txt";
        document.body.appendChild(element);
        element.click();
    };

    const handleClear = () => setText('');

    const convertToSentenceCase = () => {
        const converted = text.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, c => c.toUpperCase());
        setText(converted);
    };

    const convertToLower = () => setText(text.toLowerCase());
    const convertToUpper = () => setText(text.toUpperCase());
    
    const convertToCapitalized = () => {
        const converted = text.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        setText(converted);
    };

    const convertToAlternating = () => {
        const converted = text.split('').map((char, i) => i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()).join('');
        setText(converted);
    };

    const convertToTitle = () => {
        const converted = text.toLowerCase().split(' ').map(word => {
            if (['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by'].includes(word)) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
        setText(converted.charAt(0).toUpperCase() + converted.slice(1));
    };

    const convertToInverse = () => {
        const converted = text.split('').map(char => {
            if (char === char.toUpperCase()) return char.toLowerCase();
            return char.toUpperCase();
        }).join('');
        setText(converted);
    };

    return (
        <PublicLayout>
            <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Convert Case</h1>
                    <p className="text-lg text-gray-600">Fast, simple, and minimalist text case converter.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Ad Space */}
                    <div className="hidden lg:block bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-center text-gray-400 text-sm italic h-[600px]">
                        Ad Placement Space
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Type or paste your content here..."
                            className="w-full h-96 p-6 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none shadow-sm"
                        />

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <button onClick={convertToSentenceCase} className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm">Sentence case</button>
                            <button onClick={convertToLower} className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm">lower case</button>
                            <button onClick={convertToUpper} className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm">UPPER CASE</button>
                            <button onClick={convertToCapitalized} className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm">Capitalized Case</button>
                            <button onClick={convertToAlternating} className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm">aLtErNaTiNg cAsE</button>
                            <button onClick={convertToTitle} className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm">Title Case</button>
                            <button onClick={convertToInverse} className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm">InVeRsE CaSe</button>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
                            <button onClick={handleCopy} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95">
                                <Copy size={18} /> Copy to Clipboard
                            </button>
                            <button onClick={handleDownload} className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900 transition-all shadow-md hover:shadow-lg active:scale-95">
                                <Download size={18} /> Download
                            </button>
                            <button onClick={handleClear} className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all active:scale-95">
                                <Trash2 size={18} /> Clear
                            </button>
                        </div>
                    </div>

                    {/* Right Ad Space */}
                    <div className="hidden lg:block bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-center text-gray-400 text-sm italic h-[600px]">
                        Ad Placement Space
                    </div>
                </div>

                {/* Bottom Ad Space */}
                <div className="mt-12 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 flex items-center justify-center text-gray-400 text-sm italic min-h-[150px]">
                    Banner Ad Space (AdSense Friendly)
                </div>
            </div>
        </PublicLayout>
    );
}

export default TextCaseConverter;
