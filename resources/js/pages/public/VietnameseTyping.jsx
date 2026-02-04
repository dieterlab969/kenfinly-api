import React, { useState, useEffect, useRef } from 'react';
import { Copy, Trash2, Keyboard } from 'lucide-react';
import Layout2 from '../../components/public/Layout2';
import { useTranslation } from '../../contexts/TranslationContext';
import gtmTracking from '../../utils/gtmTracking';
import VNTYPING from '../../utils/vietnameseTyping';

/**
 * Vietnamese Typing Tool component that provides an interface for typing Vietnamese characters
 * using different input methods (Telex, VNI, VIQR).
 *
 * @component
 * @returns {React.ReactElement} The Vietnamese typing tool interface
 */
function VietnameseTypingTool() {
    const [text, setText] = useState('');
    const [imeMode, setImeMode] = useState('telex');
    const { t } = useTranslation();
    const textareaRef = useRef(null);

    useEffect(() => {
        if (gtmTracking?.trackVietnameseTypingPageView) {
            gtmTracking.trackVietnameseTypingPageView();
        }
        VNTYPING.setMode('telex');
    }, []);

    /**
     * Handles keyboard input events for Vietnamese character conversion.
     * Processes character input through the Vietnamese typing engine and updates the text
     * while maintaining cursor position. Allows functional keys and shortcuts to pass through.
     *
     * @param {KeyboardEvent} e - The keyboard event object
     */
    const handleKeyDown = (e) => {
        // Allow functional keys and shortcuts
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        
        const functionalKeys = [
            'Backspace', 'Delete', 'Enter', 'Tab', 'Escape', 
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 
            'Home', 'End', 'PageUp', 'PageDown', 'CapsLock', 'Shift', 'Control', 'Alt', 'Meta'
        ];
        
        if (functionalKeys.includes(e.key)) return;

        if (e.key.length === 1) {
            const selectionStart = e.target.selectionStart;
            const newContent = VNTYPING.process(text, e.key, selectionStart);
            
            if (newContent !== null) {
                e.preventDefault();
                setText(newContent);
                
                // Use requestAnimationFrame for smoother cursor handling
                requestAnimationFrame(() => {
                    if (textareaRef.current) {
                        const newPos = selectionStart + (newContent.length - text.length);
                        textareaRef.current.setSelectionRange(newPos, newPos);
                    }
                });
            }
        }
    };

    /**
     * Changes the Vietnamese input method editor (IME) mode.
     * Updates both the component state and the global Vietnamese typing mode.
     *
     * @param {string} mode - The IME mode to set ('telex', 'vni', 'viqr', or 'off')
     */
    const handleImeChange = (mode) => {
        setImeMode(mode);
        VNTYPING.setMode(mode);
    };

    /**
     * Copies the current text to the clipboard.
     * Also tracks the copy action via Google Tag Manager if available.
     */
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        if (gtmTracking?.trackTextCaseAction) {
            gtmTracking.trackTextCaseAction('copy');
        }
    };

    /**
     * Clears all text from the textarea.
     * Also tracks the clear action via Google Tag Manager if available.
     */
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
                        {t('vietnamese_typing.title')}
                    </h1>
                    <p className="text-lg text-gray-600 mb-8">
                        {t('vietnamese_typing.subtitle')}
                    </p>

                    {/* Input Method Selector */}
                    <div className="flex justify-center gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border-2 border-gray-100 max-w-md mx-auto">
                        {['telex', 'vni', 'viqr', 'off'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => handleImeChange(mode)}
                                className={`flex-1 py-2 px-4 rounded-xl font-bold transition-all ${
                                    imeMode === mode 
                                    ? 'bg-blue-600 text-white shadow-md scale-105' 
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                {mode.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Ad Space */}
                    <div className="hidden lg:block bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-center text-gray-400 text-sm italic h-[500px] text-center">
                        {t('textcase.ad_inquiry')}
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                value={text}
                                onKeyDown={handleKeyDown}
                                onChange={(e) => setText(e.target.value)}
                                placeholder={t('vietnamese_typing.placeholder')}
                                className="w-full h-96 p-6 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none shadow-sm font-sans"
                                lang="vi"
                                spellCheck="false"
                            />
                            <div className="absolute bottom-4 right-4 text-xs text-gray-400">
                                {text.length} {t('common.characters')}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                <Copy size={18} /> {t('common.copy')}
                            </button>
                            <button
                                onClick={handleClear}
                                className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all active:scale-95"
                            >
                                <Trash2 size={18} /> {t('common.clear')}
                            </button>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mt-8">
                            <h2 className="text-lg font-bold text-blue-900 mb-2">
                                {t('vietnamese_typing.guide_title')}
                            </h2>
                            <p className="text-sm text-blue-800 leading-relaxed">
                                {t('vietnamese_typing.guide_desc') || "Telex (aa=â, s=á), VNI (a6=â, a1=á), VIQR (a^=â, a'=á)."}
                            </p>
                        </div>
                    </div>

                    {/* Right Ad Space */}
                    <div className="hidden lg:block bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-center text-gray-400 text-sm italic h-[500px] text-center">
                        {t('textcase.ad_inquiry')}
                    </div>
                </div>

                {/* Bottom Ad Space */}
                <div className="mt-12 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 flex items-center justify-center text-gray-400 text-sm italic min-h-[100px] text-center">
                    {t('textcase.ad_inquiry')}
                </div>
            </div>
        </Layout2>
    );
}

export default VietnameseTypingTool;
