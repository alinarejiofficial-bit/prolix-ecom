"use client";
import { allProducts } from "@/data/products";
import { openCartModal } from "@/utlis/openCartModal";
import { openWistlistModal } from "@/utlis/openWishlist";
import { showToast } from "@/utlis/showToast";
import { authService } from "@/services/authService";
import { wishlistService } from "@/services/wishlistService";
import { cartService } from "@/services/cartService";
import {
  addToWobcartCart,
  clearWobcartCart,
  removeFromWobcartCart,
  updateWobcartCartItem,
} from "@/utils/wobcartCheckout";

import React, { useEffect } from "react";
import { useContext, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AddToCartVariantModal from "@/components/modals/AddToCartVariantModal";
import { StoreConfigProvider, useStoreConfig, FeatureGate } from "@/context/StoreConfigContext";
export { useStoreConfig, FeatureGate };
const dataContext = React.createContext();
export const useContextElement = () => {
  return useContext(dataContext);
};

export default function Context({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [cartProducts, setCartProducts] = useState([]);
  const [wishList, setWishList] = useState([]); // Store product IDs/UUIDs
  const [apiWishlistProductIds, setApiWishlistProductIds] = useState([]); // Store product_ids from API
  const [quickViewItem, setQuickViewItem] = useState(allProducts[0]);
  const [quickAddItem, setQuickAddItem] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

  // Authentication state
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [variantModalProduct, setVariantModalProduct] = useState(null);
  useEffect(() => {
    const subtotal = cartProducts.reduce((accumulator, product) => {
      return accumulator + product.quantity * product.price;
    }, 0);
    setTotalPrice(subtotal);
  }, [cartProducts]);

  const isAddedToCartProducts = (id) => {
    if (!id) return false;
    if (cartProducts.filter((elm) => elm && elm.id == id)[0]) {
      return true;
    }
    return false;
  };

  // Refresh cart from API
  const refreshCart = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await cartService.getCart();
      if (response.success && response.data) {
        // Map API cart items to local format
        const cartItems =
          response.data.items?.map((item) => ({
            id: item.product_id,
            uuid: item.uuid,
            product_id: item.product_id,
            variant_id: item.variant_id,
            variant_uuid: item.variant_uuid || item.variant_id,
            name: item.product_name,
            title: item.product_name,
            price: parseFloat(item.selling_price),
            mrp: parseFloat(item.mrp),
            quantity: item.quantity,
            imgSrc: item.thumbnail || "",
            variant_name: item.variant_name,
            offer_percentage: item.offer_percentage,
            savings: item.savings,
            in_stock: item.in_stock,
          })) || [];
        setCartProducts(cartItems);
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error("Error refreshing cart:", error);
      throw error;
    }
  };

  const addProductToCart = async (
    id,
    qty,
    productData = null,
    isModal = true,
  ) => {
    // Extract product_id and variant_id from productData if available
    const productId =
      productData?.apiProduct?.uuid || productData?.product_id || null;
    const variantId =
      productData?.variant?.uuid ||
      productData?.variant_id ||
      productData?.selectedVariant?.uuid ||
      null;
    const quantity = qty ? qty : 1;

    // Keep Wobcart Checkout guest cart in sync for checkout widget
    if (variantId) {
      try {
        await addToWobcartCart(variantId, quantity);
      } catch (wobcartError) {
        console.warn("Wobcart cart sync failed:", wobcartError);
      }
    }

    // If authenticated and we have product_id and variant_id, use API
    if (isAuthenticated && productId && variantId) {
      try {
        const response = await cartService.addToCart(
          productId,
          variantId,
          quantity,
        );
        if (response.success) {
          // Refresh cart from API to get the latest state
          try {
            const cartResponse = await cartService.getCart();
            if (cartResponse.success && cartResponse.data) {
              // Map API cart items to local format
              const cartItems =
                cartResponse.data.items?.map((item) => ({
                  id: item.product_id,
                  uuid: item.uuid,
                  product_id: item.product_id,
                  product_uuid: item.product_uuid,
                  variant_id: item.variant_id,
                variant_uuid: item.variant_uuid || item.variant_id,
            variant_uuid: item.variant_uuid || item.variant_id,
                  variant_uuid: item.variant_uuid || item.variant_id,
                  name: item.product_name,
                  title: item.product_name,
                  price: parseFloat(item.selling_price),
                  mrp: parseFloat(item.mrp),
                  quantity: item.quantity,
                  imgSrc: item.thumbnail || "",
                  variant_name: item.variant_name,
                  offer_percentage: item.offer_percentage,
                  savings: item.savings,
                  in_stock: item.in_stock,
                })) || [];
              setCartProducts(cartItems);
            }
          } catch (error) {
            console.error("Error refreshing cart after add:", error);
            // Fallback: add item manually if refresh fails
            const item = {
              id: id,
              uuid: response.data.uuid,
              product_id: response.data.product_id,
              product_uuid:
                response.data.product_uuid ||
                productData?.apiProduct?.uuid ||
                productData?.uuid,
              variant_id: response.data.variant_id,
              name: productData?.name || productData?.title || "Product",
              price: parseFloat(response.data.price),
              quantity: response.data.quantity,
              imgSrc: productData?.imgSrc || productData?.image || "",
              ...productData,
            };
            setCartProducts((pre) => [...pre, item]);
          }
          if (isModal) {
            openCartModal();
          }
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
        // Handle specific error cases
        if (error.statusCode === 401) {
          openAuthModal();
        } else if (error.statusCode === 400) {
          // Handle insufficient stock or invalid price
          alert(error.message || "Failed to add to cart");
        } else if (error.statusCode === 404) {
          alert("Product or variant not found");
        } else if (error.statusCode === 422) {
          // Validation errors
          const errorMessages = Object.values(error.errors || {})
            .flat()
            .join(", ");
          alert(errorMessages || "Validation failed");
        } else {
          alert(error.message || "Failed to add to cart");
        }
        throw error; // Re-throw so calling code can handle it
      }
    } else {
      // Guest checkout — Wobcart handles auth during checkout
      if (!variantId) {
        alert("Product information is missing. Please try again.");
        return;
      }

      if (!isAddedToCartProducts(id)) {
        const item = {
          ...(productData ||
            allProducts.filter((elm) => elm.id == id)[0] ||
            {}),
          id: id,
          product_id: productId,
          variant_id: variantId,
          variant_uuid: variantId,
          quantity: quantity,
        };
        setCartProducts((pre) => [...pre, item]);
      } else {
        const existing = cartProducts.find((elm) => elm.id == id);
        const newQty = (existing?.quantity || 0) + quantity;
        setCartProducts((pre) =>
          pre.map((elm) =>
            elm.id == id ? { ...elm, quantity: newQty } : elm,
          ),
        );
        try {
          await updateWobcartCartItem(variantId, newQty);
        } catch (wobcartError) {
          console.warn("Wobcart cart sync failed:", wobcartError);
        }
      }

      if (isModal) {
        openCartModal();
      }
    }
  };

  const updateQuantity = async (id, qty) => {
    if (!isAddedToCartProducts(id)) return;

    const quantity = qty / 1;
    if (quantity < 1) return; // Minimum quantity is 1

    let item = cartProducts.filter((elm) => elm.id == id)[0];
    if (!item) return;

    // If authenticated and we have cart item uuid, use API
    if (isAuthenticated && item.uuid) {
      try {
        const response = await cartService.updateCartItem(item.uuid, quantity);
        if (response.success) {
          // Refresh cart from API to get the latest state
          try {
            const cartResponse = await cartService.getCart();
            if (cartResponse.success && cartResponse.data) {
              // Map API cart items to local format
              const cartItems =
                cartResponse.data.items?.map((cartItem) => ({
                  id: cartItem.product_id,
                  uuid: cartItem.uuid,
                  product_id: cartItem.product_id,
                  product_uuid: cartItem.product_uuid,
                  variant_id: cartItem.variant_id,
                  variant_uuid: cartItem.variant_uuid || cartItem.variant_id,
                  name: cartItem.product_name,
                  title: cartItem.product_name,
                  price: parseFloat(cartItem.selling_price),
                  mrp: parseFloat(cartItem.mrp),
                  quantity: cartItem.quantity,
                  imgSrc: cartItem.thumbnail || "",
                  variant_name: cartItem.variant_name,
                  offer_percentage: cartItem.offer_percentage,
                  savings: cartItem.savings,
                  in_stock: cartItem.in_stock,
                })) || [];
              setCartProducts(cartItems);
            }
          } catch (error) {
            console.error("Error refreshing cart after update:", error);
            // Fallback: update item manually if refresh fails
            let items = [...cartProducts];
            const itemIndex = items.indexOf(item);
            item.quantity = quantity;
            item.price = parseFloat(response.data.price);
            items[itemIndex] = item;
            setCartProducts(items);
          }
        }

        const variantUuid = item.variant_uuid || item.variant_id;
        if (variantUuid) {
          try {
            await updateWobcartCartItem(variantUuid, quantity);
          } catch (wobcartError) {
            console.warn("Wobcart cart sync failed:", wobcartError);
          }
        }
      } catch (error) {
        console.error("Error updating cart item:", error);
        // Handle specific error cases
        if (error.statusCode === 401) {
          openAuthModal();
        } else if (error.statusCode === 400) {
          // Handle insufficient stock or invalid price
          alert(error.message || "Failed to update cart item");
        } else if (error.statusCode === 404) {
          alert("Cart item not found");
        } else if (error.statusCode === 422) {
          // Validation errors
          const errorMessages = Object.values(error.errors || {})
            .flat()
            .join(", ");
          alert(errorMessages || "Validation failed");
        } else {
          alert(error.message || "Failed to update cart item");
        }
        throw error; // Re-throw so calling code can handle it
      }
    } else {
      // Not authenticated or no uuid - use local storage
      let items = [...cartProducts];
      const itemIndex = items.indexOf(item);
      item.quantity = quantity;
      items[itemIndex] = item;
      setCartProducts(items);

      const variantUuid = item.variant_uuid || item.variant_id;
      if (variantUuid) {
        try {
          await updateWobcartCartItem(variantUuid, quantity);
        } catch (wobcartError) {
          console.warn("Wobcart cart sync failed:", wobcartError);
        }
      }
    }
  };

  const removeItem = async (id) => {
    const item = cartProducts.filter((elm) => elm.id == id)[0];
    if (!item) return;

    // If authenticated and we have cart item uuid, use API
    if (isAuthenticated && item.uuid) {
      try {
        const response = await cartService.removeCartItem(item.uuid);
        if (response.success) {
          // Refresh cart from API to get the latest state
          try {
            const cartResponse = await cartService.getCart();
            if (cartResponse.success && cartResponse.data) {
              // Map API cart items to local format
              const cartItems =
                cartResponse.data.items?.map((cartItem) => ({
                  id: cartItem.product_id,
                  uuid: cartItem.uuid,
                  product_id: cartItem.product_id,
                  product_uuid: cartItem.product_uuid,
                  variant_id: cartItem.variant_id,
                  variant_uuid: cartItem.variant_uuid || cartItem.variant_id,
                  name: cartItem.product_name,
                  title: cartItem.product_name,
                  price: parseFloat(cartItem.selling_price),
                  mrp: parseFloat(cartItem.mrp),
                  quantity: cartItem.quantity,
                  imgSrc: cartItem.thumbnail || "",
                  variant_name: cartItem.variant_name,
                  offer_percentage: cartItem.offer_percentage,
                  savings: cartItem.savings,
                  in_stock: cartItem.in_stock,
                })) || [];
              setCartProducts(cartItems);
            }
            // Show success toast
            showToast("Item removed from cart successfully", "success");
          } catch (error) {
            console.error("Error refreshing cart after remove:", error);
            // Fallback: remove item manually if refresh fails
            setCartProducts((pre) => pre.filter((elm) => elm.id != id));
            // Show success toast even if refresh fails
            showToast("Item removed from cart successfully", "success");
          }

          const variantUuid = item.variant_uuid || item.variant_id;
          if (variantUuid) {
            try {
              await removeFromWobcartCart(variantUuid);
            } catch (wobcartError) {
              console.warn("Wobcart cart sync failed:", wobcartError);
            }
          }
        }
      } catch (error) {
        console.error("Error removing cart item:", error);
        // Handle specific error cases
        if (error.statusCode === 401) {
          openAuthModal();
        } else if (error.statusCode === 404) {
          showToast("Cart item not found", "danger");
          // Remove from local state anyway
          setCartProducts((pre) => pre.filter((elm) => elm.id != id));
        } else {
          showToast(error.message || "Failed to remove cart item", "danger");
        }
        throw error; // Re-throw so calling code can handle it
      }
    } else {
      // Not authenticated or no uuid - use local storage
      setCartProducts((pre) => pre.filter((elm) => elm.id != id));
      showToast("Item removed from cart successfully", "success");

      const variantUuid = item.variant_uuid || item.variant_id;
      if (variantUuid) {
        try {
          await removeFromWobcartCart(variantUuid);
        } catch (wobcartError) {
          console.warn("Wobcart cart sync failed:", wobcartError);
        }
      }
    }
  };

  const clearCart = async () => {
    // If authenticated, use API
    if (isAuthenticated) {
      try {
        const response = await cartService.clearCart();
        if (response.success) {
          // Clear local cart state
          setCartProducts([]);
          try {
            await clearWobcartCart();
          } catch (wobcartError) {
            console.warn("Wobcart cart sync failed:", wobcartError);
          }
        }
      } catch (error) {
        console.error("Error clearing cart:", error);
        // Handle specific error cases
        if (error.statusCode === 401) {
          openAuthModal();
        } else {
          alert(error.message || "Failed to clear cart");
        }
        throw error; // Re-throw so calling code can handle it
      }
    } else {
      // Not authenticated - use local storage
      setCartProducts([]);
      try {
        await clearWobcartCart();
      } catch (wobcartError) {
        console.warn("Wobcart cart sync failed:", wobcartError);
      }
    }
  };

  const addToWishlist = async (idOrUuid, productUuid = null) => {
    // If authenticated, use API
    if (isAuthenticated) {
      // Use productUuid if provided, otherwise try to use idOrUuid as uuid
      const productId = productUuid || idOrUuid;

      try {
        const response = await wishlistService.addToWishlist(productId);
        if (response.success) {
          // Add to local state
          if (!apiWishlistProductIds.includes(response.data.product_id)) {
            setApiWishlistProductIds((pre) => [
              ...pre,
              response.data.product_id,
            ]);
          }
          if (!wishList.includes(idOrUuid)) {
            setWishList((pre) => [...pre, idOrUuid]);
          }
          openWistlistModal();
        }
      } catch (error) {
        console.error("Error adding to wishlist:", error);
        // If error is 401, user might need to login again
        if (error.statusCode === 401) {
          openAuthModal();
        } else {
          alert(error.message || "Failed to add to wishlist");
        }
      }
    } else {
      // Not authenticated - use local storage (for demo products)
      if (!wishList.includes(idOrUuid)) {
        setWishList((pre) => [...pre, idOrUuid]);
        openWistlistModal();
      }
    }
  };

  const removeFromWishlist = async (
    idOrUuid,
    wishlistItemUuid = null,
    productUuid = null,
  ) => {
    // If authenticated, use API
    if (isAuthenticated) {
      try {
        // Prefer productUuid for removal (new endpoint), fallback to wishlistItemUuid
        if (productUuid) {
          await wishlistService.removeWishlistByProduct(productUuid);
        } else if (wishlistItemUuid) {
          await wishlistService.removeWishlist(wishlistItemUuid);
        } else {
          // Try to use idOrUuid as product UUID
          await wishlistService.removeWishlistByProduct(idOrUuid);
        }

        // Remove from local state - use productUuid if available, otherwise idOrUuid
        const productIdToRemove = productUuid || idOrUuid;
        setApiWishlistProductIds((pre) =>
          pre.filter((id) => id !== productIdToRemove),
        );
        setWishList((pre) => pre.filter((elm) => elm != idOrUuid));

        // Show success message
        showToast("Removed from wishlist", "success");
      } catch (error) {
        console.error("Error removing from wishlist:", error);
        // Handle specific error cases
        if (error.statusCode === 401) {
          openAuthModal();
        } else {
          showToast(
            error.message || "Failed to remove from wishlist",
            "danger",
          );
        }
      }
    } else {
      // Not authenticated - use local storage
      if (wishList.includes(idOrUuid)) {
        setWishList((pre) => pre.filter((elm) => elm != idOrUuid));
        if (productUuid) {
          setApiWishlistProductIds((pre) =>
            pre.filter((id) => id !== productUuid),
          );
        }
        showToast("Removed from wishlist", "success");
      }
    }
  };

  const isAddedtoWishlist = (idOrUuid, productUuid = null) => {
    // Check both local wishlist and API wishlist
    if (isAuthenticated && productUuid) {
      return apiWishlistProductIds.includes(productUuid);
    }
    return wishList.includes(idOrUuid);
  };

  // Load cart from localStorage (for non-authenticated users) or API (for authenticated users)
  useEffect(() => {
    const loadCart = async () => {
      if (isAuthenticated) {
        // Fetch cart from API when authenticated
        try {
          const response = await cartService.getCart();
          if (response.success && response.data) {
            // Map API cart items to local format
            const cartItems =
              response.data.items?.map((item) => ({
                id: item.product_id, // Use product_id as id for compatibility
                uuid: item.uuid,
                product_id: item.product_id,
                product_uuid: item.product_uuid,
                variant_id: item.variant_id,
                variant_uuid: item.variant_uuid || item.variant_id,
            variant_uuid: item.variant_uuid || item.variant_id,
                name: item.product_name,
                title: item.product_name,
                price: parseFloat(item.selling_price),
                mrp: parseFloat(item.mrp),
                quantity: item.quantity,
                imgSrc: item.thumbnail || "",
                variant_name: item.variant_name,
                offer_percentage: item.offer_percentage,
                savings: item.savings,
                in_stock: item.in_stock,
              })) || [];
            setCartProducts(cartItems);
          }
        } catch (error) {
          console.error("Error fetching cart:", error);
          // If 401, user might need to login again
          if (error.statusCode === 401) {
            // Don't clear cart on 401, just log the error
            console.log("Unauthorized - cart not loaded");
          }
        }
      } else {
        // Load from localStorage for non-authenticated users
        const items = JSON.parse(localStorage.getItem("cartList"));
        if (items?.length) {
          setCartProducts(items);
        }
      }
    };

    // Only load cart if auth status is determined
    if (!authLoading) {
      loadCart();
    }
  }, [isAuthenticated, authLoading]);

  // Save cart to localStorage (only for non-authenticated users)
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem("cartList", JSON.stringify(cartProducts));
    }
  }, [cartProducts, isAuthenticated]);

  // Load wishlist from localStorage (for non-authenticated users)
  useEffect(() => {
    if (!isAuthenticated) {
      const items = JSON.parse(localStorage.getItem("wishlist"));
      if (items?.length) {
        setWishList(items);
      }
    }
  }, [isAuthenticated]);

  // Save wishlist to localStorage (for non-authenticated users)
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem("wishlist", JSON.stringify(wishList));
    }
  }, [wishList, isAuthenticated]);

  // Sync wishlist from API when user becomes authenticated
  useEffect(() => {
    const syncWishlistFromAPI = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await wishlistService.getWishlists({
          page: 1,
          per_page: 100,
        });
        if (response.success && response.data) {
          const productIds = response.data.map((item) => item.product_id);
          setApiWishlistProductIds(productIds);
          // Also update local wishlist with product_ids for compatibility
          setWishList(productIds);
        }
      } catch (error) {
        console.error("Error syncing wishlist from API:", error);
      }
    };

    if (isAuthenticated) {
      syncWishlistFromAPI();
    } else {
      // Clear API wishlist when logged out
      setApiWishlistProductIds([]);
    }
  }, [isAuthenticated]);

  // Sync cart when Wobcart checkout completes payment in background
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onOrderPlaced = async (event) => {
      try {
        await clearWobcartCart();
      } catch (_) {}

      if (isAuthenticated) {
        try {
          await refreshCart();
        } catch (_) {
          setCartProducts([]);
        }
      } else {
        setCartProducts([]);
      }

      const orderUuid = event?.detail?.order_uuid;
      showToast(
        orderUuid
          ? `Order confirmed! Reference: ${orderUuid}`
          : "Order confirmed successfully!",
        "success",
      );
    };

    window.addEventListener("wobcart:order-placed", onOrderPlaced);
    return () => window.removeEventListener("wobcart:order-placed", onOrderPlaced);
  }, [isAuthenticated]);

  // Authentication functions
  const login = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    authService.storeAuthData({ user: userData, access_token: token });
    if (typeof window !== "undefined" && window.WobcartCheckout?.setAuthToken) {
      window.WobcartCheckout.setAuthToken(token);
    }
  };

  const logout = async () => {
    try {
      // Call the logout API to invalidate the token on the server
      await authService.logout();
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local data
      setUser(null);
      setIsAuthenticated(false);
      authService.clearAuthData();
      if (typeof window !== "undefined" && window.WobcartCheckout?.clearAuthToken) {
        window.WobcartCheckout.clearAuthToken();
      }
      // Clear cart and load from localStorage if available
      const items = JSON.parse(localStorage.getItem("cartList"));
      if (items?.length) {
        setCartProducts(items);
      } else {
        setCartProducts([]);
      }
    }
  };

  const updateUser = (updatedUserData) => {
    setUser((prevUser) => ({
      ...prevUser,
      ...updatedUserData,
    }));
    // Update localStorage as well
    if (updatedUserData) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          ...updatedUserData,
        }),
      );
    }
  };

  const openAuthModal = () => {
    if (pathname === "/login") return;
    const next =
      pathname && pathname !== "/login"
        ? `?next=${encodeURIComponent(pathname)}`
        : "";
    router.push(`/login${next}`);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const checkAuthStatus = async () => {
    try {
      if (authService.isAuthenticated()) {
        const storedUser = authService.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);

          // Optionally verify token with server
          try {
            const response = await authService.getProfile();
            setUser(response.data.user);
          } catch (error) {
            // Token might be expired, logout
            logout();
          }
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      logout();
    } finally {
      setAuthLoading(false);
    }
  };

  // Initialize authentication on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const contextElement = {
    cartProducts,
    setCartProducts,
    totalPrice,
    addProductToCart,
    isAddedToCartProducts,
    refreshCart,
    removeItem,
    clearCart,
    removeFromWishlist,
    addToWishlist,
    isAddedtoWishlist,
    quickViewItem,
    wishList,
    setQuickViewItem,
    quickAddItem,
    setQuickAddItem,
    updateQuantity,
    // Authentication
    user,
    isAuthenticated,
    authLoading,
    login,
    logout,
    updateUser,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    variantModalProduct,
    setVariantModalProduct,
  };
  return (
    <StoreConfigProvider>
      <dataContext.Provider value={contextElement}>
        {children}
        <AddToCartVariantModal />
      </dataContext.Provider>
    </StoreConfigProvider>
  );
}
