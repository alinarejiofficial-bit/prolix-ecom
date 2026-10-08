"use client";

import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import Link from "next/link";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import { bannerService } from "@/services/bannerService";
import { useStoreConfig } from "@/context/StoreConfigContext";

export default function Hero() {
  const { isModuleEnabled } = useStoreConfig();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isModuleEnabled("content")) {
      setLoading(false);
      setBanners([]);
      return;
    }

    // Hydration complete: read cache immediately to avoid blank delay
    const cached = bannerService.getCachedBannerSliders();
    if (cached && cached.length > 0) {
      setBanners(cached);
      setLoading(false);
    }

    let cancelled = false;

    const fetchBanners = async () => {
      try {
        const response = await bannerService.getBannerSliders();
        if (cancelled) return;
        if (response.success && Array.isArray(response.data)) {
          setBanners(response.data);
          setError(null);
        } else if (!cached?.length) {
          setBanners([]);
          setError("Failed to load banners");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching banners:", err);
        if (!cached?.length) {
          setError(err.message || "Failed to load banners");
          setBanners([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBanners();
    return () => {
      cancelled = true;
    };
  }, [isModuleEnabled]);

  const getBannerLink = (banner) => {
    if (banner.link_type === "product" && banner.product) {
      return `/product-detail/${banner.product.uuid}`;
    }
    if (banner.link_type === "category" && banner.category?.id) {
      return `/products/category/${banner.category.id}`;
    }
    if (banner.link_type === "category") {
      return `/products`;
    }
    if (banner.link_type === "custom" && banner.custom_link) {
      return banner.custom_link;
    }
    return "/products";
  };

  // If content module is disabled, cleanly unmount
  if (!isModuleEnabled("content")) {
    return null;
  }

  // During cold first load before cache/network: render exact 16:9 frame matching hero dimensions and dark tone
  if (loading && banners.length === 0) {
    return (
      <section className="wc-hero">
        <div className="container">
          <div className="wc-hero-frame">
            <div className="wc-hero-skeleton" />
          </div>
        </div>
      </section>
    );
  }

  if (error && banners.length === 0) {
    return null;
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="wc-hero">
      <div className="container">
        <div className="wc-hero-frame">
          <Swiper
            dir="ltr"
            effect="fade"
            fadeEffect={{ crossFade: true }}
            speed={700}
            spaceBetween={0}
            slidesPerView={1}
            loop={banners.length > 1}
            autoplay={
              banners.length > 1
                ? { delay: 5200, disableOnInteraction: false }
                : false
            }
            modules={[Pagination, Autoplay, EffectFade]}
            pagination={{
              clickable: true,
              el: ".wc-hero-dots",
            }}
            className="wc-hero-swiper"
          >
            {banners.map((banner, index) => {
              const link = getBannerLink(banner);
              const isExternalLink =
                banner.link_type === "custom" &&
                banner.custom_link?.startsWith("http");
              const hasValidImage = banner.image && String(banner.image).trim() !== "";

              const image = hasValidImage ? (
                <Image
                  alt={banner.product?.name || banner.category?.name || "Banner"}
                  src={banner.image}
                  fill
                  sizes="(max-width: 1400px) 100vw, 1400px"
                  unoptimized={banner.image?.startsWith("http")}
                  className="wc-hero-image"
                  priority={index === 0}
                />
              ) : (
                <div className="wc-hero-fallback">Banner image unavailable</div>
              );

              return (
                <SwiperSlide key={banner.uuid || index}>
                  {isExternalLink ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wc-hero-slide"
                    >
                      {image}
                    </a>
                  ) : (
                    <Link href={link} className="wc-hero-slide">
                      {image}
                    </Link>
                  )}
                </SwiperSlide>
              );
            })}
          </Swiper>
          <div className="wc-hero-dots sw-dots type-circle justify-content-center" />
        </div>
      </div>
    </section>
  );
}
