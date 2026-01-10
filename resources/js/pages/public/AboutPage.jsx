import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
    TrendingUp,
    Target,
    Users,
    Shield,
    Award,
    ArrowRight,
    Heart
} from 'lucide-react';
import PublicLayout from '../../components/public/PublicLayout';
import { StatsSkeleton, ValuesSkeleton, ContentSkeleton } from '../../components/public/SkeletonLoaders';
import wordpressApi from '../../services/wordpressApi';
import {useTranslation} from "@assets/js/contexts/TranslationContext.jsx";

function AboutPage() {
    const { t } = useTranslation();
    const DEFAULT_VALUES = [
        {
            icon: Shield,
            title: t('aboutus.feature.security_first_title'),
            description: t('aboutus.feature.security_first_description')
        },
        {
            icon: Users,
            title: t('aboutus.feature.user_centric_title'),
            description: t('aboutus.feature.user_centric_description')
        },
        {
            icon: Target,
            title: t('about.values.goal_oriented.title'),
            description: t('about.values.goal_oriented.description')
        },
        {
            icon: Heart,
            title: t('about.values.transparency.title'),
            description: t('about.values.transparency.description')
        }
    ];

    const DEFAULT_STATS = [
        { value: '10K+', label: t('aboutus.stats.active_users_label') },
        { value: '$50M+', label: t('aboutus.stats.tracked_annually_label') },
        { value: '99.9%', label: t('aboutus.stats.uptime_label') },
        { value: '4.9/5', label: t('aboutus.stats.user_rating_label') }
    ];
    const [pageContent, setPageContent] = useState(null);
    const [stats, setStats] = useState(DEFAULT_STATS);
    const [values, setValues] = useState(DEFAULT_VALUES);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [valuesLoading, setValuesLoading] = useState(true);
    const [error, setError] = useState(false);
    const [statsError, setStatsError] = useState(false);
    const [valuesError, setValuesError] = useState(false);


    const fetchPage = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const result = await wordpressApi.getPageBySlug('about');
            if (result.success && result.page) {
                setPageContent(result.page);
            } else {
                setError(true);
            }
        } catch (err) {
            console.error('Error fetching about page:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        setStatsError(false);
        try {
            const result = await wordpressApi.getAboutStats();
            if (result.success && result.stats && Array.isArray(result.stats)) {
                setStats(result.stats);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
            setStatsError(true);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const fetchValues = useCallback(async () => {
        setValuesLoading(true);
        setValuesError(false);
        try {
            const result = await wordpressApi.getAboutValues();
            if (result.success && result.values && Array.isArray(result.values)) {
                setValues(result.values);
            }
        } catch (err) {
            console.error('Error fetching values:', err);
            setValuesError(true);
        } finally {
            setValuesLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPage();
        fetchStats();
        fetchValues();
    }, [fetchPage, fetchStats, fetchValues]);

    const sanitizedContent = pageContent?.content?.rendered
        ? DOMPurify.sanitize(pageContent.content.rendered)
        : null;

    return (
        <PublicLayout>
            <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            {t('aboutus.hero.title')}
                        </h1>
                        <p className="text-xl text-blue-100">
                            {t('aboutus.hero.description')}
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-20 bg-white" aria-labelledby="our-story-heading">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 id="our-story-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                                {t('aboutus.section.our_story_title')}
                            </h2>
                            {loading ? (
                                <ContentSkeleton />
                            ) : error ? (
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <p className="text-gray-600 mb-4">
                                        {t('aboutus.error.loading_story_message')}
                                    </p>
                                    <button
                                        onClick={fetchPage}
                                        className="text-blue-600 font-medium hover:text-blue-700 inline-flex items-center focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1"
                                        aria-label="Retry loading our story"
                                    >
                                        {t('aboutus.error.retry_label')}
                                        <ArrowRight className="ml-1 w-4 h-4" />
                                    </button>
                                </div>
                            ) : sanitizedContent ? (
                                <div
                                    className="prose prose-lg text-gray-600"
                                    dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                                    role="region"
                                    aria-label="Our Story content"
                                />
                            ) : (
                                <div className="space-y-4 text-gray-600">
                                    <p>
                                        {t('aboutus.story.paragraph1')}
                                    </p>
                                    <p>
                                        {t('aboutus.story.paragraph2')}
                                    </p>
                                    <p>
                                        {t('aboutus.story.paragraph3')}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 flex items-center justify-center h-80">
                            <div className="text-center text-white">
                                <TrendingUp className="w-24 h-24 mx-auto mb-4 opacity-80" aria-hidden="true" />
                                <p className="text-2xl font-semibold">{t('aboutus.tagline.empowering_financial_freedom')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16 bg-blue-600" aria-labelledby="stats-heading">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 id="stats-heading" className="sr-only">{t('aboutus.stats.heading')}</h2>
                    {statsLoading ? (
                        <StatsSkeleton />
                    ) : statsError ? (
                        <div className="text-center text-white">
                            <p className="mb-4">{t('aboutus.stats.error_message')}</p>
                            <button
                                onClick={fetchStats}
                                className="text-blue-100 hover:text-white inline-flex items-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 rounded px-2 py-1"
                                aria-label="Retry loading statistics"
                            >
                                {t('aboutus.stats.retry_label')}
                                <ArrowRight className="ml-1 w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-white" role="article" aria-label={`${stat.label}: ${stat.value}`}>
                                    <div className="text-4xl md:text-5xl font-bold mb-2">
                                        {stat.value}
                                    </div>
                                    <div className="text-blue-100">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="py-20 bg-gray-50" aria-labelledby="values-heading">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 id="values-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            {t('aboutus.values.heading')}
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            {t('about.values.description')}
                        </p>
                    </div>

                    {valuesLoading ? (
                        <ValuesSkeleton />
                    ) : valuesError ? (
                        <div className="text-center text-gray-600">
                            <p className="mb-4">{t('about.load_error_message')}</p>
                            <button
                                onClick={fetchValues}
                                className="text-blue-600 hover:text-blue-700 inline-flex items-center focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1"
                                aria-label="Retry loading our values"
                            >
                                {t('about.retry_action_text')}
                                <ArrowRight className="ml-1 w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {values.map((value, index) => {
                                const IconComponent = value.icon || Heart;
                                return (
                                    <article
                                        key={index}
                                        className="bg-white rounded-xl p-8 text-center hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-blue-600"
                                    >
                                        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                                            <IconComponent className="w-8 h-8 text-white" aria-hidden="true" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                            {value.title}
                                        </h3>
                                        <p className="text-gray-600">
                                            {value.description}
                                        </p>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Award className="w-16 h-16 mx-auto mb-6 opacity-80" aria-hidden="true" />
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        {t('aboutus.community.title')}
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        {t('aboutus.community.description')}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                            aria-label={t('aboutus.community.button_get_started')}
                        >
                            {t('aboutus.community.button_get_started')}
                            <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
                        </Link>
                        <Link
                            to="/blog"
                            className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                            aria-label={t('aboutus.community.button_read_blog')}
                        >
                            {t('aboutus.community.button_read_blog')}
                        </Link>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

export default AboutPage;
