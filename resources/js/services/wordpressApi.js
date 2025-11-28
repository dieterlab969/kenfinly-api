import axios from 'axios';

const API_BASE = '/api/wordpress';

export const wordpressApi = {
    async getPosts(params = {}) {
        try {
            const response = await axios.get(`${API_BASE}/posts`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching posts:', error);
            return { success: false, error: error.message };
        }
    },

    async getPost(id) {
        try {
            const response = await axios.get(`${API_BASE}/posts/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching post:', error);
            return { success: false, error: error.message };
        }
    },

    async getPostBySlug(slug) {
        try {
            const response = await axios.get(`${API_BASE}/posts/slug/${slug}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching post by slug:', error);
            return { success: false, error: error.message };
        }
    },

    async getPages(params = {}) {
        try {
            const response = await axios.get(`${API_BASE}/pages`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching pages:', error);
            return { success: false, error: error.message };
        }
    },

    async getPageBySlug(slug) {
        try {
            const response = await axios.get(`${API_BASE}/pages/slug/${slug}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching page by slug:', error);
            return { success: false, error: error.message };
        }
    },

    async getCategories(params = {}) {
        try {
            const response = await axios.get(`${API_BASE}/categories`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return { success: false, error: error.message };
        }
    },

    async getFinancialTips(params = {}) {
        try {
            const response = await axios.get(`${API_BASE}/custom/financial_tip`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching financial tips:', error);
            return { success: false, error: error.message };
        }
    },

    async getFaqs(params = {}) {
        try {
            const response = await axios.get(`${API_BASE}/custom/faq`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching FAQs:', error);
            return { success: false, error: error.message };
        }
    },

    async getNews(params = {}) {
        try {
            const response = await axios.get(`${API_BASE}/custom/news`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching news:', error);
            return { success: false, error: error.message };
        }
    },

    async getSiteInfo() {
        try {
            const response = await axios.get(`${API_BASE}/site-info`);
            return response.data;
        } catch (error) {
            console.error('Error fetching site info:', error);
            return { success: false, error: error.message };
        }
    },

    async search(query, params = {}) {
        try {
            const response = await axios.get(`${API_BASE}/search`, { 
                params: { q: query, ...params } 
            });
            return response.data;
        } catch (error) {
            console.error('Error searching content:', error);
            return { success: false, error: error.message };
        }
    },

    async getStatus() {
        try {
            const response = await axios.get(`${API_BASE}/status`);
            return response.data;
        } catch (error) {
            console.error('Error fetching status:', error);
            return { success: false, error: error.message };
        }
    }
};

export default wordpressApi;
