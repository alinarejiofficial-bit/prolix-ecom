import { apiRequest, API_CONFIG } from '@/utils/apiConfig';

// Job Service
export const jobService = {
  // Get Job Categories
  getJobCategories: async () => {
    return await apiRequest(API_CONFIG.ENDPOINTS.JOB_CATEGORIES, {
      method: 'GET',
    });
  },

  // Get Jobs with filters and pagination
  getJobs: async (params = {}) => {
    const {
      per_page,
      limit,
      category_id,
      employment_type,
      search,
    } = params;

    const queryParams = new URLSearchParams();

    if (per_page) {
      queryParams.append('per_page', per_page.toString());
    }
    if (limit) {
      queryParams.append('limit', limit.toString());
    }
    if (category_id) {
      queryParams.append('category_id', category_id.toString());
    }
    if (employment_type) {
      queryParams.append('employment_type', employment_type);
    }
    if (search) {
      queryParams.append('search', search);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString 
      ? `${API_CONFIG.ENDPOINTS.JOBS}?${queryString}`
      : API_CONFIG.ENDPOINTS.JOBS;

    return await apiRequest(endpoint, {
      method: 'GET',
    });
  },

  // Get Single Job by ID
  getJobById: async (id) => {
    return await apiRequest(`${API_CONFIG.ENDPOINTS.JOBS}/${id}`, {
      method: 'GET',
    });
  },

  // Apply for a Job
  applyForJob: async (formData) => {
    // formData should be a FormData object with:
    // - job_id (integer)
    // - name (string)
    // - email (string)
    // - phone (string, optional)
    // - resume (file)
    
    return await apiRequest(API_CONFIG.ENDPOINTS.JOB_APPLY, {
      method: 'POST',
      body: formData,
    });
  },
};

