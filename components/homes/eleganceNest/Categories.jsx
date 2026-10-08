"use client";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, API_CONFIG } from "@/utils/apiConfig";
import { CategoriesSkeleton } from "@/components/common/SectionSkeletons";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1, rootMargin: "100px" });

  useEffect(() => {
    // Only fetch when section is visible
    if (!isVisible) return;

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await apiRequest(API_CONFIG.ENDPOINTS.CATEGORIES, {
          method: "GET",
        });

        if (response.success && response.data) {
          setCategories(response.data);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err.message);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [isVisible]);

  // Map API categories to component format
  const mappedCategories = categories.map((category) => ({
    imgSrc: category.image || "/images/collections/cls1.jpg",
    alt: category.name || "category",
    text: category.name || "",
    slug: category.slug || "",
    id: category.id || category.uuid,
    children_count: category.children_count || 0,
  }));

  if (loading) {
    return (
      <section ref={sectionRef} className="flat-spacing">
        <CategoriesSkeleton />
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="flat-spacing">
      <div className="container">
        <div className="heading-section-2 wow fadeInUp">
          <h3 className="heading">Explore Collections</h3>
          <Link href={`/shop-collection`} className="btn-line">
            View All Collection
          </Link>
        </div>
      </div>
      <div
        className="container-full slider-layout-right wow fadeInUp"
        data-wow-delay="0.1s"
      >
        <Swiper
            dir="ltr"
            spaceBetween={15}
            breakpoints={{
              0: { slidesPerView: 2.2, spaceBetween: 15 },
              568: { slidesPerView: 3.2, spaceBetween: 20 },
              968: { slidesPerView: 4.2, spaceBetween: 20 },
              1224: { slidesPerView: 6.2, spaceBetween: 20 },
            }}
            pagination={{
              clickable: true,
            }}
          >
            {mappedCategories.length > 0 ? mappedCategories.map((slide, index) => {
              // Generate link to products page with category
              const categoryLink = slide.id 
                ? `/products/category/${slide.id}` 
                : `/products`;
              
              return (
                <SwiperSlide key={slide.id || index}>
                  <Link href={categoryLink} className="collection-position-2 hover-img" style={{ display: 'block', textDecoration: 'none' }}>
                    <div className="img-style">
                      <Image
                        className="lazyload"
                        data-src={slide.imgSrc}
                        alt={slide.alt}
                        src={slide.imgSrc}
                        width={363}
                        height={483}
                        onError={(e) => {
                          e.target.src = "/images/collections/cls1.jpg";
                        }}
                      />
                    </div>
                    <div className="content">
                      <div className="cls-btn">
                        <h6 className="text">{slide.text}</h6>
                        <i className="icon icon-arrowUpRight" />
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            }) : (
              <div className="text-center py-5">
                <p className="text-muted">No categories available</p>
              </div>
            )}
          </Swiper>
        {error && (
          <div className="text-center py-2 text-danger">
            <small>Error loading categories: {error}</small>
          </div>
        )}
      </div>
    </section>
  );
}
