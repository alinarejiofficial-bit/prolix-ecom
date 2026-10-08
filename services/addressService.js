import { apiRequest, API_CONFIG } from '@/utils/apiConfig';

// Address Service
export const addressService = {
  // Get all addresses
  getAddresses: async () => {
    return await apiRequest(API_CONFIG.ENDPOINTS.ADDRESSES, {
      method: 'GET',
    });
  },

  // Create a new address
  createAddress: async (addressData) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.ADDRESSES, {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  },

  // Get all countries
  getCountries: async () => {
    return await apiRequest(API_CONFIG.ENDPOINTS.COUNTRIES, {
      method: 'GET',
    });
  },

  // Get states for a specific country
  getStatesByCountry: async (countryId) => {
    return await apiRequest(`/customer/locations/${countryId}/states`, {
      method: 'GET',
    });
  },

  // Update an existing address
  updateAddress: async (addressUuid, addressData) => {
    return await apiRequest(`${API_CONFIG.ENDPOINTS.ADDRESSES}/${addressUuid}`, {
      method: 'PUT',
      body: JSON.stringify(addressData),
    });
  },

  // Delete an address
  deleteAddress: async (addressUuid) => {
    return await apiRequest(`${API_CONFIG.ENDPOINTS.ADDRESSES}/${addressUuid}`, {
      method: 'DELETE',
    });
  },
};

