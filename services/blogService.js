import { apiRequest, API_CONFIG } from '@/utils/apiConfig';

// Blog Service
export const blogService = {
  // Get Blogs with pagination
  getBlogs: async (params = {}) => {
    const {
      page = 1,
      per_page = 10,
      search,
      limit,
    } = params;

    const queryParams = new URLSearchParams();

    // If limit is provided, use it (no pagination)
    if (limit) {
      queryParams.append('limit', limit.toString());
    } else {
      // Otherwise use pagination
      queryParams.append('page', page.toString());
      queryParams.append('per_page', per_page.toString());
    }

    // Add search if provided
    if (search) {
      queryParams.append('search', search);
    }

    return await apiRequest(`${API_CONFIG.ENDPOINTS.BLOGS}?${queryParams.toString()}`, {
      method: 'GET',
    });
  },

  // Get Limited Blogs (no pagination)
  getLimitedBlogs: async (limit = 5) => {
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
    });

    return await apiRequest(`${API_CONFIG.ENDPOINTS.BLOGS}?${queryParams.toString()}`, {
      method: 'GET',
    });
  },

  // Search Blogs
  searchBlogs: async (searchTerm, perPage = 10) => {
    const queryParams = new URLSearchParams({
      search: searchTerm,
      per_page: perPage.toString(),
    });

    return await apiRequest(`${API_CONFIG.ENDPOINTS.BLOGS}?${queryParams.toString()}`, {
      method: 'GET',
    });
  },

  // Get Blog by Slug
  getBlogBySlug: async (slug) => {
    return await apiRequest(`${API_CONFIG.ENDPOINTS.BLOGS}/${slug}`, {
      method: 'GET',
    });
  },
};

