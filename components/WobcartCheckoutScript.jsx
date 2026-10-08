"use client";

import { useEffect } from "react";
import {
  getWobcartConfigUrl,
  getWobcartScriptUrl,
  prefetchWobcartConfig,
  syncWobcartAuth,
} from "@/utils/wobcartCheckout";

export default function WobcartCheckoutScript() {
  useEffect(() => {
    let cancelled = false;

    const preloadLink = document.createElement("link");
    preloadLink.rel = "preload";
    preloadLink.as = "script";
    preloadLink.href = getWobcartScriptUrl();
    document.head.appendChild(preloadLink);

    prefetchWobcartConfig().catch(() => {});

    async function loadCheckoutScript() {
      const scriptUrl = getWobcartScriptUrl();
      if (cancelled) return;

      const existing = document.getElementById("wobcart-checkout-script");
      if (existing) {
        const currentSrc = existing.src.split("#")[0].split("?")[0];
        const nextSrc = scriptUrl.split("#")[0].split("?")[0];
        if (currentSrc === nextSrc) {
          syncWobcartAuth().catch(() => {});
          if (window.WobcartCheckout?.resumePendingPayment) {
            window.WobcartCheckout.resumePendingPayment();
          }
          return;
        }
        existing.remove();
        delete window.WobcartCheckout;
        delete window.WobcartCart;
      }

      const script = document.createElement("script");
      script.id = "wobcart-checkout-script";
      script.src = scriptUrl;
      script.async = true;
      script.setAttribute("data-api", getWobcartConfigUrl());
      script.setAttribute("data-auth-storage-key", "access_token");
      if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        script.setAttribute("data-google-client-id", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
      }
      script.onload = () => {
        syncWobcartAuth().catch(() => {});
        if (window.WobcartCheckout?.resumePendingPayment) {
          window.WobcartCheckout.resumePendingPayment();
        }
      };
      script.onerror = () => {
        console.error("Failed to load Wobcart Checkout script from", scriptUrl);
      };
      document.body.appendChild(script);
    }

    loadCheckoutScript();

    return () => {
      cancelled = true;
      preloadLink.remove();
    };
  }, []);

  return null;
}
