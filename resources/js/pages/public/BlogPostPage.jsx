import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
    Calendar, 
    User, 
    Tag, 
    ArrowLeft,
    ArrowRight,
    TrendingUp,
    Share2,
    Clock
} from 'lucide-react';
import PublicLayout from '../../components/public/PublicLayout';
import { ArticleSkeleton } from '../../components/public/SkeletonLoaders';
import { stripHtml, truncate, formatDate } from '../../utils/textUtils';
import wordpressApi from '../../services/wordpressApi';
import gtmTracking from '../../utils/gtmTracking';

function BlogPostPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await wordpressApi.getPostBySlug(slug);
                
                if (result.success && result.post) {
                    setPost(result.post);
                    // Track blog article view
                    gtmTracking.trackBlogArticleView(result.post.title?.rendered || 'Article', result.post.id);
                    
                    const relatedResult = await wordpressApi.getPosts({ 
                        per_page: 3,
                        exclude: result.post.id 
                    });
                    if (relatedResult.success) {
                        setRelatedPosts(relatedResult.posts || []);
                    }
                } else {
                    setError('Post not found');
                }
            } catch (error) {
                console.error('Error fetching post:', error);
                setError('Failed to load post');
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchPost();
            window.scrollTo(0, 0);
        }
    }, [slug]);

    const calculateReadTime = (content) => {
        if (!content) return '5 min read';
        const text = stripHtml(content);
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    };

    const handleShare = async () => {
        const url = window.location.href;
        const title = post?.title?.rendered || 'Kenfinly Blog';
        
        if (navigator.share) {
            try {
                gtmTracking.trackShareArticle('native_share', title);
                await navigator.share({ title, url });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            gtmTracking.trackShareArticle('copy_link', title);
            await navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <PublicLayout>
                <ArticleSkeleton />
            </PublicLayout>
        );
    }

    if (error) {
        return (
            <PublicLayout>
                <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                    <TrendingUp className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        {error}
                    </h1>
                    <p className="text-gray-600 mb-8">
                        The article you're looking for doesn't exist or has been removed.
                    </p>
                    <Link
                        to="/blog"
                        className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700"
                    >
                        <ArrowLeft className="mr-2 w-5 h-5" />
                        Back to Blog
                    </Link>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <article className="py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link
                        to="/blog"
                        className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700 mb-8"
                    >
                        <ArrowLeft className="mr-2 w-5 h-5" />
                        Back to Blog
                    </Link>

                    <header className="mb-8">
                        <h1 
                            className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight"
                            dangerouslySetInnerHTML={{ __html: post?.title?.rendered || '' }}
                        />
                        
                        <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
                            <div className="flex items-center">
                                <Calendar className="w-5 h-5 mr-2" />
                                <span>{formatDate(post?.date)}</span>
                            </div>
                            <div className="flex items-center">
                                <Clock className="w-5 h-5 mr-2" />
                                <span>{calculateReadTime(post?.content?.rendered)}</span>
                            </div>
                            <button
                                onClick={handleShare}
                                className="flex items-center text-blue-600 hover:text-blue-700"
                            >
                                <Share2 className="w-5 h-5 mr-2" />
                                <span>Share</span>
                            </button>
                        </div>
                    </header>

                    <div className="h-64 md:h-96 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-10">
                        <TrendingUp className="w-24 h-24 text-white opacity-50" />
                    </div>

                    <div 
                        className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
                        dangerouslySetInnerHTML={{ __html: post?.content?.rendered || '' }}
                    />

                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-600">Share this article:</span>
                                <button
                                    onClick={handleShare}
                                    className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                            <Link
                                to="/register"
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all"
                            >
                                Try Kenfinly Free
                            </Link>
                        </div>
                    </div>
                </div>
            </article>

            {relatedPosts.length > 0 && (
                <section className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
                            Related Articles
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {relatedPosts.map((relatedPost) => (
                                <article 
                                    key={relatedPost.id}
                                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                                >
                                    <div className="h-40 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <TrendingUp className="w-12 h-12 text-white opacity-50" />
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-center text-sm text-gray-500 mb-2">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            <span>{formatDate(relatedPost.date)}</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                            <Link 
                                                to={`/blog/${relatedPost.slug}`}
                                                className="hover:text-blue-600 transition-colors"
                                                dangerouslySetInnerHTML={{ __html: relatedPost.title?.rendered || 'Untitled' }}
                                            />
                                        </h3>
                                        <p className="text-gray-600 text-sm line-clamp-2">
                                            {truncate(relatedPost.excerpt?.rendered)}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </PublicLayout>
    );
}

export default BlogPostPage;
