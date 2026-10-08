import { apiRequest, API_CONFIG } from '@/utils/apiConfig';

// Contact Service
export const contactService = {
  // Get Contact Information
  getContactInfo: async () => {
    return await apiRequest(API_CONFIG.ENDPOINTS.CONTACT_INFO, {
      method: 'GET',
    });
  },
  
  // Submit Contact Form
  submitContact: async (data) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.CONTACT_SUBMIT, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

