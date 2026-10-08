import { apiRequest, API_CONFIG } from '@/utils/apiConfig';

// Wishlist Service
export const wishlistService = {
  // Get Wishlists with pagination
  getWishlists: async (params = {}) => {
    const {
      page = 1,
      per_page = 10,
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
    });

    return await apiRequest(`${API_CONFIG.ENDPOINTS.WISHLISTS}?${queryParams.toString()}`, {
      method: 'GET',
    });
  },

  // Add item to wishlist
  addToWishlist: async (productId) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.WISHLISTS, {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
      }),
    });
  },

  // Remove item from wishlist by wishlist item UUID
  removeWishlist: async (uuid) => {
    return await apiRequest(`${API_CONFIG.ENDPOINTS.WISHLISTS}/${uuid}`, {
      method: 'DELETE',
    });
  },

  // Remove item from wishlist by product UUID
  removeWishlistByProduct: async (productUuid) => {
    return await apiRequest(`${API_CONFIG.ENDPOINTS.WISHLISTS}/product/${productUuid}`, {
      method: 'DELETE',
    });
  },
};

