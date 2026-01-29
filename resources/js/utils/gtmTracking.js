/**
 * GTM (Google Tag Manager) Event Tracking Utility
 * Handles all GA4 event tracking across the site
 * 
 * Safety Features:
 * - All tracking functions check if window.gtag exists before calling
 * - Works safely when GA4 is disabled (no errors, no events sent)
 * - Environment-aware: respects GA4_ENABLED feature toggle
 * - Gracefully degrades when GA4 is not available
 */

const gtmTracking = {
    /**
     * Check if GA4 tracking is available
     * @returns {boolean} True if gtag is available and ready
     */
    isAvailable: () => {
        return typeof window !== 'undefined' && typeof window.gtag === 'function';
    },
    /**
     * Track page view event
     * @param {string} pageName - Name of the page (e.g., 'home', 'blog_list', 'blog_detail')
     * @param {string} pageTitle - Title of the page
     */
    trackPageView: (pageName, pageTitle) => {
        if (window.gtag) {
            window.gtag('event', 'page_view', {
                page_path: window.location.pathname,
                page_title: pageTitle,
                page_name: pageName
            });
        }
    },

    /**
     * Track header navigation clicks
     * @param {string} navItem - Navigation item clicked (home, blog, about_us, sign_in, get_started, features)
     */
    trackHeaderNavClick: (navItem) => {
        if (window.gtag) {
            window.gtag('event', 'click_header_nav', {
                nav_item: navItem,
                page_location: window.location.pathname
            });
        }
    },

    /**
     * Track homepage CTA clicks
     * @param {string} ctaName - CTA name (get_started, read_blog)
     */
    trackHomeCTAClick: (ctaName) => {
        if (window.gtag) {
            window.gtag('event', 'click_home_cta', {
                cta_name: ctaName,
                page_location: window.location.pathname
            });
        }
    },

    /**
     * Track footer social media link clicks
     * @param {string} platform - Social platform (twitter, facebook, linkedin)
     */
    trackSocialLinkClick: (platform) => {
        if (window.gtag) {
            window.gtag('event', 'click_social_link', {
                platform: platform,
                location: 'footer',
                page_location: window.location.pathname
            });
        }
    },

    /**
     * Track footer navigation clicks
     * @param {string} navItem - Navigation item clicked
     */
    trackFooterNavClick: (navItem) => {
        if (window.gtag) {
            window.gtag('event', 'click_footer_nav', {
                nav_item: navItem,
                page_location: window.location.pathname
            });
        }
    },

    /**
     * Track blog category filter selection
     * @param {string} categoryName - Name of selected category
     */
    trackBlogCategorySelect: (categoryName) => {
        if (window.gtag) {
            window.gtag('event', 'select_blog_category', {
                category_name: categoryName,
                page_location: window.location.pathname
            });
        }
    },

    /**
     * Track blog post click from list
     * @param {string} postTitle - Title of the blog post
     * @param {string|number} postId - ID of the blog post
     */
    trackBlogPostClick: (postTitle, postId) => {
        if (window.gtag) {
            window.gtag('event', 'click_blog_post', {
                post_title: postTitle,
                post_id: postId?.toString() || '',
                page_location: window.location.pathname
            });
        }
    },

    /**
     * Track blog search submission
     * @param {string} searchTerm - Search term entered
     */
    trackBlogSearch: (searchTerm) => {
        if (window.gtag) {
            window.gtag('event', 'blog_search', {
                search_term: searchTerm,
                page_location: window.location.pathname
            });
        }
    },

    /**
     * Track blog article view
     * @param {string} postTitle - Title of the article
     * @param {string|number} postId - ID of the article
     */
    trackBlogArticleView: (postTitle, postId) => {
        if (window.gtag) {
            window.gtag('event', 'view_blog_article', {
                post_title: postTitle,
                post_id: postId?.toString() || '',
                page_location: window.location.pathname
            });
        }
    },

    /**
     * Track blog article share click
     * @param {string} platform - Sharing platform (twitter, facebook, linkedin, copy_link)
     * @param {string} postTitle - Title of the article being shared
     */
    trackShareArticle: (platform, postTitle) => {
        if (window.gtag) {
            window.gtag('event', 'click_share_article', {
                platform: platform,
                post_title: postTitle,
                page_location: window.location.pathname
            });
        }
    },

    /**
     * Track blog listing page view
     */
    trackBlogListView: () => {
        gtmTracking.trackPageView('blog_list', 'Blog');
    },

    /**
     * Track blog detail page view
     */
    trackBlogDetailView: () => {
        gtmTracking.trackPageView('blog_detail', 'Blog Post');
    },

    /**
     * Track feature page view
     */
    trackFeaturePageView: () => {
        gtmTracking.trackPageView('feature_page', 'Features');
    },

    /**
     * Track About page view
     */
    trackAboutPageView: () => {
        gtmTracking.trackPageView('about_page', 'About Us');
    },

    /**
     * Track Saving Habit Tracker page view
     */
    trackSavingHabitTrackerView: () => {
        gtmTracking.trackPageView('saving_habit_tracker', 'Saving Habit Tracker');
    },

    /**
     * Track Pomodoro page view
     */
    trackPomodoroPageView: () => {
        gtmTracking.trackPageView('pomodoro_page', 'Pomodoro Timer');
    },

    /**
     * Track Pomodoro timer actions (start, pause, reset)
     * @param {string} action - Action performed
     * @param {string} mode - Timer mode (focus, break, long_break)
     */
    trackPomodoroAction: (action, mode) => {
        if (window.gtag) {
            window.gtag('event', 'pomodoro_action', {
                action: action,
                mode: mode,
                page_location: window.location.pathname
            });
        }
    },

    /**
     * Track Pomodoro session completion
     * @param {string} mode - Completed session mode
     * @param {number} count - Total sessions completed
     */
    trackPomodoroComplete: (mode, count) => {
        if (window.gtag) {
            window.gtag('event', 'pomodoro_complete', {
                mode: mode,
                total_sessions: count,
                page_location: window.location.pathname
            });
        }
    }
};

export default gtmTracking;
