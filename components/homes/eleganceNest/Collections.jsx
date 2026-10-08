"use client";
import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { useContextElement } from "@/context/Context";
import Image from "next/image";
import Link from "next/link";
import { Pagination } from "swiper/modules";
import { bannerService } from "@/services/bannerService";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import { useStoreConfig } from "@/context/StoreConfigContext";

export default function Collections() {
  const { isModuleEnabled } = useStoreConfig();
  const [promoCards, setPromoCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const cachedCards = bannerService.getCachedPromoCards();
    if (cachedCards && cachedCards.length > 0) {
      setPromoCards(cachedCards);
      setLoading(false);
    }

    const fetchPromoCards = async () => {
      try {
        const response = await bannerService.getHomePromoCards();
        if (isMounted && response?.success && Array.isArray(response?.data)) {
          // Sort by position to ensure correct order
          const sortedCards = [...response.data].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
          setPromoCards(sortedCards);
        } else if (isMounted && !cachedCards?.length) {
          setPromoCards([]);
        }
      } catch (err) {
        console.error("Error fetching promo cards:", err);
        if (isMounted) {
          setError(err.message);
          setPromoCards([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPromoCards();

    return () => {
      isMounted = false;
    };
  }, []);

  // Generate link based on category or product using Wobcart dynamic routes
  const getLink = (card) => {
    if (card?.category) {
      const categoryId = card.category.id || card.category.uuid || card.category.slug;
      return `/products/category/${categoryId}`;
    }
    if (card?.product) {
      const productId = card.product.uuid || card.product.id || card.product.slug;
      return `/product-detail/${productId}`;
    }
    return "/products";
  };

  // Format raw offer strings (e.g. "50 percentage off" -> "50% OFF")
  const formatOfferBadge = (text) => {
    if (!text) return null;
    const match = text.match(/(\d+)\s*(?:percentage|percent)?\s*(?:offer|off)?/i);
    if (match && match[1]) {
      return `${match[1]}% OFF`;
    }
    return text.toUpperCase();
  };

  // Convert strings to clean Title Case
  const formatTitle = (str) => {
    if (!str) return "";
    return str.replace(/\b\w+/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  };

  // Display data
  const displayData = promoCards;

  // Hide entire section if marketing is disabled or no collections available
  if (!isModuleEnabled("marketing") || (!loading && displayData.length === 0)) {
    return null;
  }

  return (
    <section className="home-section-spacing" aria-label="Curated Collections">
      <div className="container">
        {/* Section Heading matching store rhythm */}
        <div className="heading-section text-center mb-4 mb-md-5">
          <h3 className="heading">Explore More</h3>
          <p className="subheading text-secondary">
            Stylish Seating for Every Space
          </p>
        </div>

        <Swiper
          dir="ltr"
          spaceBetween={16}
          breakpoints={{
            0: { slidesPerView: 1.15, spaceBetween: 12 },
            668: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 24 },
          }}
          className="swiper tf-sw-collection sw-lookbook-wrap"
          modules={[Pagination]}
          pagination={{
            clickable: true,
            el: ".spd29",
          }}
        >
          {loading ? (
            // Loading skeleton slides
            [1, 2, 3].map((i) => (
              <SwiperSlide key={`skeleton-${i}`}>
                <div className="collection-position-3 rounded-4 overflow-hidden" style={{ aspectRatio: "3/4" }}>
                  <SkeletonLoader width="100%" height="100%" className="rounded-4" />
                </div>
              </SwiperSlide>
            ))
          ) : (
            displayData.map((item, i) => {
              const imageSrc = item.image || "/images/avatar/accessories.jpg";
              const title = formatTitle(item.title);
              const badge = formatOfferBadge(item.offer_text);
              const buttonText = formatTitle(item.button_text) || "Explore Collection";
              const link = getLink(item);
              const altText = item.title || "Curated Collection";

              return (
                <SwiperSlide key={item.uuid || i}>
                  <Link
                    href={link}
                    className="wc-lookbook-card wow fadeInUp"
                    data-wow-delay={`${i * 0.1}s`}
                  >
                    {/* Background Image Wrap */}
                    <div className="wc-lookbook-img-wrap">
                      <Image
                        src={imageSrc}
                        alt={altText}
                        width={600}
                        height={800}
                        unoptimized
                        onError={(e) => {
                          if (e.target.src.includes("banner-cls3.jpg") || e.target.src.includes("data:image")) {
                            e.target.style.display = "none";
                            return;
                          }
                          e.target.src = "/images/avatar/accessories.jpg";
                        }}
                      />
                    </div>

                    {/* Protective Gradient Overlay */}
                    <div className="wc-lookbook-gradient" />

                    {/* Top Badge (Clean formatted e.g. "50% OFF") */}
                    {badge && (
                      <div className="wc-lookbook-badge">
                        {badge}
                      </div>
                    )}

                    {/* Bottom Content Area */}
                    <div className="wc-lookbook-content">
                      <h4 className="wc-lookbook-title">
                        {title}
                      </h4>
                      <div className="wc-lookbook-btn">
                        <span>{buttonText}</span>
                        <span className="wc-lookbook-arrow">↗</span>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })
          )}
          {/* Pagination */}
          <div className="sw-pagination-collection sw-dots type-circle justify-content-center spd29 mt-4" />
        </Swiper>
      </div>
    </section>
  );
}
