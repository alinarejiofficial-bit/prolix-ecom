"use client";
import ProductCard1 from "@/components/productCards/ProductCard1";
import React, { useEffect, useState } from "react";
import { productService } from "@/services/productService";
import { ProductsSliderSkeleton } from "@/components/common/SectionSkeletons";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useWowRefresh } from "@/hooks/useWowRefresh";

export default function Products4({ parentClass = "" }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1, rootMargin: "100px" });

  useEffect(() => {
    // Only fetch when section is visible
    if (!isVisible) return;

    const fetchRecentProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await productService.getRecentProducts(20);
        
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
        console.error("Error fetching recent products:", err);
        setError(err.message || "Failed to load products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentProducts();
  }, [isVisible]);

  useWowRefresh(!loading && products.length > 0);

  if (loading) {
    return (
      <section ref={sectionRef} className={parentClass}>
        <ProductsSliderSkeleton title="New arrivals" parentClass="" />
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
            <h3 className="heading">Redefining Comfort &amp; Style</h3>
            <p className="subheading text-secondary">
              Premium Seating Solutions
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
          <h3 className="heading">Redefining Comfort &amp; Style</h3>
          <p className="subheading text-secondary">
            Premium Seating Solutions
          </p>
        </div>
        <div className="tf-grid-layout tf-col-2 lg-col-3 xl-col-4">
          {products.map((product) => (
            <ProductCard1 key={product.id} product={product} hideAddToCart={false} />
          ))}
        </div>
      </div>
    </section>
  );
}
