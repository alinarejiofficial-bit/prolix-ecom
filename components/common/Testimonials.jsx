"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import { Pagination, Autoplay } from "swiper/modules";
import { apiRequest } from "@/utils/apiConfig";
import { TestimonialsSkeleton } from "@/components/common/SectionSkeletons";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useStoreConfig } from "@/context/StoreConfigContext";

const TESTIMONIALS_ENDPOINT = "/customer/testimonials?limit=10";

export default function Testimonials({ parentClass = "flat-spacing" }) {
  const { isModuleEnabled } = useStoreConfig();
  const [testimonials, setTestimonials] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1, rootMargin: "100px" });

  // Testimonials in Wobcart are managed under the "content" module in tenant admin settings
  const contentEnabled = isModuleEnabled("content");

  useEffect(() => {
    let isMounted = true;

    async function loadTestimonials() {
      if (!contentEnabled) {
        setStatus("idle");
        setTestimonials([]);
        return;
      }

      setStatus("loading");

      try {
        const payload = await apiRequest(TESTIMONIALS_ENDPOINT);

        if (!payload?.success || !Array.isArray(payload?.data)) {
          throw new Error("Unexpected response format");
        }

        if (isMounted) {
          setTestimonials(payload.data);
          setStatus("success");
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load testimonials:", err);
          setStatus("error");
          setTestimonials([]);
        }
      }
    }

    loadTestimonials();

    return () => {
      isMounted = false;
    };
  }, [contentEnabled]);

  const slides = useMemo(() => testimonials.filter(Boolean), [testimonials]);

  const renderStars = (rating) => {
    const maxStars = 5;
    const safeRating =
      typeof rating === "number" && rating > 0
        ? Math.min(Math.round(rating), maxStars)
        : 5;

    return (
      <div className="d-flex align-items-center gap-1">
        {Array.from({ length: maxStars }).map((_, index) => (
          <i
            key={index}
            className="icon icon-star"
            style={{
              color: index < safeRating ? "#f59e0b" : "#d1d5db",
              fontSize: "16px",
            }}
          />
        ))}
      </div>
    );
  };

  const renderAvatar = (testimonial) => {
    if (testimonial?.image) {
      return (
        <Image
          alt={testimonial.customer_name || "Customer avatar"}
          src={testimonial.image}
          width={80}
          height={80}
          unoptimized
        />
      );
    }

    const initial =
      testimonial?.customer_name?.trim()?.charAt(0)?.toUpperCase() ?? "C";

    return (
      <div
        className="d-flex align-items-center justify-content-center bg-dark text-white rounded-circle w-100 h-100 fw-bold"
        style={{ fontSize: "16px" }}
      >
        {initial}
      </div>
    );
  };

  // Turn ON / OFF: Hide section completely if content module is disabled in tenant store settings
  if (!contentEnabled) {
    return null;
  }

  // Show skeleton loader while loading
  if (status === "loading") {
    return (
      <section ref={sectionRef} className={parentClass}>
        <TestimonialsSkeleton />
      </section>
    );
  }

  // Hide section on error or if there are no reviews in the backend
  if (status === "error" || (status === "success" && slides.length === 0)) {
    return null;
  }

  // Always use Swiper – even for 1 or 2 reviews, loop keeps it consistent as a slider on desktop
  return (
    <section ref={sectionRef} className={parentClass} aria-label="Customer Reviews">
      <div className="container">
        <div className="heading-section text-center mb-4">
          <h3 className="heading">What Our Customers Say</h3>
          <p className="subheading text-muted">
            Choose Prolix Chairs &amp; Seatings – Where Comfort Meets Style!
          </p>
        </div>

        <Swiper
          modules={[Pagination, Autoplay]}
          loop={slides.length > 3}
          centeredSlides={false}
          autoplay={
            slides.length > 3
              ? { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }
              : false
          }
          pagination={{
            clickable: true,
            el: ".wc-testimonial-dots",
          }}
          breakpoints={{
            0: {
              slidesPerView: 1,
              spaceBetween: 16,
            },
            768: {
              slidesPerView: Math.min(slides.length, 2),
              spaceBetween: 24,
            },
            1024: {
              slidesPerView: Math.min(slides.length, 3),
              spaceBetween: 24,
            },
          }}
          className="tf-sw-testimonial"
        >
          {slides.map((testimonial, index) => (
            <SwiperSlide key={`${testimonial.customer_name}-${index}`}>
              <div className="wc-testimonial-card">
                <div className="wc-testimonial-body">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      {renderStars(testimonial.rating)}
                    </div>
                    <span className="wc-spotlight-verified">
                      <svg viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                      </svg>
                      <span>Verified</span>
                    </span>
                  </div>
                  <p className="text-secondary mb-3" style={{ fontSize: "14px", lineHeight: "1.6" }}>
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                </div>

                <div className="wc-testimonial-footer">
                  <div className="wc-spotlight-avatar">
                    {renderAvatar(testimonial)}
                  </div>
                  <div>
                    <div className="fw-7 text-dark" style={{ fontSize: "15px" }}>
                      {testimonial.customer_name || "Happy Customer"}
                    </div>
                    {typeof testimonial.rating === "number" && (
                      <div className="text-muted" style={{ fontSize: "12px" }}>
                        {`${testimonial.rating.toFixed(1)} / 5.0 Rating`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Pagination dots (shown when multiple pages of reviews exist) */}
        {slides.length > 3 && (
          <div className="wc-testimonial-dots sw-dots type-circle d-flex justify-content-center mt-4" />
        )}
      </div>
    </section>
  );
}
