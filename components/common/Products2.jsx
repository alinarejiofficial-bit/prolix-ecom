"use client";
import ProductCard1 from "@/components/productCards/ProductCard1";
import React, { useEffect, useState } from "react";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { productService } from "@/services/productService";
import { ProductsSliderSkeleton } from "@/components/common/SectionSkeletons";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useWowRefresh } from "@/hooks/useWowRefresh";

export default function Products2({
  title = "Best Selling",
  parentClass = "",
  subtitle = "Shop our most popular products - customer favorites that keep selling out",
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1, rootMargin: "100px" });

  useEffect(() => {
    // Only fetch when section is visible
    if (!isVisible) return;

    const fetchBestSellingProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await productService.getBestSellingProducts(10);
        
        if (response.success && response.data?.items) {
          // Transform API data to match ProductCard1 format
          const transformedProducts = response.data.items.map((item) => {
            const sellingPrice = parseFloat(item.selling_price) || 0;
            const mrp = parseFloat(item.mrp) || 0;
            const offerPercentage = item.offer_percentage || 0;
            const variants = item.variants || [];
            const options = item.options || [];
            const defaultVariant = variants[0] || null;
            const hasVariants = variants.length > 1 || options.length > 0;
            return {
              id: item.uuid,
              uuid: item.uuid,
              title: item.name,
              price: sellingPrice,
              oldPrice: offerPercentage > 0 && mrp > sellingPrice ? mrp : null,
              imgSrc: item.thumbnail?.url || item.images?.[0]?.url || "/images/avatar/accessories.jpg",
              imgHover: item.images?.[0]?.url || item.thumbnail?.url || "/images/avatar/accessories.jpg",
              isOnSale: offerPercentage > 0,
              salePercentage: offerPercentage > 0 ? `${offerPercentage}%` : null,
              is_wishlisted: item.is_wishlisted || false,
              rating: item.rating || 0,
              inStock: defaultVariant ? (defaultVariant.stock_qty > 0) : false,
              apiProduct: item,
              variants,
              options,
              defaultVariant,
              hasVariants,
            };
          });
          
          setProducts(transformedProducts);
        }
      } catch (err) {
        console.error("Error fetching best selling products:", err);
        setError(err.message || "Failed to load products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellingProducts();
  }, [isVisible]);

  useWowRefresh(!loading && products.length > 0);

  if (loading) {
    return (
      <section ref={sectionRef} className={parentClass}>
        <ProductsSliderSkeleton title={title} parentClass="" />
      </section>
    );
  }

  if (error || products.length === 0) {
    return null;
  }

  if (products.length === 0) {
    return (
      <section ref={sectionRef} className={parentClass}>
        <div className="container">
          <div className="heading-section text-center wow fadeInUp">
            <h3 className="heading">{title}</h3>
            <p className="subheading text-secondary">
              {subtitle}
            </p>
          </div>
          <div className="text-center py-5">
            <p>No products available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className={parentClass}>
      <div className="container">
        <div className="heading-section text-center wow fadeInUp">
          <h3 className="heading">{title}</h3>
          <p className="subheading text-secondary">
            {subtitle}
          </p>
        </div>
        <Swiper
          className="swiper tf-sw-latest"
          dir="ltr"
          spaceBetween={15}
          breakpoints={{
            0: { slidesPerView: 2, spaceBetween: 15 },
            768: { slidesPerView: 3, spaceBetween: 30 },
            1200: { slidesPerView: 4, spaceBetween: 30 },
          }}
          modules={[Pagination]}
          pagination={{
            clickable: true,
            el: ".spd4",
          }}
        >
          {products.map((product) => (
            <SwiperSlide key={product.id} className="swiper-slide">
              <ProductCard1 product={product} hideAddToCart={false} />
            </SwiperSlide>
          ))}

          <div className="sw-pagination-latest spd4 sw-dots type-circle justify-content-center" />
        </Swiper>
      </div>
    </section>
  );
}
