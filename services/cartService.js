import { apiRequest, API_CONFIG } from '@/utils/apiConfig';

// Cart Service
export const cartService = {
  // Get cart
  getCart: async () => {
    return await apiRequest(API_CONFIG.ENDPOINTS.CARTS, {
      method: 'GET',
    });
  },

  // Add item to cart
  addToCart: async (productId, variantId, quantity) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.CARTS, {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        variant_id: variantId,
        quantity: quantity,
      }),
    });
  },

  // Update cart item quantity
  updateCartItem: async (cartItemUuid, quantity) => {
    return await apiRequest(`${API_CONFIG.ENDPOINTS.CARTS}/${cartItemUuid}`, {
      method: 'PUT',
      body: JSON.stringify({
        quantity: quantity,
      }),
    });
  },

  // Remove item from cart
  removeCartItem: async (cartItemUuid) => {
    return await apiRequest(`${API_CONFIG.ENDPOINTS.CARTS}/${cartItemUuid}`, {
      method: 'DELETE',
    });
  },

  // Clear cart
  clearCart: async () => {
    return await apiRequest(`${API_CONFIG.ENDPOINTS.CARTS}/clear`, {
      method: 'DELETE',
    });
  },

  // Get cart summary for checkout
  getCartSummary: async (params = {}) => {
    const body = {};
    
    if (params.customer_address_uuid) {
      body.customer_address_uuid = params.customer_address_uuid;
    }
    
    if (params.coupon_code) {
      body.coupon_code = params.coupon_code;
    }
    
    if (params.payment_method) {
      body.payment_method = params.payment_method;
    }
    
    if (params.items && params.items.length > 0) {
      body.items = params.items.map(item => ({
        variant_uuid: item.variant_uuid,
        quantity: item.quantity || 1,
      }));
    }

    return await apiRequest(API_CONFIG.ENDPOINTS.CART_SUMMARY, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Get buy-now summary for checkout
  getBuyNowSummary: async (params = {}) => {
    const body = {};
    
    if (params.product_id) {
      body.product_id = params.product_id;
    }
    
    if (params.variant_id) {
      body.variant_id = params.variant_id;
    }
    
    if (params.qty) {
      body.qty = params.qty;
    }
    
    if (params.customer_address_uuid) {
      body.customer_address_uuid = params.customer_address_uuid;
    }
    
    if (params.coupon_code) {
      body.coupon_code = params.coupon_code;
    }

    if (params.payment_method) {
      body.payment_method = params.payment_method;
    }

    return await apiRequest(API_CONFIG.ENDPOINTS.BUY_NOW_SUMMARY, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Place cart order
  placeCartOrder: async (params = {}) => {
    const body = {};
    
    // Required fields
    if (params.customer_address_uuid) {
      body.customer_address_uuid = params.customer_address_uuid;
    }
    
    // Optional fields
    if (params.payment_method) {
      body.payment_method = params.payment_method;
    }
    
    if (params.coupon_code) {
      body.coupon_code = params.coupon_code;
    }

    return await apiRequest(API_CONFIG.ENDPOINTS.CART_CHECKOUT, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Place buy-now order
  placeBuyNowOrder: async (params = {}) => {
    const body = {};
    
    // Required fields
    if (params.product_id) {
      body.product_id = params.product_id;
    }
    
    if (params.customer_address_uuid) {
      body.customer_address_uuid = params.customer_address_uuid;
    }
    
    // Optional fields
    if (params.variant_id) {
      body.variant_id = params.variant_id;
    }
    
    if (params.qty) {
      body.qty = params.qty;
    }
    
    if (params.payment_method) {
      body.payment_method = params.payment_method;
    }
    
    if (params.coupon_code) {
      body.coupon_code = params.coupon_code;
    }
    
    if (params.courier_partner_id) {
      body.courier_partner_id = params.courier_partner_id;
    }
    
    if (params.courier_name) {
      body.courier_name = params.courier_name;
    }

    return await apiRequest(API_CONFIG.ENDPOINTS.BUY_NOW_CHECKOUT, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Verify Razorpay payment
  verifyRazorpayPayment: async (razorpayPaymentId, razorpayOrderId, razorpaySignature, transactionUuid) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.RAZORPAY_VERIFY, {
      method: 'POST',
      body: JSON.stringify({
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: razorpaySignature,
        transaction_uuid: transactionUuid,
      }),
    });
  },

  // Cancel Razorpay payment
  cancelRazorpayPayment: async (transactionUuid) => {
    return await apiRequest(API_CONFIG.ENDPOINTS.RAZORPAY_CANCEL, {
      method: 'POST',
      body: JSON.stringify({
        transaction_uuid: transactionUuid,
      }),
    });
  },
};

