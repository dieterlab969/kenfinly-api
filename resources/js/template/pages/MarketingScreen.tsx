import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import BackBtn from '../components/BackBtn.tsx';
import api from '../../utils/api';

interface MarketingPrefs {
    email_news: boolean;
    email_offers: boolean;
    email_surveys: boolean;
}

type PrefKey = keyof MarketingPrefs;

const defaultPrefs: MarketingPrefs = {
    email_news: true,
    email_offers: false,
    email_surveys: false,
};

const sections: { key: PrefKey; id: string; title: string; description: string }[] = [
    {
        key: 'email_news',
        id: 'switch-news',
        title: 'News',
        description:
            "We'll send important info about our products and benefits to help you get the most from your account.",
    },
    {
        key: 'email_offers',
        id: 'switch-offers',
        title: 'Offers',
        description:
            "From travel to technology and fashion to food. We'll send discounts and offers from our partner brands.",
    },
    {
        key: 'email_surveys',
        id: 'switch-surveys',
        title: 'Surveys',
        description:
            "From time to time, we'll invite you to share your opinions. By taking part, you can help us create an even better experience.",
    },
];

const MarketingScreen: React.FC = () => {
    const { t } = useTranslation();

    const [prefs, setPrefs] = useState<MarketingPrefs>(defaultPrefs);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        api.get('/user/preferences/marketing')
            .then(res => {
                setPrefs({
                    email_news:    res.data.data.email_news,
                    email_offers:  res.data.data.email_offers,
                    email_surveys: res.data.data.email_surveys,
                });
            })
            .catch(() => {
                showToast('error', 'Could not load preferences. Using defaults.');
            })
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = useCallback(
        async (key: PrefKey) => {
            const updated: MarketingPrefs = { ...prefs, [key]: !prefs[key] };
            setPrefs(updated);
            setSaving(true);
            try {
                await api.put('/user/preferences/marketing', updated);
                showToast('success', 'Preferences saved.');
            } catch {
                setPrefs(prefs);
                showToast('error', 'Failed to save. Please try again.');
            } finally {
                setSaving(false);
            }
        },
        [prefs],
    );

    return (
        <div>
            <div className="site-content">
                <div className="verify-number-main">

                    <div className="verify-number-top">
                        <div className="container">
                            <div className="verify-number-top-content">
                                <div className="back-btn">
                                    <BackBtn />
                                </div>
                                <div className="header-title">
                                    <p style={{ fontFamily: 'Satoshi, sans-serif' }}>{t('Marketing Preferences')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="verify-number-bottom">
                        <div className="verify-number-bottom-wrap">
                            <div className="verify-number-content">
                                <h1 className="d-none">Hidden</h1>

                                {/* Inline toast */}
                                {toast && (
                                    <div
                                        className={`alert alert-${toast.type === 'success' ? 'success' : 'danger'} py-2 px-3 mb-3`}
                                        style={{
                                            borderRadius: 12,
                                            fontSize: 13,
                                            fontFamily: 'Satoshi, sans-serif',
                                        }}
                                    >
                                        {t(toast.msg)}
                                    </div>
                                )}

                                <div className="marketing-wrap">
                                    <div className="marketing-content">
                                        <p style={{ fontFamily: 'Satoshi, sans-serif', color: '#6c757d' }}>
                                            {t("We'll send info that's relevant to you. You can choose what you'd like to get from us and how we should send it.")}
                                        </p>
                                    </div>

                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center py-5">
                                            <div
                                                className="spinner-border"
                                                role="status"
                                                style={{ color: '#7B51F1', width: 32, height: 32 }}
                                            >
                                                <span className="visually-hidden">{t('Loading…')}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        sections.map((section, idx) => (
                                            <div
                                                key={section.key}
                                                className={`marketing-content mt-16${idx === sections.length - 1 ? ' border-0' : ''}`}
                                            >
                                                <h2 style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700 }}>
                                                    {t(section.title)}
                                                </h2>
                                                <p
                                                    className="mt-8"
                                                    style={{
                                                        fontFamily: 'Satoshi, sans-serif',
                                                        color: '#6c757d',
                                                        fontSize: 14,
                                                    }}
                                                >
                                                    {t(section.description)}
                                                </p>
                                                <div className="notification-option-wrapper mt-8">
                                                    <div className="notification-option-name">
                                                        <p style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                            {t('Email me')}
                                                        </p>
                                                    </div>
                                                    <div className="notification-option-switch">
                                                        <label
                                                            className="switch"
                                                            htmlFor={section.id}
                                                            style={{ opacity: saving ? 0.6 : 1 }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                id={section.id}
                                                                checked={prefs[section.key]}
                                                                onChange={() => handleToggle(section.key)}
                                                                disabled={saving}
                                                            />
                                                            <span className="slider"></span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MarketingScreen;
