"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { storeFeaturesService } from "@/services/storeFeaturesService";

const StoreConfigContext = createContext(null);
const REFRESH_INTERVAL_MS = 45000;

function configSignature(config) {
  return JSON.stringify({
    modules: config?.modules || {},
    modulesVersion: config?.modulesVersion || 0,
    branding: config?.branding || {},
    checkout: config?.checkout || {},
    auth: {
      googleLoginEnabled: config?.auth?.googleLoginEnabled,
      appleLoginEnabled: config?.auth?.appleLoginEnabled,
      otpLoginEnabled: config?.auth?.otpLoginEnabled,
    },
    whatsappWidget: { enabled: config?.whatsappWidget?.enabled },
  });
}

export function StoreConfigProvider({ children }) {
  const [config, setConfig] = useState(() => storeFeaturesService.getCachedConfig());
  const [loading, setLoading] = useState(true);
  const signatureRef = useRef(configSignature(config));

  const fetchConfig = useCallback(async (force = false) => {
    try {
      const data = await storeFeaturesService.getStoreConfig(force);
      const nextSignature = configSignature(data);
      if (nextSignature !== signatureRef.current) {
        signatureRef.current = nextSignature;
        setConfig(data);
      }
    } catch (err) {
      console.error("Failed to load store features context:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();

    const interval = window.setInterval(() => {
      fetchConfig(true);
    }, REFRESH_INTERVAL_MS);

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        fetchConfig(true);
      }
    };

    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [fetchConfig]);

  const isModuleEnabled = useCallback(
    (moduleName) => {
      if (!moduleName || !config?.modules) return false;
      return Boolean(config.modules[moduleName]);
    },
    [config]
  );

  const isFeatureEnabled = useCallback(
    (featureName) => {
      if (!featureName) return false;
      if (config?.modules && featureName in config.modules) {
        return Boolean(config.modules[featureName]);
      }
      if (featureName === "prebooking" || featureName === "prebooking_deposits") {
        return Boolean(config?.modules?.prebooking_deposits);
      }
      if (featureName === "customization" || featureName === "product_customization") {
        return Boolean(config?.modules?.product_customization);
      }
      if (featureName === "reviews" || featureName === "product_reviews") {
        return Boolean(config?.modules?.product_reviews);
      }
      if (featureName === "home_collections" || featureName === "homeCollections") {
        return Boolean(config?.homeCollections ?? config?.modules?.home_collections ?? true);
      }
      if (featureName === "whatsapp_widget") {
        return Boolean(config?.whatsappWidget?.enabled);
      }
      if (featureName === "google_login") {
        return Boolean(config?.auth?.googleLoginEnabled);
      }
      if (featureName === "apple_login") {
        return Boolean(config?.auth?.appleLoginEnabled);
      }
      if (featureName === "wobcart_checkout") {
        return Boolean(config?.checkout?.wobcartCheckoutEnabled);
      }
      if (featureName === "cod") {
        return Boolean(config?.checkout?.codEnabled);
      }
      if (featureName === "razorpay") {
        return Boolean(config?.checkout?.razorpayEnabled);
      }
      return false;
    },
    [config]
  );

  const value = {
    config,
    modules: config?.modules || {},
    branding: config?.branding || {},
    contact: config?.contact || {},
    social: config?.social || {},
    whatsappWidget: config?.whatsappWidget || {},
    auth: config?.auth || {},
    checkout: config?.checkout || {},
    loading,
    refreshConfig: () => fetchConfig(true),
    isModuleEnabled,
    isFeatureEnabled,
  };

  return (
    <StoreConfigContext.Provider value={value}>
      {children}
    </StoreConfigContext.Provider>
  );
}

export function useStoreConfig() {
  const context = useContext(StoreConfigContext);
  if (!context) {
    const fallback = storeFeaturesService.getCachedConfig();
    return {
      config: fallback,
      modules: fallback.modules,
      branding: fallback.branding,
      contact: fallback.contact,
      social: fallback.social,
      whatsappWidget: fallback.whatsappWidget,
      auth: fallback.auth,
      checkout: fallback.checkout,
      loading: false,
      refreshConfig: () => Promise.resolve(),
      isModuleEnabled: (name) => Boolean(fallback.modules[name]),
      isFeatureEnabled: (name) => {
        if (name === "home_collections" || name === "homeCollections") {
          return Boolean(fallback.homeCollections ?? true);
        }
        return false;
      },
    };
  }
  return context;
}

export function FeatureGate({ module, feature, fallback = null, children }) {
  const { isModuleEnabled, isFeatureEnabled } = useStoreConfig();

  if (module && !isModuleEnabled(module)) {
    return fallback;
  }

  if (feature && !isFeatureEnabled(feature)) {
    return fallback;
  }

  return <>{children}</>;
}
