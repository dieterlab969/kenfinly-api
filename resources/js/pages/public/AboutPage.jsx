import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import wordpressApi from '../../services/wordpressApi';

function AboutPage() {
    const [pageContent, setPageContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchPage = async () => {
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
    };

    useEffect(() => {
        fetchPage();
    }, []);

    const values = [
        {
            icon: Shield,
            title: 'Security First',
            description: 'Your financial data is protected with enterprise-grade encryption and security measures.'
        },
        {
            icon: Users,
            title: 'User-Centric',
            description: 'Every feature is designed with our users in mind, making financial management intuitive.'
        },
        {
            icon: Target,
            title: 'Goal-Oriented',
            description: 'We help you set, track, and achieve your financial goals with powerful tools.'
        },
        {
            icon: Heart,
            title: 'Transparency',
            description: 'We believe in clear, honest communication about your finances and our services.'
        }
    ];

    const stats = [
        { value: '10K+', label: 'Active Users' },
        { value: '$50M+', label: 'Tracked Annually' },
        { value: '99.9%', label: 'Uptime' },
        { value: '4.9/5', label: 'User Rating' }
    ];

    return (
        <PublicLayout>
            <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            About Kenfinly
                        </h1>
                        <p className="text-xl text-blue-100">
                            We're on a mission to help everyone take control of their financial future 
                            through intuitive, powerful personal finance tools.
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                                Our Story
                            </h2>
                            {loading ? (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            ) : error ? (
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <p className="text-gray-600 mb-4">
                                        We're having trouble loading our story. The content will be available shortly.
                                    </p>
                                    <button
                                        onClick={fetchPage}
                                        className="text-blue-600 font-medium hover:text-blue-700 inline-flex items-center"
                                    >
                                        Try Again
                                        <ArrowRight className="ml-1 w-4 h-4" />
                                    </button>
                                </div>
                            ) : pageContent?.content?.rendered ? (
                                <div 
                                    className="prose prose-lg text-gray-600"
                                    dangerouslySetInnerHTML={{ __html: pageContent.content.rendered }}
                                />
                            ) : (
                                <div className="space-y-4 text-gray-600">
                                    <p>
                                        Kenfinly was born from a simple observation: managing personal finances 
                                        shouldn't be complicated. Too many people struggle with spreadsheets, 
                                        lose track of expenses, or feel overwhelmed by their financial situation.
                                    </p>
                                    <p>
                                        We built Kenfinly to change that. Our platform combines powerful financial 
                                        tracking with an intuitive interface that anyone can use. Whether you're 
                                        just starting your financial journey or looking to optimize your wealth 
                                        management, Kenfinly grows with you.
                                    </p>
                                    <p>
                                        Today, thousands of users trust Kenfinly to help them understand their 
                                        spending, plan their budgets, and achieve their financial goals.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 flex items-center justify-center h-80">
                            <div className="text-center text-white">
                                <TrendingUp className="w-24 h-24 mx-auto mb-4 opacity-80" />
                                <p className="text-2xl font-semibold">Empowering Financial Freedom</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16 bg-blue-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-white">
                                <div className="text-4xl md:text-5xl font-bold mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-blue-100">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Our Values
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            The principles that guide everything we do at Kenfinly.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value, index) => (
                            <div 
                                key={index}
                                className="bg-white rounded-xl p-8 text-center hover:shadow-lg transition-shadow"
                            >
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                                    <value.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                    {value.title}
                                </h3>
                                <p className="text-gray-600">
                                    {value.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Award className="w-16 h-16 mx-auto mb-6 opacity-80" />
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        Join Our Growing Community
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Start your journey to financial freedom today. Join thousands of users 
                        who have transformed their relationship with money.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all shadow-lg"
                        >
                            Get Started Free
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                        <Link
                            to="/blog"
                            className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all"
                        >
                            Read Our Blog
                        </Link>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

export default AboutPage;
