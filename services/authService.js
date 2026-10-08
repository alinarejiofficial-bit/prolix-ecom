import { apiRequest, API_CONFIG } from '@/utils/apiConfig';

// Authentication Service
export const authService = {
  // Enter Email (Check Status & Send OTP)
  // Combined endpoint that checks if user exists. If existing user, returns user info.
  // If new user, automatically sends OTP via email.
  // Returns response wrapped in app_data structure
  enterEmail: async (email) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.ENTER_EMAIL, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Legacy alias for backward compatibility
  checkEmail: async (email) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.ENTER_EMAIL, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Request Email OTP (for both login and signup)
  requestEmailOTP: async (email) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.REQUEST_EMAIL_OTP, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Resend Email OTP
  resendEmailOTP: async (email) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.RESEND_EMAIL_OTP, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Verify Email OTP (handles both login for existing users and returns verification_token for new users)
  verifyEmailOTP: async (email, otp) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.VERIFY_EMAIL_OTP, {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  // Login with Email/Password (Existing Users)
  loginWithPassword: async (email, password) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.LOGIN_WITH_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Legacy login endpoint (maintained for backward compatibility)
  login: async (email, password) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Complete Profile (New Users - after OTP verification)
  completeProfile: async (verificationToken, email, name, password, passwordConfirmation) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.COMPLETE_PROFILE, {
      method: 'POST',
      body: JSON.stringify({
        verification_token: verificationToken,
        email,
        name,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });
  },

  // Google Sign-In
  // Supports two methods:
  // 1. id_token (recommended - more secure): Pass the Google ID token
  // 2. Direct user data (backward compatible): Pass googleId, email, and optionally name
  googleSignIn: async (idToken, googleId, email, name) => {
    const body = {};
    
    // Method 1: Using ID token (recommended)
    if (idToken) {
      body.id_token = idToken;
    } 
    // Method 2: Direct user data (backward compatible)
    else if (googleId && email) {
      body.google_id = googleId;
      body.email = email;
      if (name) {
        body.name = name;
      }
    } else {
      throw new Error('Either id_token or (google_id and email) must be provided');
    }
    
    return await apiRequest(API_CONFIG.ENDPOINTS.GOOGLE_SIGN_IN, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Request Password Reset OTP
  requestPasswordResetOTP: async (email) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.REQUEST_PASSWORD_RESET_OTP, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Set password for OTP/guest/Google accounts without one yet
  setPassword: async (password, passwordConfirmation) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.SET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({
        password,
        password_confirmation: passwordConfirmation,
      }),
    });
  },

  // Reset Password
  resetPassword: async (email, otp, password, passwordConfirmation) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({
        email,
        otp,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });
  },

  // Get Authenticated User Profile
  getProfile: async () => {
    return await apiRequest(API_CONFIG.ENDPOINTS.GET_PROFILE, {
      method: 'GET',
    });
  },

  // Update Profile
  updateProfile: async (name, email, phone) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.UPDATE_PROFILE, {
      method: 'PUT',
      body: JSON.stringify({
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
      }),
    });
  },

  // Logout
  logout: async () => {
    return await apiRequest(API_CONFIG.ENDPOINTS.LOGOUT, {
      method: 'POST',
    });
  },

  // Refresh Token
  refreshToken: async () => {
    return await apiRequest(API_CONFIG.ENDPOINTS.REFRESH_TOKEN, {
      method: 'POST',
    });
  },

  // Helper function to store auth data
  storeAuthData: (data) => {
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
  },

  // Helper function to clear auth data
  clearAuthData: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  // Helper function to get stored user
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Helper function to check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
};
