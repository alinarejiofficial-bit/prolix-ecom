"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import { categoryService } from "@/services/categoryService";
import { useStoreConfig } from "@/context/StoreConfigContext";

const PLACEHOLDER = "/images/avatar/accessories.jpg";

export default function HomeCategories({ parentClass = "" }) {
  const { isModuleEnabled, isFeatureEnabled } = useStoreConfig();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isEnabled = isModuleEnabled("content") && isFeatureEnabled("home_collections");

  useEffect(() => {
    if (!isEnabled) return;
    let isMounted = true;

    // Pick up cached categories immediately on client mount
    const cachedData = categoryService.getCachedCategories();
    if (cachedData && cachedData.length > 0) {
      setCategories(cachedData);
      setLoading(false);
    }

    const fetchCategories = async () => {
      try {
        setError(null);
        const response = await categoryService.getCategories(1, 20);
        if (isMounted) {
          if (response?.success && Array.isArray(response?.data)) {
            setCategories(response.data);
          } else if (!cachedData?.length) {
            setCategories([]);
          }
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        if (isMounted) {
          setError(err?.message || "Failed to load categories");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [isEnabled]);

  // If content module or feature is disabled from admin, completely unmount (zero pieces lay outside)
  if (!isEnabled) {
    return null;
  }

  // If error or categories finished loading with zero results, unmount cleanly
  if (!loading && (error || categories.length === 0)) {
    return null;
  }

  return (
    <section className={`${parentClass} wc-editorial-section`.trim()}>
      <div className="container">
        {/* Section Heading: Always present and stable, zero flashing or gray placeholder replacement */}
        <div className="heading-section text-center mb-4 mb-md-5">
          <h3 className="heading">Discover Our Chair Categories</h3>
          <p className="subheading text-secondary">
            Authorized Nilkamal Distributor – Bringing India&apos;s Favorite Furniture to You
          </p>
        </div>

        {loading && categories.length === 0 ? (
          /* Seamless placeholder cards matching exact dimensions of the category cards */
          <div className="wc-editorial-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="wc-editorial-card">
                <div
<<<<<<< HEAD
                  className="wc-editorial-media wc-editorial-media--round"
                  style={{ background: "#f1f2f4" }}
=======
                  className="wc-editorial-media"
                  style={{
                    aspectRatio: "3/4",
                    borderRadius: "14px",
                    overflow: "hidden",
                    background: "#f1f2f4",
                  }}
>>>>>>> f260a2e71f33901e474030a5b50a22a246f5fadd
                />
                <div className="wc-editorial-meta">
                  <span
                    className="wc-editorial-num"
                    style={{ background: "#e8eaed", color: "transparent" }}
                  >
                    00
                  </span>
                  <div
                    style={{
                      width: "80px",
                      height: "14px",
                      background: "#e8eaed",
                      borderRadius: "3px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="tf-sw-categories-wrap position-relative">
            <Swiper
              className="swiper tf-sw-categories"
              dir="ltr"
              spaceBetween={16}
              breakpoints={{
                0: { slidesPerView: 2, spaceBetween: 12 },
                640: { slidesPerView: 2.5, spaceBetween: 16 },
                768: { slidesPerView: 3, spaceBetween: 16 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
              }}
              modules={[Pagination, Navigation]}
              pagination={{
                clickable: true,
                el: ".spd-categories",
              }}
              navigation={{
                prevEl: ".snbp-categories-prev",
                nextEl: ".snbp-categories-next",
              }}
            >
              {categories.map((category, index) => {
                const categoryLink = `/products/category/${category.id}`;
                const src = category.image || PLACEHOLDER;
                const formattedIndex = String(index + 1).padStart(2, "0");

                return (
                  <SwiperSlide key={category.id || category.uuid || index}>
                    <Link
                      href={categoryLink}
                      className="wc-editorial-card"
                    >
<<<<<<< HEAD
                      <div className="wc-editorial-media wc-editorial-media--round">
=======
                      <div className="wc-editorial-media">
>>>>>>> f260a2e71f33901e474030a5b50a22a246f5fadd
                        <Image
                          className="wc-editorial-img"
                          src={src}
                          alt={category.name || "Collection"}
                          width={600}
                          height={800}
                          unoptimized
                          onError={(e) => {
                            e.target.src = PLACEHOLDER;
                          }}
                        />
                      </div>
                      <div className="wc-editorial-meta">
                        <span className="wc-editorial-num">{formattedIndex}</span>
                        <div className="wc-editorial-name-wrap">
                          <span className="wc-editorial-name">
                            {category.name}
                          </span>
                          <span className="wc-editorial-arrow">↗</span>
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
                );
              })}

              <div className="sw-pagination-categories spd-categories sw-dots type-circle justify-content-center mt-4" />
            </Swiper>

            {/* Navigation Arrows (auto-lock when 4 or fewer slides on desktop) */}
            <div
              className="nav-prev-slider nav-sw nav-sw-left snbp-categories-prev"
              aria-label="Previous categories"
            >
              <i className="icon icon-arrow-left" />
            </div>
            <div
              className="nav-next-slider nav-sw nav-sw-right snbp-categories-next"
              aria-label="Next categories"
            >
              <i className="icon icon-arrow-right" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
