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
    AlertCircle
} from 'lucide-react';
import PublicLayout from '../../components/public/PublicLayout';
import { PostCardSkeleton, TipCardSkeleton } from '../../components/public/SkeletonLoaders';
import { ErrorState, EmptyState } from '../../components/shared/ErrorState';
import { stripHtml, truncate, formatDate } from '../../utils/textUtils';
import wordpressApi from '../../services/wordpressApi';

function LandingPage() {
    const [latestPosts, setLatestPosts] = useState([]);
    const [financialTips, setFinancialTips] = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [tipsLoading, setTipsLoading] = useState(true);
    const [postsError, setPostsError] = useState(false);
    const [tipsError, setTipsError] = useState(false);

    const fetchContent = async () => {
        setPostsLoading(true);
        setTipsLoading(true);
        setPostsError(false);
        setTipsError(false);

        try {
            const [postsResult, tipsResult] = await Promise.all([
                wordpressApi.getPosts({ per_page: 3 }),
                wordpressApi.getFinancialTips({ per_page: 3 })
            ]);

            // Handle posts
            if (postsResult.success) {
                setLatestPosts(postsResult.posts || []);
            } else {
                setLatestPosts([]);
                setPostsError(true);
            }

            // Handle financial tips with proper API response handling
            if (tipsResult.success) {
                // Support both singular and plural response property names
                const tips = tipsResult.financial_tips || tipsResult.financial_tip || [];
                setFinancialTips(Array.isArray(tips) ? tips : []);
            } else {
                setFinancialTips([]);
                setTipsError(true);
            }
        } catch (error) {
            console.error('Error fetching WordPress content:', error);
            setLatestPosts([]);
            setFinancialTips([]);
            setPostsError(true);
            setTipsError(true);
        } finally {
            setPostsLoading(false);
            setTipsLoading(false);
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
                                aria-label="Start your free 14-day trial of Kenfinly"
                                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-blue-600"
                            >
                                Start Free Trial
                                <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
                            </Link>
                            <Link
                                to="/login"
                                aria-label="Sign in to your Kenfinly account"
                                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-blue-600"
                            >
                                Sign In
                            </Link>
                        </div>
                        <div className="mt-8 flex justify-center items-center space-x-6 text-blue-100">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2 text-green-400" aria-hidden="true" />
                                <span>Free 14-day trial</span>
                            </div>
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2 text-green-400" aria-hidden="true" />
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
                                className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow border border-gray-100 focus-within:ring-2 focus-within:ring-blue-600"
                            >
                                <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                    <feature.icon className="w-7 h-7 text-white" aria-hidden="true" />
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
                            aria-label="View all blog posts"
                            className="hidden md:flex items-center text-blue-600 font-semibold hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1"
                        >
                            View All Posts
                            <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
                        </Link>
                    </div>

                    {postsLoading ? (
                        <PostCardSkeleton count={3} columns={3} />
                    ) : postsError ? (
                        <ErrorState
                            title="Content Temporarily Unavailable"
                            message="We're having trouble loading our latest articles. Please check back later or contact support if the issue persists."
                            onRetry={fetchContent}
                            retryLabel="Try Again"
                            variant="card"
                        />
                    ) : latestPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {latestPosts.map((post) => (
                                <article 
                                    key={post.id}
                                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-blue-600"
                                >
                                    <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <TrendingUp className="w-16 h-16 text-white opacity-50" aria-hidden="true" />
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center text-sm text-gray-500 mb-3">
                                            <Calendar className="w-4 h-4 mr-1" aria-hidden="true" />
                                            <time dateTime={post.date}>
                                                {formatDate(post.date)}
                                            </time>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                                            <Link 
                                                to={`/blog/${post.slug}`}
                                                className="hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 rounded px-1"
                                            >
                                                {stripHtml(post.title?.rendered || 'Untitled')}
                                            </Link>
                                        </h3>
                                        <p className="text-gray-600 mb-4 line-clamp-3">
                                            {truncate(post.excerpt?.rendered)}
                                        </p>
                                        <Link
                                            to={`/blog/${post.slug}`}
                                            className="text-blue-600 font-medium hover:text-blue-700 inline-flex items-center focus:outline-none focus:ring-2 focus:ring-blue-600 rounded px-1"
                                        >
                                            Read More
                                            <ArrowRight className="ml-1 w-4 h-4" aria-hidden="true" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Coming Soon"
                            message="Our blog is being set up. Check back soon for financial tips and insights!"
                            icon={TrendingUp}
                        />
                    )}

                    <div className="md:hidden mt-8 text-center">
                        <Link 
                            to="/blog"
                            aria-label="View all blog posts"
                            className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1"
                        >
                            View All Posts
                            <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
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

                        {tipsLoading ? (
                            <TipCardSkeleton count={3} />
                        ) : tipsError ? (
                            <ErrorState
                                title="Tips Temporarily Unavailable"
                                message="We're having trouble loading our financial tips. Please try again later."
                                onRetry={fetchContent}
                                retryLabel="Try Again"
                                variant="blue"
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {financialTips.map((tip) => (
                                    <div 
                                        key={tip.id}
                                        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 focus-within:ring-2 focus-within:ring-blue-600"
                                    >
                                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle className="w-5 h-5 text-white" aria-hidden="true" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            {stripHtml(tip.title?.rendered || 'Financial Tip')}
                                        </h3>
                                        <p className="text-gray-600 text-sm">
                                            {truncate(tip.content?.rendered, 120)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
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
                            aria-label="Get started free with Kenfinly"
                            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                        >
                            Get Started Free
                            <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
                        </Link>
                        <Link
                            to="/blog"
                            aria-label="Read our financial blog"
                            className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
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
