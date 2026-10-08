import { getApiBaseUrl, resolveApiUrl } from "./apiConfig";

export function getWobcartConfigUrl() {
  const configured = process.env.NEXT_PUBLIC_WOBCART_CONFIG_URL;
  if (configured) {
    return resolveApiUrl(configured);
  }

  return `${getApiBaseUrl()}/customer/wobcart-checkout/config`;
}

export function getWobcartScriptUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/wobcart-checkout.js`;
  }

  return "/wobcart-checkout.js";
}

let prefetchPromise = null;

export function prefetchWobcartConfig() {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (window.__WOBCART_PREFETCHED_CONFIG__) {
    return Promise.resolve(window.__WOBCART_PREFETCHED_CONFIG__);
  }

  if (prefetchPromise) {
    return prefetchPromise;
  }

  prefetchPromise = fetch(getWobcartConfigUrl(), {
    headers: { Accept: "application/json" },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load checkout config");
      }
      return response.json();
    })
    .then((json) => {
      const config = json.data || json;
      window.__WOBCART_PREFETCHED_CONFIG__ = config;
      return config;
    })
    .catch((error) => {
      console.warn("Wobcart config prefetch failed:", error);
      return null;
    })
    .finally(() => {
      prefetchPromise = null;
    });

  return prefetchPromise;
}

export function waitForWobcart(timeout = 15000) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Prolix Checkout is only available in the browser"));
      return;
    }

    if (window.WobcartCheckout && window.WobcartCart) {
      resolve({
        WobcartCheckout: window.WobcartCheckout,
        WobcartCart: window.WobcartCart,
      });
      return;
    }

    const started = Date.now();
    const timer = setInterval(() => {
      if (window.WobcartCheckout && window.WobcartCart) {
        clearInterval(timer);
        resolve({
          WobcartCheckout: window.WobcartCheckout,
          WobcartCart: window.WobcartCart,
        });
        return;
      }

      if (Date.now() - started > timeout) {
        clearInterval(timer);
        reject(new Error("Prolix Checkout failed to load. Please refresh and try again."));
      }
    }, 50);
  });
}

export function mapToWobcartItem(variantUuid, quantity = 1, isPrebooking = false) {
  const item = {
    variant_uuid: variantUuid,
    quantity: Math.max(1, parseInt(quantity, 10) || 1),
  };

  if (isPrebooking) {
    item.is_prebooking = true;
  }

  return item;
}

export function mapCartProductsToWobcartItems(cartProducts = []) {
  return cartProducts
    .filter((item) => item.variant_uuid || item.variant_id)
    .map((item) =>
      mapToWobcartItem(
        item.variant_uuid || item.variant_id,
        item.quantity || 1,
        item.is_prebooking,
      ),
    );
}

export async function addToWobcartCart(variantUuid, quantity = 1) {
  const { WobcartCart } = await waitForWobcart();
  WobcartCart.add({ variant_uuid: variantUuid, quantity });
}

export async function updateWobcartCartItem(variantUuid, quantity) {
  const { WobcartCart } = await waitForWobcart();
  WobcartCart.update(variantUuid, quantity);
}

export async function removeFromWobcartCart(variantUuid) {
  const { WobcartCart } = await waitForWobcart();
  WobcartCart.remove(variantUuid);
}

export async function clearWobcartCart() {
  const { WobcartCart } = await waitForWobcart();
  WobcartCart.clear();
}

export async function syncWobcartAuth() {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("access_token");
  try {
    const { WobcartCheckout } = await waitForWobcart();
    if (WobcartCheckout.syncAuthFromStore) {
      WobcartCheckout.syncAuthFromStore();
    } else if (WobcartCheckout.setAuthToken) {
      WobcartCheckout.setAuthToken(token || null);
    }
  } catch {
    // Checkout script not loaded yet
  }
}

export async function openWobcartCheckout(items = [], options = {}) {
  prefetchWobcartConfig().catch(() => {});
  const { WobcartCheckout } = await waitForWobcart();
  syncWobcartAuth().catch(() => {});

  const pendingCoupon =
    typeof window !== "undefined"
      ? localStorage.getItem("wobcart_pending_coupon")
      : null;
  const userPincode =
    typeof window !== "undefined"
      ? localStorage.getItem("wobcart_user_pincode")
      : null;

  const payload = {
    items,
    coupon: options.coupon || pendingCoupon || undefined,
    couponCode: options.couponCode || options.coupon || pendingCoupon || undefined,
    pincode: options.pincode || userPincode || undefined,
  };

  if (options.express) {
    WobcartCheckout.express(payload);
  } else {
    WobcartCheckout.open(payload);
  }
}

export async function openWobcartCartDrawer() {
  prefetchWobcartConfig().catch(() => {});
  const { WobcartCart } = await waitForWobcart();
  WobcartCart.open();
}
