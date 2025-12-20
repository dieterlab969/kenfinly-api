import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { 
    Calendar, 
    User, 
    Tag, 
    Search, 
    ArrowRight,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import PublicLayout from '../../components/public/PublicLayout';
import { PostCardSkeleton, CategoryButtonSkeleton } from '../../components/public/SkeletonLoaders';
import { ErrorState, EmptyState } from '../../components/shared/ErrorState';
import { stripHtml, truncate, formatDate } from '../../utils/textUtils';
import wordpressApi from '../../services/wordpressApi';
import gtmTracking from '../../utils/gtmTracking';

function BlogPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [error, setError] = useState(false);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const currentCategory = searchParams.get('category') || '';
    const currentSearch = searchParams.get('search') || '';
    const [searchInput, setSearchInput] = useState(currentSearch);

    // Fetch posts based on current page, category, and search
    const fetchPosts = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            let result;

            // If searching, use search endpoint
            if (currentSearch) {
                result = await wordpressApi.search(currentSearch);
                if (result.success) {
                    setPosts(result.search_results || []);
                    setPagination({ 
                        total: result.search_results?.length || 0, 
                        totalPages: 1 
                    });
                } else {
                    throw new Error('Search failed');
                }
            } else {
                // Otherwise fetch posts with pagination and category filter
                const params = {
                    per_page: 9,
                    page: currentPage
                };

                if (currentCategory) {
                    params.categories = currentCategory;
                }

                result = await wordpressApi.getPosts(params);
                
                if (result.success) {
                    setPosts(result.posts || []);
                    setPagination({
                        total: result.pagination?.total || 0,
                        totalPages: result.pagination?.total_pages || 1
                    });
                } else {
                    throw new Error('Failed to fetch posts');
                }
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
            setPosts([]);
            setPagination({ total: 0, totalPages: 1 });
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [currentPage, currentCategory, currentSearch]);

    // Fetch categories once on mount
    const fetchCategories = useCallback(async () => {
        setCategoriesLoading(true);
        try {
            const result = await wordpressApi.getCategories();
            if (result.success) {
                setCategories(result.categories || []);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
            setCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    }, []);

    // Fetch posts when page, category, or search changes
    useEffect(() => {
        fetchPosts();
        gtmTracking.trackBlogListView();
    }, [fetchPosts]);

    // Fetch categories only once on mount (empty dependency array)
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Sync search input with URL when URL changes
    useEffect(() => {
        setSearchInput(currentSearch);
    }, [currentSearch]);

    const handleSearch = useCallback((e) => {
        e.preventDefault();
        const trimmedQuery = searchInput.trim();
        
        if (!trimmedQuery) {
            // Clear search if input is empty
            setSearchParams({ page: '1' });
            return;
        }

        // Track search event
        gtmTracking.trackBlogSearch(trimmedQuery);
        
        // Update URL with search query
        setSearchParams({ search: trimmedQuery, page: '1' });
    }, [searchInput, setSearchParams]);

    const handleCategoryClick = useCallback((categoryId, categoryName) => {
        // Track category selection
        gtmTracking.trackBlogCategorySelect(categoryName || categoryId.toString());
        
        // Preserve search if it exists, but reset to page 1
        const params = { category: categoryId.toString(), page: '1' };
        if (currentSearch) {
            params.search = currentSearch;
        }
        setSearchParams(params);
    }, [currentSearch, setSearchParams]);

    const handleClearCategory = useCallback(() => {
        const params = { page: '1' };
        if (currentSearch) {
            params.search = currentSearch;
        }
        setSearchParams(params);
    }, [currentSearch, setSearchParams]);

    const handlePageChange = useCallback((newPage) => {
        const params = { page: newPage.toString() };
        if (currentCategory) {
            params.category = currentCategory;
        }
        if (currentSearch) {
            params.search = currentSearch;
        }
        setSearchParams(params);
        window.scrollTo(0, 0);
    }, [currentCategory, currentSearch, setSearchParams]);

    const handleClearSearch = useCallback(() => {
        setSearchInput('');
        const params = { page: '1' };
        if (currentCategory) {
            params.category = currentCategory;
        }
        setSearchParams(params);
    }, [currentCategory, setSearchParams]);

    // Sanitize post title
    const getSafeTitle = useCallback((title) => {
        if (!title) return 'Untitled';
        const plain = stripHtml(title);
        return DOMPurify.sanitize(plain, { ALLOWED_TAGS: [] });
    }, []);

    // Determine no results message
    const noResultsMessage = useMemo(() => {
        if (currentSearch) {
            return `No results found for "${currentSearch}". Try a different search term.`;
        } else if (currentCategory) {
            return 'No posts found in this category. Try a different category.';
        } else {
            return 'Our blog is being set up. Check back soon for financial tips and insights!';
        }
    }, [currentSearch, currentCategory]);

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
                            <label htmlFor="blog-search" className="sr-only">
                                Search blog articles
                            </label>
                            <input
                                id="blog-search"
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search articles..."
                                aria-label="Search blog articles"
                                className="w-full px-5 py-4 pl-12 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                            <button
                                type="submit"
                                aria-label="Search articles"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            <section className="py-12 bg-gray-50" aria-label="Blog category filters">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap gap-3 justify-center">
                        <button
                            onClick={handleClearCategory}
                            aria-current={!currentCategory ? 'page' : undefined}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                                !currentCategory
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-blue-50'
                            }`}
                        >
                            All Posts
                        </button>
                        {categoriesLoading ? (
                            <CategoryButtonSkeleton count={3} />
                        ) : (
                            categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategoryClick(category.id)}
                                    aria-current={currentCategory === category.id.toString() ? 'page' : undefined}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                                        currentCategory === category.id.toString()
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-blue-50'
                                    }`}
                                >
                                    {category.name} ({category.count || 0})
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </section>

            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {loading ? (
                        <PostCardSkeleton count={6} columns={3} />
                    ) : error ? (
                        <ErrorState
                            title="Content Temporarily Unavailable"
                            message="We're having trouble loading our blog content. This may be a temporary issue with our server. Please try again or check back later."
                            onRetry={fetchPosts}
                            retryLabel="Try Again"
                        />
                    ) : posts.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {posts.map((post) => (
                                    <article 
                                        key={post.id}
                                        className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-blue-600"
                                    >
                                        <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                            <TrendingUp className="w-16 h-16 text-white opacity-50" aria-hidden="true" />
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-1" aria-hidden="true" />
                                                    <time dateTime={post.date}>
                                                        {formatDate(post.date)}
                                                    </time>
                                                </div>
                                            </div>
                                            <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                                                <Link 
                                                    to={`/blog/${post.slug}`}
                                                    className="hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 rounded px-1"
                                                >
                                                    {getSafeTitle(post.title?.rendered || 'Untitled')}
                                                </Link>
                                            </h2>
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

                            {pagination.totalPages > 1 && (
                                <nav 
                                    className="flex justify-center items-center space-x-4 mt-12"
                                    aria-label="Blog post pagination"
                                >
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        aria-label="Go to previous page"
                                        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                                            currentPage === 1
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-blue-600 hover:bg-blue-50'
                                        }`}
                                    >
                                        <ChevronLeft className="w-5 h-5 mr-1" aria-hidden="true" />
                                        Previous
                                    </button>

                                    <div className="flex items-center space-x-2">
                                        {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
                                            const pageNum = i + 1;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    aria-current={currentPage === pageNum ? 'page' : undefined}
                                                    aria-label={`Go to page ${pageNum}`}
                                                    className={`w-10 h-10 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                                                        currentPage === pageNum
                                                            ? 'bg-blue-600 text-white'
                                                            : 'text-gray-600 hover:bg-blue-50'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === pagination.totalPages}
                                        aria-label="Go to next page"
                                        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                                            currentPage === pagination.totalPages
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-blue-600 hover:bg-blue-50'
                                        }`}
                                    >
                                        Next
                                        <ChevronRight className="w-5 h-5 ml-1" aria-hidden="true" />
                                    </button>
                                </nav>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <TrendingUp className="w-20 h-20 text-gray-300 mx-auto mb-6" aria-hidden="true" />
                            <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                                No Posts Found
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {noResultsMessage}
                            </p>
                            {currentSearch && (
                                <button
                                    onClick={handleClearSearch}
                                    aria-label="Clear search and show all posts"
                                    className="text-blue-600 font-medium hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1"
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
                        className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                    >
                        Get Started Free
                        <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
                    </Link>
                </div>
            </section>
        </PublicLayout>
    );
}

export default BlogPage;
