"use client";
import { slides } from "@/data/singleProductSliders";
import Drift from "drift-zoom";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import { useEffect, useRef, useState, useMemo } from "react";
import { Navigation, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";

const PLACEHOLDER_IMAGE = "/images/avatar/accessories.jpg";

export default function Slider1({
  activeColor = "gray",
  setActiveColor = () => {},
  firstItem,
  slideItems = slides,
  thumbSlidePerView = 6,
  thumbSlidePerViewOnMobile = 6,
}) {
  // Update items when slideItems or firstItem changes; ensure valid src
  const items = useMemo(() => {
    const slideList = [...slideItems];
    if (firstItem && slideList.length > 0) {
      slideList[0].src = (firstItem && firstItem.trim()) ? firstItem : PLACEHOLDER_IMAGE;
    }
    return slideList.map((s) => ({
      ...s,
      src: (s.src && s.src.trim()) ? s.src : PLACEHOLDER_IMAGE,
    }));
  }, [slideItems, firstItem]);

  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef(null);
  const lightboxRef = useRef(null);

  // Initialize Drift zoom (desktop only)
  useEffect(() => {
    const initializeZoom = () => {
      const driftAll = document.querySelectorAll(".tf-image-zoom");
      const pane = document.querySelector(".tf-zoom-main");

      if (!pane) return;

      driftAll.forEach((el) => {
        try {
          new Drift(el, {
            zoomFactor: 2,
            paneContainer: pane,
            inlinePane: false,
            handleTouch: false, // Disable touch for mobile
            hoverBoundingBox: true,
            containInline: true,
          });
        } catch (error) {
          console.warn("Drift zoom error:", error);
        }
      });
    };

    // Only initialize on desktop
    if (window.innerWidth > 991) {
      const timer = setTimeout(initializeZoom, 100);
      return () => clearTimeout(timer);
    }
  }, [items]);

  // Initialize PhotoSwipe Lightbox
  useEffect(() => {
    // Destroy existing lightbox if it exists
    if (lightboxRef.current) {
      lightboxRef.current.destroy();
      lightboxRef.current = null;
    }

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      const lightbox = new PhotoSwipeLightbox({
        gallery: "#gallery-swiper-started",
        children: "a.pswp-item",
        pswpModule: () => import("photoswipe"),
      });

      lightbox.init();
      lightboxRef.current = lightbox;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (lightboxRef.current) {
        lightboxRef.current.destroy();
        lightboxRef.current = null;
      }
    };
  }, [items]); // Re-initialize when items change

  // Update slider when variant changes
  useEffect(() => {
    if (swiperRef.current && items.length > 0) {
      swiperRef.current.slideTo(0);
      setActiveIndex(0);
    }
  }, [firstItem, slideItems.length]);

  // Handle color change
  useEffect(() => {
    if (swiperRef.current && items.length > 0) {
      const matchingIndex = items.findIndex(
        (elm) => elm.color?.toLowerCase() === activeColor?.toLowerCase()
      );
      if (matchingIndex >= 0 && matchingIndex !== activeIndex) {
        swiperRef.current.slideTo(matchingIndex);
      }
    }
  }, [activeColor, items, activeIndex]);

  // Handle slide change
  const handleSlideChange = (swiper) => {
    const newIndex = swiper.activeIndex;
    setActiveIndex(newIndex);
    if (items[newIndex]?.color) {
      setActiveColor(items[newIndex].color.toLowerCase());
    }
  };


  return (
    <div className="thumbs-slider custom-product-slider" style={{ position: 'relative' }}>
      {/* Thumbnail Swiper */}
      <Swiper
        className="swiper tf-product-media-thumbs other-image-zoom"
        dir="ltr"
        direction="vertical"
        spaceBetween={10}
        slidesPerView={thumbSlidePerView}
        onSwiper={setThumbsSwiper}
        modules={[Thumbs]}
        breakpoints={{
          0: {
            direction: "horizontal",
            slidesPerView: thumbSlidePerViewOnMobile,
            spaceBetween: 8,
          },
          1200: {
            direction: "vertical",
            slidesPerView: thumbSlidePerView,
            spaceBetween: 10,
          },
        }}
      >
        {items.map((slide, index) => (
          <SwiperSlide
            className="swiper-slide stagger-item"
            data-color={slide.color}
            key={index}
          >
            <div className="item" onClick={() => swiperRef.current?.slideTo(index)}>
              <Image
                className="lazyload"
                data-src={slide.src}
                alt={slide.alt || `Thumbnail ${index + 1}`}
                src={slide.src}
                width={slide.width || 100}
                height={slide.height || 133}
                onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Main Image Swiper */}
      <Swiper
        dir="ltr"
        className="swiper tf-product-media-main"
        id="gallery-swiper-started"
        spaceBetween={0}
        slidesPerView={1}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        modules={[Thumbs]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={handleSlideChange}
        // Mobile-friendly settings - allow vertical scrolling
        allowTouchMove={true}
        touchRatio={1}
        threshold={15}
        longSwipesRatio={0.5}
        followFinger={true}
        // Allow clicks to work properly
        preventClicks={false}
        preventClicksPropagation={false}
        // Only capture horizontal swipes, allow vertical scrolling
        touchAngle={45}
        resistance={true}
        resistanceRatio={0.85}
        // Critical: Only prevent default on horizontal swipes
        touchStartPreventDefault={false}
        touchMoveStopPropagation={false}
        simulateTouch={true}
        // Allow vertical scrolling to pass through
        allowSlidePrev={true}
        allowSlideNext={true}
      >
        {items.map((slide, index) => (
          <SwiperSlide key={index} className="swiper-slide" data-color="gray">
            <a
              href={slide.src}
              className="item pswp-item"
              data-pswp-width={slide.width || 1200}
              data-pswp-height={slide.height || 1600}
              onClick={(e) => {
                // Prevent default to allow PhotoSwipe to handle it
                e.preventDefault();
                // PhotoSwipe will automatically open on click
              }}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              <Image
                className="tf-image-zoom lazyload product-main-image"
                data-zoom={slide.src}
                data-src={slide.src}
                alt={slide.alt || `Product image ${index + 1}`}
                src={slide.src}
                width={slide.width || 600}
                height={slide.height || 800}
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                style={{
                  pointerEvents: "none", // Let the anchor handle clicks
                }}
              />
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
