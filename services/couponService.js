import { apiRequest, API_CONFIG } from '@/utils/apiConfig';

// Coupon Service
export const couponService = {
  // Get active coupons
  getCoupons: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.per_page) {
      queryParams.append('per_page', params.per_page);
    }
    
    if (params.code) {
      queryParams.append('code', params.code);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString 
      ? `${API_CONFIG.ENDPOINTS.COUPONS}?${queryString}`
      : API_CONFIG.ENDPOINTS.COUPONS;

    return await apiRequest(endpoint, {
      method: 'GET',
    });
  },
};


