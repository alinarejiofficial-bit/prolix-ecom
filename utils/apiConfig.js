// API Configuration
// Local dev: set NEXT_PUBLIC_API_BASE_URL=/api/proxy/v1 in .env.local (proxied via next.config rewrites).
// NEXT_CHECKOUT_BASE_URL is the upstream host used by the Next.js proxy rewrite only.
const DEFAULT_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? '/api/proxy/v1'
    : 'https://api.wobcart.com/api/v1';

const DEFAULT_SITE_ORIGIN = 'http://localhost:3000';

export function resolveApiUrl(url) {
  if (!url) return url;

  if (/^https?:\/\//i.test(url)) {
    return url.replace(/\/$/, '');
  }

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_ORIGIN || DEFAULT_SITE_ORIGIN;

  return `${origin}${url.startsWith('/') ? url : `/${url}`}`.replace(/\/$/, '');
}

export function getApiBaseUrl() {
  return resolveApiUrl(process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL);
}

export const API_CONFIG = {
  get BASE_URL() {
    return getApiBaseUrl();
  },
  
  ENDPOINTS: {
    // Authentication endpoints
    ENTER_EMAIL: '/customer/auth/enter-email',
    REQUEST_EMAIL_OTP: '/customer/auth/request-email-otp',
    RESEND_EMAIL_OTP: '/customer/auth/resend-email-otp',
    VERIFY_EMAIL_OTP: '/customer/auth/verify-email-otp',
    LOGIN: '/customer/auth/login',
    LOGIN_WITH_PASSWORD: '/customer/auth/login-with-password',
    COMPLETE_PROFILE: '/customer/auth/complete-profile',
    GOOGLE_SIGN_IN: '/customer/auth/google-sign-in',
    REQUEST_PASSWORD_RESET_OTP: '/customer/auth/request-password-reset-otp',
    RESET_PASSWORD: '/customer/auth/reset-password',
    SET_PASSWORD: '/customer/auth/set-password',
    GET_PROFILE: '/customer/auth/me',
    UPDATE_PROFILE: '/customer/auth/profile',
    LOGOUT: '/customer/auth/logout',
    REFRESH_TOKEN: '/customer/auth/refresh',
    // Banner endpoints
    BANNER_SLIDERS: '/customer/banner-sliders',
    HOME_PROMO_CARDS: '/customer/home-promo-cards',
    HOME_ANNOUNCEMENTS: '/customer/home-announcements',
    HOME_OFFER_SECTION: '/customer/home-offer-section',
    // Category endpoints
    CATEGORIES: '/customer/categories',
    CATEGORIES_ALL: '/customer/categories/all',
    // Product endpoints
    PRODUCTS: '/customer/products',
    PRODUCT_SEARCH_AUTOCOMPLETE: '/customer/products/search/autocomplete',
    PRODUCT_SEARCH: '/customer/products/search',
    // Wishlist endpoints
    WISHLISTS: '/customer/wishlists',
    // Cart endpoints
    CARTS: '/customer/carts',
    CART_SUMMARY: '/customer/checkout/summary/cart',
    CART_CHECKOUT: '/customer/checkout/cart',
    BUY_NOW_SUMMARY: '/customer/checkout/summary/buy-now',
    BUY_NOW_CHECKOUT: '/customer/checkout/buy-now',
    RAZORPAY_VERIFY: '/customer/checkout/razorpay/verify',
    RAZORPAY_CANCEL: '/customer/checkout/razorpay/cancel',
    // Address endpoints
    ADDRESSES: '/customer/addresses',
    COUNTRIES: '/customer/locations/countries',
    STATES: '/customer/locations/states',
    // Blog endpoints
    BLOGS: '/customer/blogs',
    // Contact endpoints
    CONTACT_INFO: '/customer/contact/info',
    CONTACT_SUBMIT: '/customer/contact/submit',
    // Coupon endpoints
    COUPONS: '/customer/coupons',
    // Order endpoints
    ORDERS: '/customer/orders',
    // Job endpoints
    JOB_CATEGORIES: '/customer/jobs/categories',
    JOBS: '/customer/jobs',
    JOB_APPLY: '/customer/jobs/apply',
    // Store features & configs
    STORE_FEATURES: '/customer/store-features',
    AUTH_CONFIG: '/customer/auth/config',
    WOBCART_CHECKOUT_CONFIG: '/customer/wobcart-checkout/config',
  }
};

// API request helper with automatic retry for transient proxy/network drops
export const apiRequest = async (endpoint, options = {}, retries = 1) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  // Check if body is FormData (for file uploads)
  const isFormData = options.body instanceof FormData;
  
  const defaultOptions = {
    headers: {
      'Accept': 'application/json',
    },
  };

  // Only set Content-Type for non-FormData requests (browser sets it automatically for FormData)
  if (!isFormData) {
    defaultOptions.headers['Content-Type'] = 'application/json';
  }

  // Add authorization header if token exists
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  // Merge headers ensuring Authorization is preserved
  const mergedHeaders = {
    ...defaultOptions.headers,
    ...(options.headers || {}),
  };

  // Always include Authorization header if token exists (even if options.headers tries to override)
  if (token) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }

  // Remove Content-Type from headers if FormData (browser will set it with boundary)
  if (isFormData && mergedHeaders['Content-Type']) {
    delete mergedHeaders['Content-Type'];
  }

  const config = {
    ...defaultOptions,
    ...options,
    headers: mergedHeaders,
  };

  const isGet = !options.method || options.method.toUpperCase() === 'GET';

  try {
    const response = await fetch(url, config);

    // If proxy failed with 502/504 ECONNRESET, retry once with a fresh socket
    if (!response.ok && response.status >= 500 && retries > 0 && isGet) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      return apiRequest(endpoint, options, retries - 1);
    }

    if (!response.ok) {
      let errorMessage = `API request failed (${response.status})`;
      let errorData = null;
      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        try {
          const text = await response.text();
          if (text && !text.includes('<html')) {
            errorMessage = text.slice(0, 120);
          }
        } catch {
          // Ignore text read error
        }
      }

      const error = new Error(errorMessage);
      error.statusCode = errorData?.status_code || response.status;
      error.errors = errorData?.errors || {};
      error.response = errorData;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // If it's already our custom validation error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // If transient network or proxy socket drop, retry once
    if (retries > 0 && isGet) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      return apiRequest(endpoint, options, retries - 1);
    }

    // Otherwise, it's a persistent network or parsing error
    console.error('API request error:', error);
    throw new Error(error.message || 'Network error. Please check your connection.');
  }
};
