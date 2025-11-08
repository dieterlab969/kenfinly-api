import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';

const SettingsModal = ({ isOpen, onClose }) => {
    const { t, currentLanguage, languages, changeLanguage } = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage?.id);
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        if (currentLanguage?.id) {
            setSelectedLanguage(currentLanguage.id);
        }
    }, [currentLanguage]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        const language = languages.find(lang => lang.id === selectedLanguage);
        if (language) {
            await changeLanguage(language.id, language.code);
        }
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
                    <h2 className="text-xl font-bold text-gray-900">{t('settings.title')}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('settings.language')}
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            {t('settings.select_language')}
                        </p>
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {languages.map((language) => (
                                <option key={language.id} value={language.id}>
                                    {language.native_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                                saving
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {saving ? t('common.loading') : t('common.save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
