"use client";

import { useContextElement } from "@/context/Context";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { addressService } from "@/services/addressService";
// Note: Using getBuyNowSummary from cartService for buy-now checkout only - no cart API calls
import { cartService } from "@/services/cartService";
import { couponService } from "@/services/couponService";
import { showToast } from "@/utlis/showToast";
import AddressModal from "@/components/modals/AddressModal";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { BRAND_NAME } from "@/utils/brand";

export default function Checkout() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeDiscountIndex, setActiveDiscountIndex] = useState(null);
  const { isAuthenticated, openAuthModal } = useContextElement();
  const { branding, checkout, isModuleEnabled } = useStoreConfig();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  
  // Buy-now state
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [buyNowData, setBuyNowData] = useState(null);
  const [loadingBuyNow, setLoadingBuyNow] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("razorpay"); // Razorpay or cod
  
  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (!checkout?.razorpayEnabled && checkout?.codEnabled) {
      setPaymentMethod("cod");
    } else if (checkout?.razorpayEnabled) {
      setPaymentMethod("razorpay");
    }
  }, [checkout?.razorpayEnabled, checkout?.codEnabled]);

  // Fetch addresses
  const fetchAddresses = async () => {
    if (!isAuthenticated) {
      setLoadingAddresses(false);
      return;
    }

    try {
      setLoadingAddresses(true);
      const response = await addressService.getAddresses();
      if (response.success && response.data) {
        const addressList = Array.isArray(response.data) ? response.data : [];
        setAddresses(addressList);
        // Set default address as selected if available
        const defaultAddress = addressList.find(addr => addr.is_default);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress.uuid);
        } else if (addressList.length > 0) {
          setSelectedAddress(addressList[0].uuid);
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      if (error.statusCode === 401) {
        openAuthModal();
      } else {
        showToast(error.message || "Failed to load addresses", "danger");
      }
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Check if buy-now mode from URL params - checkout ONLY works with buy-now
  useEffect(() => {
    const productId = searchParams.get("product_id");
    const variantId = searchParams.get("variant_id");
    
    if (productId && variantId) {
      setIsBuyNow(true);
      setIsRedirecting(false);
    } else {
      // Checkout page only works with buy-now parameters
      // Redirect to shopping cart if accessed without buy-now params
      setIsRedirecting(true);
      if (typeof window !== "undefined") {
        showToast("Please select a product to checkout", "warning");
        router.push("/shopping-cart");
      }
    }
  }, [searchParams, router]);

  // Fetch buy-now summary - checkout ONLY works with buy-now mode
  const fetchBuyNowSummary = async (addressUuid = null, coupon = null, quantity = null, method = null) => {
    if (!isAuthenticated || !isBuyNow) return;
    
    const productId = searchParams.get("product_id");
    const variantId = searchParams.get("variant_id");
    const qty = quantity !== null ? quantity : parseInt(searchParams.get("qty") || "1", 10);
    
    if (!productId || !variantId) return;
    
    try {
      setLoadingBuyNow(true);
      const activePaymentMethod = method !== null ? method : paymentMethod;
      const params = {
        product_id: productId,
        variant_id: variantId,
        qty: qty,
        payment_method: activePaymentMethod,
      };
      
      if (addressUuid) {
        params.customer_address_uuid = addressUuid;
      }
      
      // Handle coupon code parameter:
      // - If coupon is explicitly provided (string), use it
      // - If coupon is null (explicitly passed to remove), don't include coupon_code
      // - If coupon is undefined (not provided), use existing appliedCouponCode if available
      if (coupon !== null && coupon !== undefined) {
        // Explicitly provided coupon code (string)
        if (coupon.trim() !== '') {
          params.coupon_code = coupon.trim();
        }
        // If empty string, don't include coupon_code (removes coupon)
      } else if (coupon === undefined && appliedCouponCode) {
        // No coupon parameter provided, use existing applied coupon
        params.coupon_code = appliedCouponCode;
      }
      // If coupon === null, don't include coupon_code in params (removes coupon)
      
      const response = await cartService.getBuyNowSummary(params);
      if (response.success && response.data) {
        setBuyNowData(response.data);
        if (response.data.coupon_code) {
          setAppliedCouponCode(response.data.coupon_code);
        } else {
          setAppliedCouponCode(null);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error fetching buy-now summary:", error);
      if (error.statusCode === 401) {
        openAuthModal();
      } else if (error.statusCode === 400) {
        // Handle specific errors
        if (error.message?.toLowerCase().includes("coupon")) {
          showToast(error.message || "Invalid coupon code", "danger");
          setAppliedCouponCode(null);
          setCouponCode("");
          setActiveDiscountIndex(null);
        } else {
          showToast(error.message || "Failed to load checkout summary", "danger");
        }
      } else {
        showToast(error.message || "Failed to load checkout summary", "danger");
      }
      return false;
    } finally {
      setLoadingBuyNow(false);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    const addressToUse = selectedAddress || addresses.find(addr => addr.is_default)?.uuid || addresses[0]?.uuid || null;
    const currentQty = parseInt(searchParams.get("qty") || "1", 10);
    fetchBuyNowSummary(addressToUse, appliedCouponCode || couponCode || null, currentQty, method);
  };

  // Fetch coupons
  const fetchCoupons = async () => {
    try {
      const response = await couponService.getAvailableCoupons({ per_page: 20 });
      if (response.success && response.data) {
        const couponList = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setCoupons(couponList);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
    }
  };

  // Fetch addresses and coupons on mount and auth changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
      if (isModuleEnabled("discounts")) {
        fetchCoupons();
      }
    } else {
      setAddresses([]);
      setCoupons([]);
    }
  }, [isAuthenticated]);

  // Load coupons on mount when discounts module is enabled
  useEffect(() => {
    if (isModuleEnabled("discounts")) {
      fetchCoupons();
    } else {
      setCoupons([]);
    }
    try {
      const pending = localStorage.getItem("wobcart_pending_coupon");
      if (pending) {
        setCouponCode(pending);
      }
    } catch (_) {}
  }, [isModuleEnabled]);

  // Fetch buy-now summary when address, coupon, quantity, or paymentMethod changes
  useEffect(() => {
    if (isBuyNow && isAuthenticated && searchParams) {
      const productId = searchParams.get("product_id");
      const variantId = searchParams.get("variant_id");
      const qty = searchParams.get("qty");
      
      if (productId && variantId) {
        // Use selected address, default address, first address, or null if no addresses
        const addressToUse = selectedAddress || addresses.find(addr => addr.is_default)?.uuid || addresses[0]?.uuid || null;
        const currentQty = parseInt(qty || "1", 10);
        fetchBuyNowSummary(addressToUse, appliedCouponCode || couponCode || null, currentQty, paymentMethod);
      }
    }
  }, [isBuyNow, isAuthenticated, selectedAddress, addresses, appliedCouponCode, couponCode, searchParams, paymentMethod]);

  // Handle modal open for add
  const handleAddAddress = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    setEditingAddress(null);
    setShowModal(true);
  };

  // Handle modal open for edit
  const handleEditAddress = (address) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    setEditingAddress(address);
    setShowModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAddress(null);
  };

  // Handle address save success
  const handleAddressSaved = () => {
    fetchAddresses();
    // Refresh summary will be triggered by useEffect when addresses update
  };

  // Handle coupon code apply
  const handleApplyCoupon = async (code = null) => {
    const codeToApply = code || couponCode.trim();
    
    if (!codeToApply) {
      showToast("Please enter a coupon code", "warning");
      return;
    }

    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    setApplyingCoupon(true);
    try {
      // Checkout only works with buy-now mode
      const addressToUse = selectedAddress || addresses.find(addr => addr.is_default)?.uuid || addresses[0]?.uuid;
      const success = await fetchBuyNowSummary(addressToUse, codeToApply);
      if (success) {
        setCouponCode("");
        showToast("Coupon applied successfully", "success");
      }
    } catch (error) {
      // Error is already handled in fetchBuyNowSummary
      setAppliedCouponCode(null);
      setCouponCode("");
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Handle coupon card click
  const handleCouponCardClick = (coupon, index) => {
    setActiveDiscountIndex(index);
    handleApplyCoupon(coupon.code);
  };

  // Handle quantity update for buy-now
  const handleQuantityUpdate = (newQuantity) => {
    if (!isBuyNow || !isAuthenticated || newQuantity < 1) return;
    
    const productId = searchParams.get("product_id");
    const variantId = searchParams.get("variant_id");
    
    if (!productId || !variantId) return;
    
    // Update URL params with new quantity - useEffect will handle the fetch
    const params = new URLSearchParams(searchParams.toString());
    params.set("qty", newQuantity.toString());
    router.replace(`/checkout?${params.toString()}`, { scroll: false });
  };

  // Handle coupon code removal
  const handleRemoveCoupon = async () => {
    if (!isAuthenticated) {
      return;
    }

    setCouponCode("");
    setActiveDiscountIndex(null);
    
    try {
      // Checkout only works with buy-now mode
      const addressToUse = selectedAddress || addresses.find(addr => addr.is_default)?.uuid || addresses[0]?.uuid;
      await fetchBuyNowSummary(addressToUse, null);
      showToast("Coupon removed", "success");
    } catch (error) {
      console.error("Error removing coupon:", error);
      setAppliedCouponCode(null);
      showToast("Failed to remove coupon", "danger");
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    const parts = [];
    if (address.address_line1) parts.push(address.address_line1);
    if (address.address_line2) parts.push(address.address_line2);
    if (address.city) parts.push(address.city);
    if (address.state?.name) parts.push(address.state.name);
    if (address.postal_code) parts.push(address.postal_code);
    if (address.country?.name) parts.push(address.country.name);
    return parts.join(", ");
  };

  // Get address type badge class
  const getAddressTypeClass = (type) => {
    switch (type) {
      case "home":
        return "badge bg-primary";
      case "office":
        return "badge bg-info";
      default:
        return "badge bg-secondary";
    }
  };

  // Capitalize first letter
  const capitalize = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script on unmount
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (!selectedAddress) {
      showToast("Please select a shipping address", "warning");
      return;
    }

    if (!buyNowData || buyNowData.shipping_available === false) {
      showToast("Shipping is not available to this address. Please select a different address.", "warning");
      return;
    }

    const productId = searchParams.get("product_id");
    const variantId = searchParams.get("variant_id");
    const qty = parseInt(searchParams.get("qty") || "1", 10);

    if (!productId || !variantId) {
      showToast("Invalid product information", "danger");
      return;
    }

    try {
      setPlacingOrder(true);
      const params = {
        product_id: productId,
        variant_id: variantId,
        qty: qty,
        customer_address_uuid: selectedAddress,
        payment_method: paymentMethod, // razorpay or cod
      };

      if (appliedCouponCode) {
        params.coupon_code = appliedCouponCode;
      }

      const response = await cartService.placeBuyNowOrder(params);
      
      if (response.success) {
        const advanceRequired =
          paymentMethod === "cod" &&
          Boolean(buyNowData?.cod_advance_enabled) &&
          Number(buyNowData?.cod_advance_payable_now) > 0;

        // Handle Razorpay payment first (full pay + COD advance deposit)
        if (response.gateway_order_id && response.gateway_key && response.transaction_uuid) {
          // Flag to prevent ondismiss from cancelling an already-verified payment
          let paymentHandled = false;

          const options = {
            key: response.gateway_key,
            amount: response.amount, // Amount in paise
            currency: response.currency || "INR",
            name: branding?.companyName || BRAND_NAME,
            description:
              paymentMethod === "cod"
                ? (buyNowData?.is_cod_fee_advance ? "COD fee payment" : "COD advance deposit")
                : "Order Payment",
            order_id: response.gateway_order_id,
            handler: async function (razorpayResponse) {
              paymentHandled = true; // Mark payment as handled before async work
              try {
                // Verify payment with backend
                const verifyResponse = await cartService.verifyRazorpayPayment(
                  razorpayResponse.razorpay_payment_id,
                  razorpayResponse.razorpay_order_id,
                  razorpayResponse.razorpay_signature,
                  response.transaction_uuid
                );

                if (verifyResponse.success) {
                  showToast("Payment successful! Order placed.", "success");
                  setTimeout(() => {
                    router.push("/my-account-orders");
                  }, 1500);
                } else {
                  showToast("Payment verification pending. Our team will verify it shortly.", "warning");
                  setTimeout(() => {
                    router.push("/my-account-orders");
                  }, 3000);
                }
              } catch (error) {
                console.error("Payment verification error:", error);
                // Do not cancel the payment since the customer successfully paid in the modal.
                // The backend webhook will process the order when it receives the capture event.
                showToast(
                  "Payment received! We are verifying it. Please check your account orders page in a few minutes.",
                  "warning"
                );
                setTimeout(() => {
                  router.push("/my-account-orders");
                }, 3000);
              }
            },
            prefill: {
              name: buyNowData.address?.full_name || "",
              email: buyNowData.address?.email || "",
              contact: buyNowData.address?.phone || "",
            },
            theme: {
              color: "#2596be",
            },
            modal: {
              ondismiss: async function () {
                // Guard: if handler() already ran (success or failure), do nothing.
                // Razorpay fires ondismiss after every modal close, including post-payment.
                if (paymentHandled) {
                  setPlacingOrder(false);
                  return;
                }
                // User dismissed the modal without paying — cancel the order.
                try {
                  await cartService.cancelRazorpayPayment(response.transaction_uuid);
                  showToast("Payment cancelled", "warning");
                } catch (error) {
                  console.error("Error cancelling payment:", error);
                }
                setPlacingOrder(false);
              },
            },
          };

          // Open Razorpay checkout
          if (window.Razorpay) {
            const razorpay = new window.Razorpay(options);
            razorpay.open();
            setPlacingOrder(false);
          } else {
            showToast("Payment gateway is loading. Please try again in a moment.", "warning");
            setPlacingOrder(false);
          }
        } else if (paymentMethod === "cod" && !advanceRequired) {
          // Plain COD (no advance deposit required)
          showToast(response.message || "Order placed successfully!", "success");
          setTimeout(() => {
            router.push("/my-account-orders");
          }, 1500);
          setPlacingOrder(false);
        } else {
          showToast(
            response.message ||
              (paymentMethod === "cod"
                ? "Unable to start the COD advance payment. Please try again."
                : "Unable to start payment. Please try again."),
            "danger"
          );
          setPlacingOrder(false);
        }
      }
    } catch (error) {
      console.error("Error placing order:", error);
      if (error.statusCode === 401) {
        openAuthModal();
      } else {
        showToast(error.message || "Failed to place order. Please try again.", "danger");
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  // Helper function to clean up modal backdrop
  const cleanupModalBackdrop = () => {
    // Immediate cleanup attempt
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Also try cleanup after animation delay as backup
    setTimeout(() => {
      const backdropsAfter = document.querySelectorAll('.modal-backdrop');
      backdropsAfter.forEach(backdrop => backdrop.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }, 350); // Wait for Bootstrap's animation (300ms + buffer)
  };

  // Control modal with Bootstrap
  useEffect(() => {
    if (!showModal) {
      // When modal should be closed, ensure backdrop is removed
      cleanupModalBackdrop();
      return;
    }

    const bootstrap = require("bootstrap");
    const modalElement = document.getElementById("addressModal");
    if (!modalElement) return;

    let modal = bootstrap.Modal.getInstance(modalElement);
    if (!modal) {
      modal = new bootstrap.Modal(modalElement, {
        backdrop: true,
        keyboard: true,
        focus: true,
      });
    }
    
    modal.show();

    // Handle modal close events - cleanup when Bootstrap modal is hidden
    const handleHidden = () => {
      setShowModal(false);
      setEditingAddress(null);
      cleanupModalBackdrop();
    };

    modalElement.addEventListener("hidden.bs.modal", handleHidden);

    // Cleanup
    return () => {
      modalElement.removeEventListener("hidden.bs.modal", handleHidden);
    };
  }, [showModal]);

  // Early return if redirecting (checkout only works with buy-now params)
  if (isRedirecting) {
    return (
      <section>
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Redirecting...</span>
            </div>
            <p className="mt-3 text-muted">Redirecting to shopping cart...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="container">
        <div className="row">
          <div className="col-xl-6">
            <div className="flat-spacing tf-page-checkout">
              {/* Shipping Address Section */}
              <div className="wrap mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="title mb-0">Shipping Address</h5>
                  <button
                    className="btn btn-link text-primary p-0"
                    onClick={handleAddAddress}
                    style={{
                      textDecoration: "none",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    + Add new address
                  </button>
                </div>

                {/* Addresses Grid */}
                {loadingAddresses ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                      No addresses found. Add your first address above.
                    </p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {addresses.map((address) => {
                      // Check if this address is selected and has shipping availability info
                      const isSelected = selectedAddress === address.uuid;
                      const isCurrentAddress = buyNowData?.address?.uuid === address.uuid;
                      const shippingNotAvailable = isCurrentAddress && buyNowData?.shipping_available === false;
                      
                      return (
                      <div key={address.uuid || address.id} className="col-12">
                        <div
                          className="card h-100"
                          style={{
                            border: isSelected 
                              ? (shippingNotAvailable ? "2px solid #dc3545" : "2px solid #2596be")
                              : "1px solid #e0e0e0",
                            borderRadius: "8px",
                            backgroundColor: isSelected 
                              ? (shippingNotAvailable ? "#ffe6e6" : "#e6f4f9")
                              : "#fff",
                            transition: "all 0.2s",
                            cursor: "pointer",
                            opacity: shippingNotAvailable && !isSelected ? 0.7 : 1,
                          }}
                          onClick={() => {
                            setSelectedAddress(address.uuid);
                            // Refresh buy-now summary when address changes
                            if (isAuthenticated) {
                              fetchBuyNowSummary(address.uuid, appliedCouponCode || couponCode || null);
                            }
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.boxShadow = "none";
                            }
                          }}
                        >
                          <div className="card-body position-relative" style={{ padding: "16px" }}>
                            {/* Radio Button and Name */}
                            <div className="d-flex align-items-center mb-2">
                              <input
                                type="radio"
                                name="selectedAddress"
                                checked={isSelected}
                                onChange={() => setSelectedAddress(address.uuid)}
                                style={{ marginRight: "8px", cursor: "pointer" }}
                              />
                              <h6 className="mb-0" style={{ fontWeight: "600", fontSize: "15px", flex: 1 }}>
                                {address.full_name}
                              </h6>
                              {shippingNotAvailable && isSelected && (
                                <span 
                                  className="badge bg-danger"
                                  style={{ 
                                    fontSize: "10px",
                                    marginRight: "8px",
                                    padding: "4px 8px"
                                  }}
                                  title={buyNowData?.shipping_unavailable_message}
                                >
                                  <i className="icon-alert-circle" style={{ fontSize: "10px", marginRight: "4px" }}></i>
                                  No Shipping
                                </span>
                              )}
                              <button
                                className="btn btn-link p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAddress(address);
                                }}
                                style={{
                                  textDecoration: "none",
                                  fontSize: "14px",
                                  fontWeight: "500",
                                  color: "#2596be",
                                  border: "none",
                                  background: "none",
                                  cursor: "pointer",
                                }}
                              >
                                Edit
                              </button>
                            </div>

                            {/* Address Type Badge */}
                            <div className="mb-2">
                              <span className={getAddressTypeClass(address.address_type)} style={{ fontSize: "11px" }}>
                                {capitalize(address.address_type || "home")}
                              </span>
                            </div>

                            {/* Address Details */}
                            <div className="text-muted mb-2" style={{ fontSize: "13px", lineHeight: "1.5" }}>
                              <p className="mb-1" style={{ margin: "0" }}>
                                {formatAddress(address)}
                              </p>
                              {address.phone && (
                                <p className="mb-0" style={{ margin: "0", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <i className="icon-phone" style={{ fontSize: "12px" }}></i>
                                  {address.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}

                {/* Shipping Availability Warning */}
                {buyNowData && buyNowData.shipping_available === false && (
                  <div className="mt-4">
                    <div 
                      className="alert alert-warning d-flex align-items-start" 
                      role="alert"
                      style={{
                        backgroundColor: "#d1ecf1",
                        border: "1px solid #2596be",
                        borderRadius: "8px",
                        padding: "16px",
                        marginBottom: "0"
                      }}
                    >
                      <i 
                        className="icon-alert-circle" 
                        style={{ 
                          fontSize: "20px", 
                          color: "#856404", 
                          marginRight: "12px",
                          marginTop: "2px"
                        }}
                      ></i>
                      <div style={{ flex: 1 }}>
                        <h6 className="mb-2" style={{ color: "#856404", fontWeight: "600", fontSize: "14px" }}>
                          Shipping Not Available
                        </h6>
                        <p className="mb-2" style={{ color: "#856404", fontSize: "13px", marginBottom: "8px" }}>
                          {buyNowData.shipping_unavailable_message || "Shipping is not available to this location."}
                        </p>
                        {buyNowData.available_shipping_countries && buyNowData.available_shipping_countries.length > 0 && (
                          <div style={{ marginTop: "8px" }}>
                            <p className="mb-1" style={{ color: "#856404", fontSize: "12px", fontWeight: "500", marginBottom: "4px" }}>
                              We currently ship to:
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {buyNowData.available_shipping_countries.map((country, idx) => (
                                <span 
                                  key={country.id || idx}
                                  className="badge"
                                  style={{
                                    backgroundColor: "#856404",
                                    color: "#fff",
                                    fontSize: "11px",
                                    padding: "4px 8px"
                                  }}
                                >
                                  {country.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-xl-1">
            <div className="line-separation" />
          </div>
          <div className="col-xl-5">
            <div className="flat-spacing flat-sidebar-checkout">
              <div className="sidebar-checkout-content">
                <h5 className="title">Order Summary</h5>
                {loadingBuyNow && isBuyNow ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                <div className="list-product">
                    {/* Checkout ONLY works with buy-now mode - show items from buyNowData */}
                    {buyNowData?.items && buyNowData.items.length > 0 ? (
                      buyNowData.items.map((item, i) => (
                        <div key={i} className="item-product">
                          <Link
                            href={`/product-detail/${item.product_uuid || item.product_id}`}
                            className="img-product"
                          >
                            <Image
                              alt="img-product"
                              src={item.thumbnail || "/images/product/default.jpg"}
                              width={600}
                              height={800}
                            />
                          </Link>
                          <div className="content-box" style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "15px" }}>
                            <div className="info" style={{ flex: 1 }}>
                              <Link
                                href={`/product-detail/${item.product_uuid || item.product_id}`}
                                className="name-product link text-title"
                                style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}
                              >
                                {item.name}
                              </Link>
                              <div className="variant text-caption-1 text-secondary" style={{ marginBottom: "4px" }}>
                                {item.variant_name || "Standard"}
                              </div>
                              <div className="total-price text-button" style={{ marginTop: "2px" }}>
                                <span className="price" style={{ fontSize: "16px", fontWeight: "600", color: "#333" }}>
                                  ₹{parseFloat(item.unit_price || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="d-flex align-items-center" style={{ alignSelf: "flex-start" }}>
                              <div className="wg-quantity" style={{ minWidth: "110px" }}>
                                <span
                                  className="btn-quantity btn-decrease"
                                  onClick={() => handleQuantityUpdate(Math.max(1, item.quantity - 1))}
                                  role="button"
                                  tabIndex={0}
                                  style={{ 
                                    opacity: item.quantity <= 1 ? 0.5 : 1,
                                    cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  -
                                </span>
                                <input
                                  className="quantity-product"
                                  type="number"
                                  name="number"
                                  value={item.quantity}
                                  min={1}
                                  max={item.stock_qty || 999}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value, 10);
                                    if (!isNaN(value) && value > 0) {
                                      const maxQty = item.stock_qty || 999;
                                      handleQuantityUpdate(Math.min(value, maxQty));
                                    }
                                  }}
                                  style={{ width: "60px", textAlign: "center", fontSize: "14px" }}
                                />
                                <span
                                  className="btn-quantity btn-increase"
                                  onClick={() => {
                                    const maxQty = item.stock_qty || 999;
                                    handleQuantityUpdate(Math.min(item.quantity + 1, maxQty));
                                  }}
                                  role="button"
                                  tabIndex={0}
                                  style={{ 
                                    opacity: item.quantity >= (item.stock_qty || 999) ? 0.5 : 1,
                                    cursor: item.quantity >= (item.stock_qty || 999) ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  +
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                          Loading order details...
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {isModuleEnabled("discounts") && (
                <div className="sec-discount">
                  {loadingCoupons ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading coupons...</span>
                      </div>
                      <div className="mt-2" style={{ fontSize: "14px", color: "#666" }}>
                        Loading available coupons...
                      </div>
                    </div>
                  ) : coupons.length > 0 ? (
                  <Swiper
                    dir="ltr"
                    className="swiper tf-sw-categories"
                      slidesPerView={2.25}
                    breakpoints={{
                      1024: {
                          slidesPerView: 2.25,
                      },
                      768: {
                          slidesPerView: 3,
                      },
                      640: {
                          slidesPerView: 2.5,
                      },
                      0: {
                          slidesPerView: 1.2,
                      },
                    }}
                    spaceBetween={20}
                  >
                      {coupons.map((coupon, index) => {
                        // Format discount display
                        const discountText = coupon.type === 'percentage' 
                          ? `${coupon.value}% OFF`
                          : `₹${coupon.value} OFF`;
                        
                        // Format description
                        const minOrderText = coupon.min_order_amount 
                          ? `For all orders from ₹${parseFloat(coupon.min_order_amount || 0).toFixed(2)}`
                          : "For all orders";
                        
                        // Check if this coupon is applied
                        const isApplied = appliedCouponCode === coupon.code;
                        const isActive = activeDiscountIndex === index || isApplied;

                        return (
                          <SwiperSlide key={coupon.uuid || index}>
                            <div
                              className={`box-discount ${isActive ? "active" : ""}`}
                              onClick={() => handleCouponCardClick(coupon, index)}
                              style={{
                                cursor: applyingCoupon ? "not-allowed" : "pointer",
                                opacity: applyingCoupon ? 0.6 : 1
                              }}
                        >
                          <div className="discount-top">
                            <div className="discount-off">
                              <div className="text-caption-1">Discount</div>
                              <span className="sale-off text-btn-uppercase">
                                    {discountText}
                              </span>
                            </div>
                            <div className="discount-from">
                                  <p className="text-caption-1">{coupon.description || minOrderText}</p>
                                  {coupon.expires_at && (
                                    <p className="text-caption-1" style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>
                                      Expires: {new Date(coupon.expires_at).toLocaleDateString()}
                                    </p>
                                  )}
                            </div>
                          </div>
                          <div className="discount-bot">
                            <span className="text-btn-uppercase">
                                  {coupon.code}
                                </span>
                                <button 
                                  className="tf-btn"
                                  disabled={applyingCoupon || isApplied}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCouponCardClick(coupon, index);
                                  }}
                                >
                                  <span className="text">
                                    {applyingCoupon && isActive ? "Applying..." : isApplied ? "Applied" : "Apply Code"}
                            </span>
                            </button>
                          </div>
                            </div>
                      </SwiperSlide>
                        );
                      })}
                  </Swiper>
                  ) : (
                    <div className="text-center py-3" style={{ fontSize: "14px", color: "#666" }}>
                      No coupons available at the moment
                    </div>
                  )}
                  <div className="ip-discount-code">
                    <input 
                      type="text" 
                      placeholder="Add voucher discount" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      disabled={applyingCoupon || !!appliedCouponCode || !isAuthenticated}
                    />
                    {appliedCouponCode ? (
                      <button 
                        className="tf-btn" 
                        onClick={handleRemoveCoupon}
                        style={{ backgroundColor: "#dc3545" }}
                      >
                        <span className="text">Remove</span>
                      </button>
                    ) : (
                      <button 
                        className="tf-btn" 
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon || !isAuthenticated || !couponCode.trim()}
                      >
                        <span className="text">
                          {applyingCoupon ? "Applying..." : "Apply Code"}
                        </span>
                    </button>
                    )}
                  </div>
                  {appliedCouponCode && (
                    <div className="applied-coupon mt-2" style={{
                      padding: "12px",
                      backgroundColor: "#e8f5e9",
                      borderRadius: "4px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <span style={{ fontSize: "14px", fontWeight: "500" }}>
                          Coupon Applied: {appliedCouponCode}
                        </span>
                        {isBuyNow && buyNowData?.discount_breakdown?.coupon && (
                          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                            Discount: ₹{parseFloat(buyNowData.discount_breakdown.coupon || 0).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#d32f2f",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500"
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                )}
                
                {/* Shipping Availability Notice in Order Summary */}
                {buyNowData && buyNowData.shipping_available === false && (
                  <div className="mb-3">
                    <div 
                      className="alert alert-warning d-flex align-items-start" 
                      role="alert"
                      style={{
                        backgroundColor: "#d1ecf1",
                        border: "1px solid #2596be",
                        borderRadius: "6px",
                        padding: "12px",
                        marginBottom: "0",
                        fontSize: "12px"
                      }}
                    >
                      <i 
                        className="icon-alert-circle" 
                        style={{ 
                          fontSize: "16px", 
                          color: "#856404", 
                          marginRight: "8px",
                          marginTop: "2px",
                          flexShrink: 0
                        }}
                      ></i>
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: "#856404", fontSize: "12px", display: "block", marginBottom: "4px" }}>
                          Shipping Not Available
                        </strong>
                        <p className="mb-0" style={{ color: "#856404", fontSize: "11px", lineHeight: "1.4" }}>
                          {buyNowData.shipping_unavailable_message || "Shipping is not available to this location."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="sec-total-price">
                  <div className="top">
                    {buyNowData ? (
                      <>
                        <div className="item d-flex align-items-center justify-content-between text-button">
                          <span>Subtotal</span>
                          <span>₹{parseFloat(buyNowData.subtotal || 0).toFixed(2)}</span>
                        </div>
                        {parseFloat(buyNowData.tax || 0) > 0 && (
                          <div className="item d-flex align-items-center justify-content-between text-button">
                            <span>Tax (GST {buyNowData.items?.[0]?.gst_percent || 0}%)</span>
                            <span>₹{parseFloat(buyNowData.tax || 0).toFixed(2)}</span>
                          </div>
                        )}
                        {parseFloat(buyNowData.discount || 0) > 0 && (
                          <div className="item d-flex align-items-center justify-content-between text-button">
                            <span>Discount</span>
                            <span>-₹{parseFloat(buyNowData.discount || 0).toFixed(2)}</span>
                          </div>
                        )}
                        {parseFloat(buyNowData.delivery_charge || 0) > 0 && (
                          <div className="item d-flex align-items-center justify-content-between text-button">
                            <span>Delivery Charge</span>
                            <span>₹{parseFloat(buyNowData.delivery_charge || 0).toFixed(2)}</span>
                          </div>
                        )}
                        {paymentMethod === "cod" && parseFloat(buyNowData.cod_fee || 0) > 0 && (
                          <div className="item d-flex align-items-center justify-content-between text-button">
                            <span>COD Handling Fee</span>
                            <span>₹{parseFloat(buyNowData.cod_fee || 0).toFixed(2)}</span>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                  <div className="bottom">
                    <h5 className="d-flex justify-content-between">
                      <span>Total</span>
                      <span className="total-price-checkout">
                        {buyNowData 
                          ? `₹${parseFloat(buyNowData.total || 0).toFixed(2)}` 
                          : `₹0.00`
                        }
                      </span>
                    </h5>
                  </div>

                  {/* Payment Method - Razorpay Only */}
                  {buyNowData && (
                    <div className="mt-3">
                      <h6 className="mb-2" style={{ fontSize: "14px", fontWeight: 600 }}>
                        Payment Method
                      </h6>
                      <div className="d-flex flex-column gap-2">
                        {checkout?.razorpayEnabled && (
                        <label
                          className="d-flex align-items-center"
                          style={{
                            gap: "8px",
                            padding: "8px 10px",
                            borderRadius: "4px",
                            border: paymentMethod === "razorpay" ? "2px solid #181818" : "1px solid #e0e0e0",
                            backgroundColor: paymentMethod === "razorpay" ? "#f7f7f7" : "#ffffff",
                            cursor: "pointer",
                          }}
                          onClick={() => handlePaymentMethodChange("razorpay")}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="razorpay"
                            checked={paymentMethod === "razorpay"}
                            onChange={() => handlePaymentMethodChange("razorpay")}
                          />
                          <span style={{ fontSize: "14px" }}>Razorpay Payment (Cards, UPI, Wallets, Net Banking)</span>
                        </label>
                        )}
                        {checkout?.codEnabled && buyNowData.cod_available && (
                          <label
                            className="d-flex align-items-center"
                            style={{
                              gap: "8px",
                              padding: "8px 10px",
                              borderRadius: "4px",
                              border: paymentMethod === "cod" ? "2px solid #181818" : "1px solid #e0e0e0",
                              backgroundColor: paymentMethod === "cod" ? "#f7f7f7" : "#ffffff",
                              cursor: "pointer",
                            }}
                            onClick={() => handlePaymentMethodChange("cod")}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cod"
                              checked={paymentMethod === "cod"}
                              onChange={() => handlePaymentMethodChange("cod")}
                            />
                            <span style={{ fontSize: "14px" }}>
                              Cash on Delivery (COD)
                              {buyNowData?.cod_advance_enabled &&
                                Number(buyNowData?.cod_advance_payable_now) > 0 && (
                                  <span
                                    style={{
                                      marginLeft: "8px",
                                      fontSize: "11px",
                                      padding: "2px 6px",
                                      backgroundColor: "#fff3e0",
                                      color: "#e65100",
                                      borderRadius: "4px",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {buyNowData?.is_cod_fee_advance ? "COD Fee Online" : "Advance Required"}
                                  </span>
                                )}
                            </span>
                          </label>
                        )}
                        {paymentMethod === "cod" &&
                          buyNowData?.cod_advance_enabled &&
                          Number(buyNowData?.cod_advance_payable_now) > 0 && (
                          <div
                            style={{
                              backgroundColor: "#fff8e1",
                              border: "1px solid #ffc107",
                              borderRadius: "6px",
                              padding: "10px 12px",
                              fontSize: "13px",
                              color: "#856404",
                              marginTop: "4px",
                            }}
                          >
                            <strong>
                              {buyNowData?.is_cod_fee_advance ? "COD fee required online:" : "Advance deposit required:"}
                            </strong>{" "}
                            ₹{parseFloat(buyNowData.cod_advance_payable_now).toFixed(2)} to be paid now online.
                            <br />
                            <span style={{ fontSize: "12px" }}>
                              Remaining ₹
                              {parseFloat(buyNowData.cod_balance_due ?? 0).toFixed(2)} to be paid on delivery.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Place Order Button */}
                  <div className="mt-4">
                    <button
                      className="tf-btn btn-fill w-100"
                      onClick={handlePlaceOrder}
                      disabled={
                        placingOrder || 
                        !buyNowData || 
                        !selectedAddress || 
                        buyNowData?.shipping_available === false ||
                        loadingBuyNow
                      }
                      style={{
                        padding: "14px 24px",
                        fontSize: "16px",
                        fontWeight: "600",
                        borderRadius: "4px",
                        opacity: (
                          placingOrder || 
                          !buyNowData || 
                          !selectedAddress || 
                          buyNowData?.shipping_available === false ||
                          loadingBuyNow
                        ) ? 0.6 : 1,
                        cursor: (
                          placingOrder || 
                          !buyNowData || 
                          !selectedAddress || 
                          buyNowData?.shipping_available === false ||
                          loadingBuyNow
                        ) ? "not-allowed" : "pointer"
                      }}
                    >
                      <span className="text">
                        {placingOrder
                          ? "Placing Order..."
                          : paymentMethod === "cod" &&
                              buyNowData?.cod_advance_enabled &&
                              Number(buyNowData?.cod_advance_payable_now) > 0
                            ? `Pay ₹${Number(buyNowData.cod_advance_payable_now).toFixed(2)} ${
                                buyNowData?.is_cod_fee_advance ? "COD Fee" : "Advance"
                              }`
                            : paymentMethod === "cod"
                              ? "Place COD Order"
                              : "PLACE ORDER"}
                      </span>
                    </button>
                    {buyNowData && buyNowData.shipping_available === false && (
                      <p className="text-center mt-2 mb-0" style={{ fontSize: "12px", color: "#dc3545" }}>
                        Shipping not available to this address
                      </p>
                    )}
                    {!selectedAddress && buyNowData && (
                      <p className="text-center mt-2 mb-0" style={{ fontSize: "12px", color: "#856404" }}>
                        Please select a shipping address
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={showModal}
        onClose={handleCloseModal}
        address={editingAddress}
        onSuccess={handleAddressSaved}
      />

    </section>
  );
}
