import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    TrendingUp, 
    PieChart, 
    Target, 
    Shield, 
    Smartphone, 
    Users,
    ArrowRight,
    CheckCircle,
    Calendar,
    User
} from 'lucide-react';
import PublicLayout from '../../components/public/PublicLayout';
import wordpressApi from '../../services/wordpressApi';

function LandingPage() {
    const [latestPosts, setLatestPosts] = useState([]);
    const [financialTips, setFinancialTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [postsError, setPostsError] = useState(false);

    const fetchContent = async () => {
        setLoading(true);
        setPostsError(false);
        try {
            const [postsResult, tipsResult] = await Promise.all([
                wordpressApi.getPosts({ per_page: 3 }),
                wordpressApi.getFinancialTips({ per_page: 3 })
            ]);

            if (postsResult.success) {
                setLatestPosts(postsResult.posts || []);
                setPostsError(false);
            } else {
                setLatestPosts([]);
                setPostsError(true);
            }
            if (tipsResult.success) {
                setFinancialTips(tipsResult.financial_tip || []);
            }
        } catch (error) {
            console.error('Error fetching WordPress content:', error);
            setLatestPosts([]);
            setPostsError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const features = [
        {
            icon: PieChart,
            title: 'Expense Tracking',
            description: 'Track every expense across multiple accounts and currencies with ease.'
        },
        {
            icon: Target,
            title: 'Budget Planning',
            description: 'Set and monitor budgets to stay on track with your financial goals.'
        },
        {
            icon: TrendingUp,
            title: 'Analytics Dashboard',
            description: 'Visualize your spending patterns with intuitive charts and reports.'
        },
        {
            icon: Shield,
            title: 'Secure & Private',
            description: 'Your financial data is encrypted and protected with enterprise-grade security.'
        },
        {
            icon: Smartphone,
            title: 'Access Anywhere',
            description: 'Manage your finances on any device with our responsive design.'
        },
        {
            icon: Users,
            title: 'Multi-user Support',
            description: 'Collaborate with family members or partners on shared accounts.'
        }
    ];

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const stripHtml = (html) => {
        if (!html) return '';
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const truncate = (text, length = 150) => {
        if (!text) return '';
        const stripped = stripHtml(text);
        if (stripped.length <= length) return stripped;
        return stripped.substring(0, length) + '...';
    };

    return (
        <PublicLayout>
            <section className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                    <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                </div>
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            Take Control of Your
                            <span className="block text-yellow-300">Financial Future</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
                            Track expenses, set budgets, and achieve your financial goals with 
                            Kenfinly - the intuitive personal finance management platform.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
                            >
                                Start Free Trial
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all"
                            >
                                Sign In
                            </Link>
                        </div>
                        <div className="mt-8 flex justify-center items-center space-x-6 text-blue-100">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                                <span>Free 14-day trial</span>
                            </div>
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                                <span>No credit card required</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Everything You Need to Manage Your Finances
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Powerful features designed to help you understand, control, and grow your money.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div 
                                key={index}
                                className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow border border-gray-100"
                            >
                                <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                Latest from Our Blog
                            </h2>
                            <p className="text-xl text-gray-600">
                                Financial tips, insights, and news to help you succeed.
                            </p>
                        </div>
                        <Link 
                            to="/blog"
                            className="hidden md:flex items-center text-blue-600 font-semibold hover:text-blue-700"
                        >
                            View All Posts
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                                    <div className="h-48 bg-gray-200"></div>
                                    <div className="p-6">
                                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : postsError ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Content Temporarily Unavailable</h3>
                            <p className="text-gray-500 mb-4">
                                We're having trouble loading our latest articles. Please check back later.
                            </p>
                            <button
                                onClick={fetchContent}
                                className="text-blue-600 font-medium hover:text-blue-700 inline-flex items-center"
                            >
                                Try Again
                                <ArrowRight className="ml-1 w-4 h-4" />
                            </button>
                        </div>
                    ) : latestPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {latestPosts.map((post) => (
                                <article 
                                    key={post.id}
                                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                                >
                                    <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <TrendingUp className="w-16 h-16 text-white opacity-50" />
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center text-sm text-gray-500 mb-3">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            <span>{formatDate(post.date)}</span>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                                            {post.title?.rendered || 'Untitled'}
                                        </h3>
                                        <p className="text-gray-600 mb-4 line-clamp-3">
                                            {truncate(post.excerpt?.rendered)}
                                        </p>
                                        <Link
                                            to={`/blog/${post.slug}`}
                                            className="text-blue-600 font-medium hover:text-blue-700 inline-flex items-center"
                                        >
                                            Read More
                                            <ArrowRight className="ml-1 w-4 h-4" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl">
                            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h3>
                            <p className="text-gray-500">
                                Our blog is being set up. Check back soon for financial tips and insights!
                            </p>
                        </div>
                    )}

                    <div className="md:hidden mt-8 text-center">
                        <Link 
                            to="/blog"
                            className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700"
                        >
                            View All Posts
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {financialTips.length > 0 && (
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                Financial Tips
                            </h2>
                            <p className="text-xl text-gray-600">
                                Expert advice to help you make smarter financial decisions.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {financialTips.map((tip) => (
                                <div 
                                    key={tip.id}
                                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100"
                                >
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {tip.title?.rendered || 'Financial Tip'}
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        {truncate(tip.content?.rendered, 120)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        Ready to Transform Your Financial Life?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Join thousands of users who have taken control of their finances with Kenfinly.
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

export default LandingPage;
