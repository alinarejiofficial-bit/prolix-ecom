"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { productService } from "@/services/productService";
import { resolveMediaUrl, PLACEHOLDER_IMAGE } from "@/utils/productImages";

const INDIAN_CITIES = [
  "Kochi",
  "Bengaluru",
  "Mumbai",
  "Delhi",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Ahmedabad",
  "Kolkata",
  "Jaipur",
  "Calicut",
  "Trivandrum",
  "Coimbatore",
  "Chandigarh",
  "Lucknow",
];

const TIME_AGO = ["just now", "2 mins ago", "5 mins ago", "12 mins ago", "18 mins ago", "24 mins ago"];

export default function RecentPurchasesToast() {
  const { isModuleEnabled } = useStoreConfig();
  const [products, setProducts] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const timerRef = useRef(null);
  const hideTimerRef = useRef(null);

  // Controlled by the Marketing module in Wobcart Cloud
  const isMarketingActive = isModuleEnabled("marketing");

  useEffect(() => {
    try {
      if (sessionStorage.getItem("wc_hide_sales_toast") === "true") {
        setIsDismissed(true);
      }
    } catch (_) {}
  }, []);

  // Fetch real store products to display in the social proof toast
  useEffect(() => {
    if (!isMarketingActive || isDismissed) return;

    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const response = await productService.getProducts({ per_page: 8 });
        if (!isMounted) return;
        if (response?.success && Array.isArray(response?.data) && response.data.length > 0) {
          setProducts(response.data);
        }
      } catch (_) {}
    };

    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, [isMarketingActive, isDismissed]);

  // Periodic notification loop
  useEffect(() => {
    if (!isMarketingActive || isDismissed || products.length === 0) return;

    const showRandomPurchase = () => {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const randomCity = INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)];
      const randomTime = TIME_AGO[Math.floor(Math.random() * TIME_AGO.length)];

      const image =
        resolveMediaUrl(randomProduct?.thumbnail) ||
        resolveMediaUrl(randomProduct?.images?.[0]) ||
        PLACEHOLDER_IMAGE;

      setCurrentNotification({
        title: randomProduct?.name || "Popular Item",
        city: randomCity,
        time: randomTime,
        image,
        link: randomProduct?.uuid ? `/product-detail/${randomProduct.uuid}` : "/products",
      });
      setIsVisible(true);

      // Hide after 6 seconds
      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 6000);
    };

    // First trigger after 12s, then every 35s
    const initialDelay = setTimeout(() => {
      showRandomPurchase();
      timerRef.current = setInterval(showRandomPurchase, 35000);
    }, 12000);

    return () => {
      clearTimeout(initialDelay);
      if (timerRef.current) clearInterval(timerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isMarketingActive, isDismissed, products]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    try {
      sessionStorage.setItem("wc_hide_sales_toast", "true");
    } catch (_) {}
  };

  if (!isMarketingActive || isDismissed || !currentNotification) {
    return null;
  }

  return (
    <aside
      aria-label="Recent purchase notification"
      className={`wc-sales-toast ${isVisible ? "is-visible" : ""}`}
    >
      <Link href={currentNotification.link} className="wc-sales-toast-link">
        <div className="wc-sales-toast-img">
          <Image
            src={currentNotification.image}
            alt={currentNotification.title}
            width={48}
            height={48}
            unoptimized
          />
        </div>
        <div className="wc-sales-toast-info">
          <span className="wc-sales-toast-activity">
            Someone in <strong>{currentNotification.city}</strong> purchased
          </span>
          <p className="wc-sales-toast-title">{currentNotification.title}</p>
          <span className="wc-sales-toast-time">{currentNotification.time} • Verified order</span>
        </div>
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        className="wc-sales-toast-close"
        aria-label="Dismiss notification"
      >
        &times;
      </button>
    </aside>
  );
}
