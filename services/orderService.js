import { apiRequest, API_CONFIG } from '@/utils/apiConfig';

// Order Service
export const orderService = {
  // Get customer orders
  getOrders: async (params = {}) => {
    const { per_page = 10, page = 1, user_id = null } = params;
    
    // Build query string
    const queryParams = new URLSearchParams();
    if (per_page) queryParams.append('per_page', per_page);
    if (page) queryParams.append('page', page);
    if (user_id) queryParams.append('user_id', user_id);
    
    const queryString = queryParams.toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.ORDERS}${queryString ? `?${queryString}` : ''}`;
    
    return await apiRequest(endpoint, {
      method: 'GET',
    });
  },

  // Get single order by UUID
  getOrderByUuid: async (uuid) => {
    return await apiRequest(`${API_CONFIG.ENDPOINTS.ORDERS}/${uuid}`, {
      method: 'GET',
    });
  },

  // Download invoice for an order
  downloadInvoice: async (uuid) => {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS}/${uuid}/invoice`;
    
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    if (!token) {
      throw new Error('Authentication required. Please login.');
    }
    
    const headers = {
      'Accept': 'application/pdf',
      'Authorization': `Bearer ${token}`,
    };

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        // Try to parse error as JSON, fallback to text
        let errorMessage = 'Failed to download invoice';
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If JSON parsing fails, use default message
          }
        } else {
          const text = await response.text().catch(() => '');
          if (text) errorMessage = text;
        }
        
        const error = new Error(errorMessage);
        error.statusCode = response.status;
        throw error;
      }

      // Get the blob data
      const blob = await response.blob();
      
      // Check if blob is actually a PDF (basic check)
      if (blob.type && !blob.type.includes('pdf') && blob.size < 100) {
        // Might be an error response, try to parse as text
        const text = await blob.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Failed to download invoice');
        } catch (e) {
          throw new Error('Invalid invoice file received');
        }
      }
      
      // Create a download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `invoice-${uuid}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  },
};

