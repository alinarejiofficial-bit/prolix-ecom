import { apiRequest, API_CONFIG } from '@/utils/apiConfig';

// Map app sort_by/sort_order to API sort_by: price_low_high | price_high_low | rating_high_low | omit for latest
function normalizeSortByForApi(sort_by, sort_order) {
  const apiValues = ['price_low_high', 'price_high_low', 'rating_high_low'];
  if (apiValues.includes(sort_by)) return sort_by;
  if (sort_by === 'price' && sort_order === 'asc') return 'price_low_high';
  if (sort_by === 'price' && sort_order === 'desc') return 'price_high_low';
  if (sort_by === 'rating') return 'rating_high_low';
  // latest / created_at / default: omit
  return null;
}

// Product Service
export const productService = {
  // Get Products with filters and pagination
  // API: GET /api/v1/customer/products (public, no auth)
  // Params: per_page, category, min_price, max_price, rating, sort_by (price_low_high|price_high_low|rating_high_low|omit for latest), search
  getProducts: async (params = {}) => {
    const {
      page = 1,
      per_page = 10,
      search,
      category_id,
      category,
      featured,
      sort_by,
      sort_order,
      min_price = 0,
      max_price = 1000000,
      rating,
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.set('per_page', per_page.toString());
    if (page > 1) queryParams.set('page', page.toString());

    // Category: API expects "category" (ID); support both category_id and category from app
    const categoryId = category ?? category_id;
    if (categoryId) queryParams.set('category', categoryId.toString());

    if (min_price != null && min_price > 0) queryParams.set('min_price', min_price.toString());
    if (max_price != null && max_price < 1000000) queryParams.set('max_price', max_price.toString());
    if (rating != null && rating !== '') queryParams.set('rating', rating.toString());
    if (search) queryParams.set('search', search);
    if (featured !== undefined) queryParams.set('featured', featured.toString());

    // sort_by: price_low_high | price_high_low | rating_high_low | omit for latest
    const apiSortBy = normalizeSortByForApi(sort_by, sort_order);
    if (apiSortBy) queryParams.set('sort_by', apiSortBy);

    return await apiRequest(`${API_CONFIG.ENDPOINTS.PRODUCTS}?${queryParams.toString()}`, {
      method: 'GET',
    });
  },

  // Get Recent Products
  getRecentProducts: async (limit = 20) => {
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
    });

    return await apiRequest(`${API_CONFIG.ENDPOINTS.PRODUCTS}/recent?${queryParams.toString()}`, {
      method: 'GET',
    });
  },

  // Get Single Product by UUID
  getProductByUuid: async (uuid) => {
    return await apiRequest(`${API_CONFIG.ENDPOINTS.PRODUCTS}/${uuid}`, {
      method: 'GET',
    });
  },

  // Get Best Selling Products
  getBestSellingProducts: async (perPage = 10) => {
    const queryParams = new URLSearchParams({
      per_page: perPage.toString(),
    });

    return await apiRequest(`${API_CONFIG.ENDPOINTS.PRODUCTS}/best-selling?${queryParams.toString()}`, {
      method: 'GET',
    });
  },

  // Get Similar Products
  getSimilarProducts: async (uuid) => {
    return await apiRequest(`${API_CONFIG.ENDPOINTS.PRODUCTS}/${uuid}/similar`, {
      method: 'GET',
    });
  },

  // Search Autocomplete - Get product name suggestions and limited product results
  searchAutocomplete: async (params = {}) => {
    const { q, search, limit = 10 } = params;
    
    const queryParams = new URLSearchParams();
    if (q) queryParams.append('q', q);
    if (search && !q) queryParams.append('search', search);
    if (limit) queryParams.append('limit', limit.toString());

    return await apiRequest(`${API_CONFIG.ENDPOINTS.PRODUCT_SEARCH_AUTOCOMPLETE}?${queryParams.toString()}`, {
      method: 'GET',
    });
  },

  // Search Products - Full search with results and suggestions
  searchProducts: async (params = {}) => {
    const { q, search, per_page = 20, include_suggestions = true } = params;
    
    const queryParams = new URLSearchParams();
    if (q) queryParams.append('q', q);
    if (search && !q) queryParams.append('search', search);
    if (per_page) queryParams.append('per_page', per_page.toString());
    if (include_suggestions !== undefined) queryParams.append('include_suggestions', include_suggestions.toString());

    return await apiRequest(`${API_CONFIG.ENDPOINTS.PRODUCT_SEARCH}?${queryParams.toString()}`, {
      method: 'GET',
    });
  },
};

