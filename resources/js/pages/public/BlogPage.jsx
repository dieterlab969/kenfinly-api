import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
    Calendar, 
    User, 
    Tag, 
    Search, 
    ArrowRight,
    TrendingUp,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import PublicLayout from '../../components/public/PublicLayout';
import wordpressApi from '../../services/wordpressApi';

function BlogPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const [searchQuery, setSearchQuery] = useState('');

    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const currentCategory = searchParams.get('category') || '';

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                const params = {
                    per_page: 9,
                    page: currentPage
                };

                if (currentCategory) {
                    params.categories = currentCategory;
                }

                const result = await wordpressApi.getPosts(params);
                
                if (result.success) {
                    setPosts(result.posts || []);
                    setPagination({
                        total: result.pagination?.total || 0,
                        totalPages: result.pagination?.total_pages || 1
                    });
                }
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchCategories = async () => {
            try {
                const result = await wordpressApi.getCategories();
                if (result.success) {
                    setCategories(result.categories || []);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchPosts();
        fetchCategories();
    }, [currentPage, currentCategory]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const result = await wordpressApi.search(searchQuery);
            if (result.success) {
                setPosts(result.search_results || []);
                setPagination({ total: result.search_results?.length || 0, totalPages: 1 });
            }
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (categoryId) => {
        setSearchParams({ category: categoryId.toString(), page: '1' });
    };

    const handlePageChange = (newPage) => {
        const params = { page: newPage.toString() };
        if (currentCategory) {
            params.category = currentCategory;
        }
        setSearchParams(params);
        window.scrollTo(0, 0);
    };

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
            <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Kenfinly Blog
                        </h1>
                        <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                            Financial tips, insights, and strategies to help you achieve your money goals.
                        </p>
                    </div>

                    <form onSubmit={handleSearch} className="max-w-xl mx-auto mt-8">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search articles..."
                                className="w-full px-5 py-4 pl-12 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            <section className="py-12 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap gap-3 justify-center">
                        <button
                            onClick={() => setSearchParams({})}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                !currentCategory
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-blue-50'
                            }`}
                        >
                            All Posts
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryClick(category.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                    currentCategory === category.id.toString()
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-blue-50'
                                }`}
                            >
                                {category.name} ({category.count || 0})
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-gray-50 rounded-xl overflow-hidden animate-pulse">
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
                    ) : posts.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {posts.map((post) => (
                                    <article 
                                        key={post.id}
                                        className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                                    >
                                        <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                            <TrendingUp className="w-16 h-16 text-white opacity-50" />
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    <span>{formatDate(post.date)}</span>
                                                </div>
                                            </div>
                                            <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                                                <Link 
                                                    to={`/blog/${post.slug}`}
                                                    className="hover:text-blue-600 transition-colors"
                                                    dangerouslySetInnerHTML={{ __html: post.title?.rendered || 'Untitled' }}
                                                />
                                            </h2>
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

                            {pagination.totalPages > 1 && (
                                <div className="flex justify-center items-center space-x-4 mt-12">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                                            currentPage === 1
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-blue-600 hover:bg-blue-50'
                                        }`}
                                    >
                                        <ChevronLeft className="w-5 h-5 mr-1" />
                                        Previous
                                    </button>

                                    <div className="flex items-center space-x-2">
                                        {[...Array(pagination.totalPages)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => handlePageChange(i + 1)}
                                                className={`w-10 h-10 rounded-lg font-medium ${
                                                    currentPage === i + 1
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-600 hover:bg-blue-50'
                                                }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === pagination.totalPages}
                                        className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                                            currentPage === pagination.totalPages
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-blue-600 hover:bg-blue-50'
                                        }`}
                                    >
                                        Next
                                        <ChevronRight className="w-5 h-5 ml-1" />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <TrendingUp className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                            <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                                No Posts Found
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {searchQuery 
                                    ? `No results found for "${searchQuery}". Try a different search term.`
                                    : 'Our blog is being set up. Check back soon for financial tips and insights!'}
                            </p>
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSearchParams({});
                                    }}
                                    className="text-blue-600 font-medium hover:text-blue-700"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold mb-4">
                        Ready to Start Your Financial Journey?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Join Kenfinly today and take control of your finances.
                    </p>
                    <Link
                        to="/register"
                        className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all shadow-lg"
                    >
                        Get Started Free
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                </div>
            </section>
        </PublicLayout>
    );
}

export default BlogPage;
