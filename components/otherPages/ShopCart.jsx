"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CountdownTimer from "../common/Countdown";
import { useContextElement } from "@/context/Context";
import { addressService } from "@/services/addressService";
import { cartService } from "@/services/cartService";
import { couponService } from "@/services/couponService";
import { showToast } from "@/utlis/showToast";
import AddressModal from "@/components/modals/AddressModal";
import {
  mapCartProductsToWobcartItems,
  openWobcartCheckout,
} from "@/utils/wobcartCheckout";
import { useStoreConfig } from "@/context/StoreConfigContext";

export default function ShopCart() {
  const router = useRouter();
  const { isModuleEnabled, checkout } = useStoreConfig();
  const [activeDiscountIndex, setActiveDiscountIndex] = useState(null);
  const {
    cartProducts,
    setCartProducts,
    totalPrice,
    updateQuantity,
    removeItem,
    isAuthenticated,
    openAuthModal,
  } = useContextElement();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  // Cart summary state
  const [cartSummary, setCartSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [placingOrder, setPlacingOrder] = useState(false);

  // Format currency helper
  const formatCurrency = (amount, currency = "INR") => {
    const currencySymbols = {
      INR: "₹",
      GBP: "£",
      USD: "$",
      EUR: "€",
    };
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  };

  // Fetch addresses
  const fetchAddresses = async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setLoadingAddresses(true);
      const response = await addressService.getAddresses();
      if (response.success && response.data) {
        const addressList = Array.isArray(response.data) ? response.data : [];
        setAddresses(addressList);

        // Set default address or first address as selected
        const defaultAddress =
          addressList.find((addr) => addr.is_default) || addressList[0];
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      if (error.statusCode === 401) {
        openAuthModal();
      }
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Fetch coupons
  const fetchCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const response = await couponService.getCoupons({ per_page: 10 });
      if (response.success && response.data) {
        setCoupons(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      // Don't show error toast for coupons as it's not critical
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Load addresses on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  // Load coupons on mount (public endpoint, no auth required)
  useEffect(() => {
    fetchCoupons();
    try {
      const pending = localStorage.getItem("wobcart_pending_coupon");
      if (pending) {
        setCouponCode(pending);
      }
    } catch (_) {}
  }, []);

  // Sync default payment method with store checkout config
  useEffect(() => {
    if (checkout) {
      if (checkout.razorpayEnabled === false && checkout.codEnabled) {
        setPaymentMethod("cod");
      } else if (checkout.defaultMethod) {
        setPaymentMethod(checkout.defaultMethod);
      }
    }
  }, [checkout]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script on unmount
      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  // Fetch cart summary when cart, address, authentication, or paymentMethod changes
  useEffect(() => {
    if (isAuthenticated && cartProducts.length > 0) {
      fetchCartSummary(
        selectedAddress?.uuid || null,
        appliedCouponCode || null,
        paymentMethod,
      );
    } else {
      setCartSummary(null);
    }
  }, [cartProducts, isAuthenticated, selectedAddress, paymentMethod]);

  // Fetch cart summary
  const fetchCartSummary = async (addressUuid = null, coupon = null, method = null) => {
    if (!isAuthenticated || cartProducts.length === 0) {
      setCartSummary(null);
      return;
    }

    try {
      setLoadingSummary(true);
      const activePaymentMethod = method !== null ? method : paymentMethod;
      const params = {
        payment_method: activePaymentMethod,
      };

      if (addressUuid || selectedAddress?.uuid) {
        params.customer_address_uuid = addressUuid || selectedAddress?.uuid;
      }

      // Handle coupon code parameter:
      // - If coupon is explicitly provided (string), use it
      // - If coupon is null (explicitly passed to remove), don't include coupon_code
      // - If coupon is undefined (not provided), use existing appliedCouponCode if available
      if (coupon !== null && coupon !== undefined) {
        // Explicitly provided coupon code (string)
        if (coupon.trim() !== "") {
          params.coupon_code = coupon.trim();
        }
        // If empty string, don't include coupon_code (removes coupon)
      } else if (coupon === undefined && appliedCouponCode) {
        // No coupon parameter provided, use existing applied coupon
        params.coupon_code = appliedCouponCode;
      }
      // If coupon === null, don't include coupon_code in params (removes coupon)

      // Map cart products to API format
      // Only include items if we have variant_uuid, otherwise let API fetch from database cart
      const items = cartProducts
        .filter((item) => item.variant_uuid || item.variant_id)
        .map((item) => ({
          variant_uuid: item.variant_uuid || item.variant_id,
          quantity: item.quantity || 1,
        }));

      // Only include items if we have valid variant_uuid for all items
      // Otherwise, let the API fetch from the database cart
      if (items.length > 0 && items.length === cartProducts.length) {
        params.items = items;
      }
      // If items.length < cartProducts.length, it means some items don't have variant_uuid
      // In that case, don't pass items and let API fetch from database

      const response = await cartService.getCartSummary(params);
      if (response.success && response.data) {
        setCartSummary(response.data);
        // Update appliedCouponCode based on response
        if (response.data.coupon_code) {
          setAppliedCouponCode(response.data.coupon_code);
        } else {
          // If response doesn't have coupon_code, clear it (coupon was removed)
          setAppliedCouponCode(null);
        }
        // Reset payment method if COD is not available and currently selected
        if (!response.data.cod_available && paymentMethod === "cod") {
          setPaymentMethod("razorpay");
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error fetching cart summary:", error);
      if (error.statusCode === 401) {
        openAuthModal();
      } else if (error.statusCode === 400) {
        // Handle specific errors
        if (error.message?.toLowerCase().includes("coupon")) {
          showToast(error.message || "Invalid coupon code", "danger");
          setAppliedCouponCode(null);
          setCouponCode("");
          setActiveDiscountIndex(null);
        } else if (error.message?.toLowerCase().includes("cart is empty")) {
          setCartSummary(null);
        } else {
          showToast(error.message || "Failed to fetch cart summary", "danger");
        }
      } else {
        showToast(error.message || "Failed to fetch cart summary", "danger");
      }
      return false;
    } finally {
      setLoadingSummary(false);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (isAuthenticated && cartProducts.length > 0) {
      fetchCartSummary(selectedAddress?.uuid || null, appliedCouponCode || null, method);
    }
  };

  // Handle address selection
  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setShowAddressDropdown(false);
    // Refresh cart summary with new address
    if (isAuthenticated && cartProducts.length > 0) {
      fetchCartSummary(address.uuid, appliedCouponCode || null);
    }
  };

  // Handle change address button
  const handleChangeAddress = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    if (addresses.length === 0) {
      setShowAddressModal(true);
    } else {
      setShowAddressDropdown(!showAddressDropdown);
    }
  };

  // Handle add new address
  const handleAddNewAddress = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    setShowAddressModal(true);
    setShowAddressDropdown(false);
  };

  // Handle address saved
  const handleAddressSaved = () => {
    fetchAddresses();
    // Refresh cart summary after address is saved
    if (isAuthenticated && cartProducts.length > 0) {
      setTimeout(() => {
        fetchCartSummary(null, appliedCouponCode || null);
      }, 500);
    }
  };

  // Handle coupon code application
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
      const success = await fetchCartSummary(selectedAddress?.uuid || null, codeToApply);
      if (success) {
        setCouponCode("");
        showToast("Coupon applied successfully", "success");
      }
    } catch (error) {
      // Error is already handled in fetchCartSummary
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Handle coupon card click
  const handleCouponCardClick = (coupon, index) => {
    setActiveDiscountIndex(index);
    handleApplyCoupon(coupon.code);
  };

  // Handle coupon code removal
  const handleRemoveCoupon = async () => {
    if (!isAuthenticated || cartProducts.length === 0) {
      return;
    }

    setCouponCode("");
    setActiveDiscountIndex(null);

    try {
      // Explicitly pass null to remove coupon from cart summary
      await fetchCartSummary(selectedAddress?.uuid || null, null);
      // appliedCouponCode will be cleared by fetchCartSummary based on response
      showToast("Coupon removed", "success");
    } catch (error) {
      console.error("Error removing coupon:", error);
      // Even if there's an error, clear the local state
      setAppliedCouponCode(null);
      showToast("Failed to remove coupon", "danger");
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return "";
    const parts = [];
    if (address.address_line1) parts.push(address.address_line1);
    if (address.address_line2) parts.push(address.address_line2);
    if (address.city) parts.push(address.city);
    if (address.state?.name) parts.push(address.state.name);
    if (address.postal_code) parts.push(address.postal_code);
    if (address.country?.name) parts.push(address.country.name);
    return parts.join(", ");
  };

  // Handle place order via Wobcart Checkout
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    const items = mapCartProductsToWobcartItems(cartProducts);
    if (!items.length) {
      showToast("Please add products to your cart before checkout", "warning");
      return;
    }

    try {
      setPlacingOrder(true);
      await openWobcartCheckout(items);
    } catch (error) {
      showToast(error.message || "Unable to open checkout", "danger");
    } finally {
      setPlacingOrder(false);
    }
  };

  // Control modal with Bootstrap
  useEffect(() => {
    if (!showAddressModal) return;

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

    // Handle modal close events
    const handleHidden = () => {
      setShowAddressModal(false);
    };

    modalElement.addEventListener("hidden.bs.modal", handleHidden);

    // Cleanup
    return () => {
      modalElement.removeEventListener("hidden.bs.modal", handleHidden);
    };
  }, [showAddressModal]);

  return (
    <>
      <section className="flat-spacing">
        <div className="container">
          <div className="row">
            <div className="col-xl-8">
              <div className="tf-cart-sold">
                <div className="notification-sold bg-surface">
                  <Image
                    className="icon"
                    alt="img"
                    src="/images/logo/icon-fire.png"
                    width={48}
                    height={49}
                  />
                  <div className="count-text">
                    Your cart will expire in
                    <div
                      className="js-countdown time-count"
                      data-timer={600}
                      data-labels=":,:,:,"
                    >
                      <CountdownTimer
                        style={4}
                        targetDate={new Date(new Date().getTime() - 30 * 60000)}
                      />
                    </div>
                    minutes! Please checkout now before your items sell out!
                  </div>
                </div>
              </div>

              {/* Address Selection Section - Flipkart Style */}
              {cartProducts.length > 0 && (
                <div
                  className="delivery-address-section bg-surface mb-4"
                  style={{
                    padding: "20px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    position: "relative",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      {loadingAddresses ? (
                        <div className="d-flex align-items-center">
                          <div
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <span>Loading addresses...</span>
                        </div>
                      ) : selectedAddress ? (
                        <>
                          <div className="mb-2">
                            <span
                              className="text-muted"
                              style={{ fontSize: "14px" }}
                            >
                              Deliver to:{" "}
                            </span>
                            <span
                              className="fw-semibold"
                              style={{ fontSize: "16px" }}
                            >
                              {selectedAddress.full_name}
                            </span>
                          </div>
                          <div
                            className="mb-1"
                            style={{ fontSize: "14px", color: "#666" }}
                          >
                            <span className="fw-semibold">Pincode: </span>
                            <span>{selectedAddress.postal_code || "N/A"}</span>
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              color: "#666",
                              lineHeight: "1.5",
                            }}
                          >
                            {formatAddress(selectedAddress)}
                          </div>
                        </>
                      ) : addresses.length === 0 ? (
                        <div>
                          <p
                            className="mb-2"
                            style={{ fontSize: "14px", color: "#666" }}
                          >
                            No delivery address found. Please add an address to
                            continue.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p
                            className="mb-2"
                            style={{ fontSize: "14px", color: "#666" }}
                          >
                            Please select a delivery address.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="ms-3">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={handleChangeAddress}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {addresses.length === 0 ? "Add Address" : "Change"}
                      </button>
                    </div>
                  </div>

                  {/* Address Dropdown */}
                  {showAddressDropdown && addresses.length > 0 && (
                    <div
                      className="address-dropdown mt-3"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "0",
                        right: "0",
                        backgroundColor: "white",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        zIndex: 1000,
                        maxHeight: "400px",
                        overflowY: "auto",
                        marginTop: "8px",
                      }}
                    >
                      {addresses.map((address) => (
                        <div
                          key={address.uuid || address.id}
                          onClick={() => handleSelectAddress(address)}
                          style={{
                            padding: "16px",
                            borderBottom: "1px solid #f0f0f0",
                            cursor: "pointer",
                            backgroundColor:
                              selectedAddress?.uuid === address.uuid
                                ? "#f5f5f5"
                                : "white",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedAddress?.uuid !== address.uuid) {
                              e.currentTarget.style.backgroundColor = "#fafafa";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedAddress?.uuid !== address.uuid) {
                              e.currentTarget.style.backgroundColor = "white";
                            }
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="mb-1">
                                <span
                                  className="fw-semibold"
                                  style={{ fontSize: "15px" }}
                                >
                                  {address.full_name}
                                </span>
                                {address.is_default && (
                                  <span
                                    className="badge bg-success ms-2"
                                    style={{ fontSize: "11px" }}
                                  >
                                    Default
                                  </span>
                                )}
                                <span
                                  className={`badge ms-2 ${address.address_type === "home" ? "bg-primary" : address.address_type === "office" ? "bg-info" : "bg-secondary"}`}
                                  style={{ fontSize: "11px" }}
                                >
                                  {address.address_type === "home"
                                    ? "Home"
                                    : address.address_type === "office"
                                      ? "Office"
                                      : "Other"}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginBottom: "4px",
                                }}
                              >
                                {formatAddress(address)}
                              </div>
                              {address.phone && (
                                <div
                                  style={{ fontSize: "13px", color: "#666" }}
                                >
                                  Phone: {address.phone}
                                </div>
                              )}
                            </div>
                            {selectedAddress?.uuid === address.uuid && (
                              <div className="ms-2">
                                <i
                                  className="icon-check"
                                  style={{ color: "#2874f0", fontSize: "18px" }}
                                ></i>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div
                        onClick={handleAddNewAddress}
                        style={{
                          padding: "16px",
                          cursor: "pointer",
                          borderTop: "2px solid #e0e0e0",
                          backgroundColor: "#fafafa",
                          textAlign: "center",
                          fontWeight: "500",
                          color: "#2874f0",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f0f0f0";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#fafafa";
                        }}
                      >
                        <i className="icon-plus me-2"></i>
                        Add New Address
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Click outside to close dropdown */}
              {showAddressDropdown && (
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999,
                  }}
                  onClick={() => setShowAddressDropdown(false)}
                />
              )}

              {cartSummary?.items?.length > 0 || cartProducts.length > 0 ? (
                <form onSubmit={(e) => e.preventDefault()}>
                  <table className="tf-table-page-cart">
                    <thead>
                      <tr>
                        <th>Products</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total Price</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {(cartSummary?.items || cartProducts).map((elm, i) => {
                        // Use cartSummary items if available, otherwise fallback to cartProducts
                        const item = cartSummary?.items
                          ? {
                              id: elm.product_uuid,
                              product_id: elm.product_id,
                              product_uuid: elm.product_uuid,
                              name: elm.name,
                              title: elm.name,
                              variant_id: elm.variant_id,
                              variant_uuid: elm.variant_uuid,
                              variant_name: elm.variant_name,
                              price: parseFloat(
                                elm.selling_price || elm.unit_price,
                              ),
                              mrp: parseFloat(elm.mrp),
                              quantity: elm.quantity,
                              imgSrc: elm.thumbnail,
                              offer_percentage: elm.offer_percentage,
                              savings: elm.savings,
                              subtotal: elm.subtotal,
                              total: elm.total,
                            }
                          : elm;

                        return (
                          <tr key={i} className="tf-cart-item file-delete">
                            <td className="tf-cart-item_product">
                              <Link
                                href={`/product-detail/${item.product_uuid || item.product_id || item.id}`}
                                className="img-box"
                              >
                                <Image
                                  alt="product"
                                  src={
                                    item.imgSrc ||
                                    item.thumbnail ||
                                    "/images/avatar/user-default.jpg"
                                  }
                                  width={600}
                                  height={800}
                                />
                              </Link>
                              <div className="cart-info">
                                <Link
                                  href={`/product-detail/${item.product_uuid || item.product_id || item.id}`}
                                  className="cart-title link"
                                >
                                  {item.title || item.name}
                                </Link>
                                {item.variant_name && (
                                  <div className="text-secondary-2 mt-2">
                                    {item.variant_name}
                                  </div>
                                )}
                                {item.option_values &&
                                  item.option_values.length > 0 && (
                                    <div
                                      className="text-secondary-2 mt-1"
                                      style={{ fontSize: "12px" }}
                                    >
                                      {item.option_values.map((opt, idx) => (
                                        <span key={idx}>
                                          {opt.option_name}: {opt.value}
                                          {idx <
                                            item.option_values.length - 1 &&
                                            ", "}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            </td>
                            <td
                              data-cart-title="Price"
                              className="tf-cart-item_price text-center"
                            >
                              <div className="cart-price text-button price-on-sale">
                                ₹{item.price.toFixed(2)}
                              </div>
                              {item.mrp && item.mrp > item.price && (
                                <div
                                  className="text-muted"
                                  style={{
                                    fontSize: "12px",
                                    textDecoration: "line-through",
                                  }}
                                >
                                  ₹{item.mrp.toFixed(2)}
                                </div>
                              )}
                              {item.offer_percentage > 0 && (
                                <div
                                  className="text-success"
                                  style={{ fontSize: "11px" }}
                                >
                                  {item.offer_percentage}% OFF
                                </div>
                              )}
                            </td>
                            <td
                              data-cart-title="Quantity"
                              className="tf-cart-item_quantity"
                            >
                              <div className="wg-quantity mx-md-auto">
                                <span
                                  className="btn-quantity btn-decrease"
                                  onClick={() =>
                                    updateQuantity(
                                      item.id || item.product_id,
                                      item.quantity - 1,
                                    )
                                  }
                                >
                                  -
                                </span>
                                <input
                                  type="text"
                                  className="quantity-product"
                                  name="number"
                                  value={item.quantity}
                                  readOnly
                                />
                                <span
                                  className="btn-quantity btn-increase"
                                  onClick={() =>
                                    updateQuantity(
                                      item.id || item.product_id,
                                      item.quantity + 1,
                                    )
                                  }
                                >
                                  +
                                </span>
                              </div>
                            </td>
                            <td
                              data-cart-title="Total"
                              className="tf-cart-item_total text-center"
                            >
                              <div className="cart-total text-button total-price">
                                ₹
                                {(
                                  item.total || item.price * item.quantity
                                ).toFixed(2)}
                              </div>
                              {item.savings > 0 && (
                                <div
                                  className="text-success"
                                  style={{ fontSize: "11px" }}
                                >
                                  Save ₹{item.savings.toFixed(2)}
                                </div>
                              )}
                            </td>
                            <td
                              data-cart-title="Remove"
                              className="remove-cart"
                              onClick={() =>
                                removeItem(item.id || item.product_id)
                              }
                            >
                              <span className="remove icon icon-close" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {isModuleEnabled("discounts") && (
                    <>
                      <div className="ip-discount-code">
                    <input
                      type="text"
                      placeholder="Add voucher discount"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      disabled={applyingCoupon || !isAuthenticated}
                    />
                    <button
                      className="tf-btn"
                      onClick={handleApplyCoupon}
                      disabled={
                        applyingCoupon || !isAuthenticated || !couponCode.trim()
                      }
                    >
                      <span className="text">
                        {applyingCoupon ? "Applying..." : "Apply Code"}
                      </span>
                    </button>
                  </div>
                  {appliedCouponCode && (
                    <div
                      className="applied-coupon mt-2"
                      style={{
                        padding: "12px",
                        backgroundColor: "#e8f5e9",
                        borderRadius: "4px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "14px", fontWeight: "500" }}>
                          Coupon Applied: {appliedCouponCode}
                        </span>
                        {cartSummary?.discount_breakdown?.coupon && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginTop: "4px",
                            }}
                          >
                            Discount: ₹
                            {cartSummary.discount_breakdown.coupon.toFixed(2)}
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
                          fontWeight: "500",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <div className="group-discount">
                    {loadingCoupons ? (
                      <div className="text-center py-3">
                        <div
                          className="spinner-border spinner-border-sm"
                          role="status"
                        >
                          <span className="visually-hidden">
                            Loading coupons...
                          </span>
                        </div>
                        <div
                          className="mt-2"
                          style={{ fontSize: "14px", color: "#666" }}
                        >
                          Loading available coupons...
                        </div>
                      </div>
                    ) : coupons.length > 0 ? (
                      coupons.map((coupon, index) => {
                        // Format discount display
                        const discountText =
                          coupon.type === "percentage"
                            ? `${coupon.value}% OFF`
                            : `₹${coupon.value} OFF`;

                        // Format description
                        const minOrderText = coupon.min_order_amount
                          ? `For all orders from ₹${coupon.min_order_amount.toFixed(2)}`
                          : "For all orders";

                        // Check if this coupon is applied
                        const isApplied = appliedCouponCode === coupon.code;
                        const isActive =
                          activeDiscountIndex === index || isApplied;

                        return (
                          <div
                            key={coupon.uuid || index}
                            className={`box-discount ${isActive ? "active" : ""}`}
                            onClick={() => handleCouponCardClick(coupon, index)}
                            style={{
                              cursor: applyingCoupon
                                ? "not-allowed"
                                : "pointer",
                              opacity: applyingCoupon ? 0.6 : 1,
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
                                <p className="text-caption-1">
                                  {coupon.description || minOrderText}
                                </p>
                                {coupon.expires_at && (
                                  <p
                                    className="text-caption-1"
                                    style={{
                                      fontSize: "11px",
                                      color: "#999",
                                      marginTop: "4px",
                                    }}
                                  >
                                    Expires:{" "}
                                    {new Date(
                                      coupon.expires_at,
                                    ).toLocaleDateString()}
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
                                  {applyingCoupon && isActive
                                    ? "Applying..."
                                    : isApplied
                                      ? "Applied"
                                      : "Apply Code"}
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div
                        className="text-center py-3"
                        style={{ fontSize: "14px", color: "#666" }}
                      >
                        No coupons available at the moment
                      </div>
                    )}
                  </div>
                  </>
                )}
                </form>
              ) : (
                <div>
                  Your wishlist is empty. Start adding your favorite products to
                  save them for later!{" "}
                  <Link className="btn-line" href="/products">
                    Explore Products
                  </Link>
                </div>
              )}
            </div>
            <div className="col-xl-4">
              <div className="fl-sidebar-cart">
                <div className="box-order bg-surface">
                  <h5 className="title">Order Summary</h5>

                  {loadingSummary ? (
                    <div className="text-center py-4">
                      <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <div
                        className="mt-2"
                        style={{ fontSize: "14px", color: "#666" }}
                      >
                        Calculating...
                      </div>
                    </div>
                  ) : cartSummary ? (
                    <>
                      <div className="subtotal text-button d-flex justify-content-between align-items-center">
                        <span>Subtotal</span>
                        <span className="total">
                          ₹{cartSummary.subtotal?.toFixed(2) || "0.00"}
                        </span>
                      </div>

                      {cartSummary.tax > 0 && (
                        <div className="tax text-button d-flex justify-content-between align-items-center mt-2">
                          <span>Tax (GST)</span>
                          <span className="total">
                            ₹{cartSummary.tax?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                      )}

                      {cartSummary.discount > 0 && (
                        <div className="discount text-button d-flex justify-content-between align-items-center mt-2">
                          <span>Discount</span>
                          <span className="total" style={{ color: "#4caf50" }}>
                            -₹{cartSummary.discount?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                      )}

                      {cartSummary.discount_breakdown && (
                        <div
                          className="discount-breakdown mt-1"
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            paddingLeft: "12px",
                          }}
                        >
                          {cartSummary.discount_breakdown.coupon > 0 && (
                            <div>
                              Coupon: -₹
                              {cartSummary.discount_breakdown.coupon.toFixed(2)}
                            </div>
                          )}
                          {cartSummary.discount_breakdown.milestone > 0 && (
                            <div>
                              Loyalty: -₹
                              {cartSummary.discount_breakdown.milestone.toFixed(
                                2,
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {cartSummary.loyalty_offer?.applied && (
                        <div
                          className="loyalty-offer mt-2"
                          style={{
                            padding: "8px",
                            backgroundColor: "#fff3e0",
                            borderRadius: "4px",
                            fontSize: "12px",
                          }}
                        >
                          <div
                            style={{ fontWeight: "500", marginBottom: "4px" }}
                          >
                            🎉 Loyalty Discount Applied
                          </div>
                          <div style={{ color: "#666" }}>
                            {cartSummary.loyalty_offer.details?.name ||
                              "Loyalty Discount"}
                          </div>
                          {cartSummary.loyalty_offer.details
                            ?.discount_amount && (
                            <div
                              style={{
                                color: "#4caf50",
                                fontWeight: "500",
                                marginTop: "4px",
                              }}
                            >
                              -₹
                              {cartSummary.loyalty_offer.details.discount_amount.toFixed(
                                2,
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="ship mt-3 text-button d-flex justify-content-between align-items-center">
                        <span>Delivery Charge</span>
                        <span className="total">
                          {formatCurrency(
                            cartSummary.delivery_charge || 0,
                            cartSummary.currency,
                          )}
                        </span>
                      </div>

                      {paymentMethod === "cod" && parseFloat(cartSummary.cod_fee || 0) > 0 && (
                        <div className="ship mt-3 text-button d-flex justify-content-between align-items-center">
                          <span>COD Handling Fee</span>
                          <span className="total">
                            {formatCurrency(
                              parseFloat(cartSummary.cod_fee || 0),
                              cartSummary.currency,
                            )}
                          </span>
                        </div>
                      )}

                      <h5 className="total-order d-flex justify-content-between align-items-center mt-3">
                        <span>Total</span>
                        <span className="total">
                          {formatCurrency(
                            cartSummary.total || 0,
                            cartSummary.currency,
                          )}
                        </span>
                      </h5>

                      {/* Payment Method Selection */}
                      {cartSummary && (
                        <div
                          className="payment-method-selection mt-3"
                          style={{
                            padding: "16px",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "8px",
                            border: "1px solid #e0e0e0",
                          }}
                        >
                          <div
                            className="mb-2"
                            style={{ fontSize: "14px", fontWeight: "600" }}
                          >
                            Select Payment Method
                          </div>
                          <div className="d-flex flex-column gap-2">
                            {checkout?.razorpayEnabled !== false && (
                              <label
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "12px",
                                  backgroundColor:
                                    paymentMethod === "razorpay"
                                      ? "#e3f2fd"
                                      : "white",
                                  borderRadius: "6px",
                                  border: `2px solid ${paymentMethod === "razorpay" ? "#1976d2" : "#e0e0e0"}`,
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                                onClick={() => handlePaymentMethodChange("razorpay")}
                                onMouseEnter={(e) => {
                                  if (paymentMethod !== "razorpay") {
                                    e.currentTarget.style.borderColor =
                                      "#1976d2";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (paymentMethod !== "razorpay") {
                                    e.currentTarget.style.borderColor =
                                      "#e0e0e0";
                                  }
                                }}
                              >
                                <input
                                  type="radio"
                                  name="payment_method"
                                  value="razorpay"
                                  checked={paymentMethod === "razorpay"}
                                  onChange={() =>
                                    handlePaymentMethodChange("razorpay")
                                  }
                                  style={{
                                    marginRight: "12px",
                                    cursor: "pointer",
                                  }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div
                                    style={{
                                      fontWeight: "500",
                                      fontSize: "14px",
                                    }}
                                  >
                                    Razorpay Payment
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#666",
                                      marginTop: "2px",
                                    }}
                                  >
                                    Pay securely with Cards, UPI, Wallets, Net
                                    Banking
                                  </div>
                                </div>
                              </label>
                            )}

                            {checkout?.codEnabled !== false && cartSummary.cod_available && (
                              <label
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "12px",
                                  backgroundColor:
                                    paymentMethod === "cod"
                                      ? "#e8f5e9"
                                      : "white",
                                  borderRadius: "6px",
                                  border: `2px solid ${paymentMethod === "cod" ? "#4caf50" : "#e0e0e0"}`,
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                                onClick={() => handlePaymentMethodChange("cod")}
                                onMouseEnter={(e) => {
                                  if (paymentMethod !== "cod") {
                                    e.currentTarget.style.borderColor =
                                      "#4caf50";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (paymentMethod !== "cod") {
                                    e.currentTarget.style.borderColor =
                                      "#e0e0e0";
                                  }
                                }}
                              >
                                <input
                                  type="radio"
                                  name="payment_method"
                                  value="cod"
                                  checked={paymentMethod === "cod"}
                                  onChange={() =>
                                    handlePaymentMethodChange("cod")
                                  }
                                  style={{
                                    marginRight: "12px",
                                    cursor: "pointer",
                                  }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div
                                    style={{
                                      fontWeight: "500",
                                      fontSize: "14px",
                                    }}
                                  >
                                    Cash on Delivery (COD)
                                    {cartSummary.cod_advance_enabled && (
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
                                        {cartSummary?.is_cod_fee_advance ? "COD Fee Online" : "Advance Required"}
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#666",
                                      marginTop: "2px",
                                    }}
                                  >
                                    {cartSummary.cod_advance_enabled
                                      ? cartSummary?.is_cod_fee_advance
                                        ? `Pay ₹${(cartSummary.cod_advance_payable_now || 0).toFixed(2)} COD fee online. Remaining ₹${(cartSummary.cod_balance_due || 0).toFixed(2)} on delivery.`
                                        : `Pay ₹${(cartSummary.cod_advance_payable_now || 100).toFixed(2)} advance deposit online. Remaining ₹${(cartSummary.cod_balance_due || 0).toFixed(2)} on delivery.`
                                      : "Pay when you receive your order"}
                                  </div>
                                </div>
                              </label>
                            )}

                            {checkout?.codEnabled !== false && !cartSummary.cod_available && (
                              <div
                                style={{
                                  padding: "10px 14px",
                                  backgroundColor: "#fff8f0",
                                  borderRadius: "6px",
                                  border: "1px solid #ffe0b2",
                                  fontSize: "12px",
                                  color: "#b76e00",
                                }}
                              >
                                <span>Cash on Delivery is currently unavailable for this address or order value</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="subtotal text-button d-flex justify-content-between align-items-center">
                        <span>Subtotal</span>
                        <span className="total">₹{totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="discount text-button d-flex justify-content-between align-items-center">
                        <span>Discounts</span>
                        <span className="total">₹0.00</span>
                      </div>
                      <div className="ship mt-3 text-button d-flex justify-content-between align-items-center">
                        <span>Delivery Charge</span>
                        <span className="total">₹0.00</span>
                      </div>
                      <h5 className="total-order d-flex justify-content-between align-items-center mt-3">
                        <span>Total</span>
                        <span className="total">₹{totalPrice.toFixed(2)}</span>
                      </h5>
                    </>
                  )}
                  <div className="box-progress-checkout">
                    <button
                      onClick={handlePlaceOrder}
                      className="tf-btn btn-reset"
                      style={{ width: "100%" }}
                      disabled={
                        placingOrder ||
                        !selectedAddress ||
                        (cartSummary &&
                          cartSummary.shipping_available === false)
                      }
                    >
                      {placingOrder
                        ? "Placing Order..."
                        : paymentMethod === "cod" &&
                            cartSummary?.cod_advance_enabled &&
                            Number(cartSummary?.cod_advance_payable_now) > 0
                          ? `Pay ₹${Number(cartSummary.cod_advance_payable_now).toFixed(2)} ${
                              cartSummary?.is_cod_fee_advance ? "COD Fee" : "Advance"
                            }`
                          : paymentMethod === "cod"
                            ? "Place COD Order"
                            : "Place Order"}
                    </button>
                    {!selectedAddress && (
                      <p
                        className="text-center mt-2 mb-0"
                        style={{ fontSize: "12px", color: "#856404" }}
                      >
                        Please select a shipping address
                      </p>
                    )}
                    {cartSummary &&
                      cartSummary.shipping_available === false && (
                        <p
                          className="text-center mt-2 mb-0"
                          style={{ fontSize: "12px", color: "#856404" }}
                        >
                          Shipping not available to selected address
                        </p>
                      )}
                    <p className="text-button text-center mt-2">
                      Or continue shopping
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        address={null}
        onSuccess={handleAddressSaved}
      />
    </>
  );
}
