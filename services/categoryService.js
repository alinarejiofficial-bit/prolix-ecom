import { apiRequest, API_CONFIG } from '@/utils/apiConfig';

let cachedCategories = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60000; // 60 seconds in-memory cache for instant rendering
let inflightPromise = null;

// Category Service
export const categoryService = {
  // Synchronous getter for instant initial render
  getCachedCategories: () => cachedCategories,

  // Get Categories
  getCategories: async (page = 1, perPage = 20, forceRefresh = false) => {
    const isFirstPageDefault = page === 1 && perPage === 20;
    const isCacheFresh = cachedCategories && (Date.now() - cacheTimestamp < CACHE_TTL_MS);

    if (isFirstPageDefault && !forceRefresh && isCacheFresh) {
      return { success: true, data: cachedCategories };
    }

    if (isFirstPageDefault && !forceRefresh && inflightPromise) {
      return inflightPromise;
    }

    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    const requestPromise = (async () => {
      try {
        const res = await apiRequest(`${API_CONFIG.ENDPOINTS.CATEGORIES}?${params.toString()}`, {
          method: 'GET',
        });
        if (isFirstPageDefault && res?.success && Array.isArray(res?.data)) {
          cachedCategories = res.data;
          cacheTimestamp = Date.now();
        }
        return res;
      } finally {
        if (isFirstPageDefault) {
          inflightPromise = null;
        }
      }
    })();

    if (isFirstPageDefault) {
      inflightPromise = requestPromise;
    }

    return requestPromise;
  },

  // Get All Categories with Nested Children
  getAllCategories: async (perPage = 20, search = null) => {
    const params = new URLSearchParams({
      per_page: perPage.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }
    
    return await apiRequest(`${API_CONFIG.ENDPOINTS.CATEGORIES_ALL}?${params.toString()}`, {
      method: 'GET',
    });
  },
};
