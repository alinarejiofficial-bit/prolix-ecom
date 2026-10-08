"use client";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { products } from "@/data/products";
import ProductCard1 from "../productCards/ProductCard1";
import { productService } from "@/services/productService";
import { ProductsSliderSkeleton } from "@/components/common/SectionSkeletons";

export default function RelatedProducts({ productId }) {
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (!productId) {
        // Fallback to static data if no productId provided
        setSimilarProducts(products.slice(0, 4));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await productService.getSimilarProducts(productId);

        if (response.success && response.data && response.data.items) {
          // Map API products to component format
          const mappedProducts = response.data.items.map((apiProduct) => {
            const firstVariant = apiProduct.variants && apiProduct.variants.length > 0 
              ? apiProduct.variants[0] 
              : null;

            // Get color options for color swatches
            const colorOption = apiProduct.options?.find(opt => 
              opt.name.toLowerCase() === 'color'
            );
            const colors = colorOption?.values?.map((color, index) => {
              // Find variant with this color
              const variantWithColor = apiProduct.variants?.find(v => {
                const variantColor = v.options?.Color || v.options?.color;
                return variantColor === color;
              });
              
              return {
                bgColor: color.toLowerCase().replace(/\s+/g, '-'),
                imgSrc: variantWithColor?.image || apiProduct.thumbnail?.url || apiProduct.images?.[0]?.url || "/images/avatar/accessories.jpg",
              };
            }) || [];

            // Determine if product is on sale
            const mrp = parseFloat(apiProduct.mrp) || 0;
            const sellingPrice = parseFloat(apiProduct.selling_price) || 0;
            const isOnSale = mrp > sellingPrice;
            const salePercentage = apiProduct.offer_percentage 
              ? Math.round(apiProduct.offer_percentage)
              : (isOnSale ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0);

            return {
              id: apiProduct.uuid,
              uuid: apiProduct.uuid,
              title: apiProduct.name,
              name: apiProduct.name,
              description: apiProduct.description || "",
              price: sellingPrice,
              oldPrice: isOnSale ? mrp : null,
              imgSrc: apiProduct.thumbnail?.url || (apiProduct.images?.[0]?.url) || "/images/avatar/accessories.jpg",
              imgHover: apiProduct.images?.[1]?.url || apiProduct.thumbnail?.url || "/images/avatar/accessories.jpg",
              category: apiProduct.category,
              rating: apiProduct.rating || 0,
              isOnSale: isOnSale,
              salePercentage: salePercentage,
              hotSale: salePercentage >= 25, // Show hot sale banner if 25% or more discount
              colors: colors.length > 0 ? colors : undefined,
              sizes: apiProduct.options?.find(opt => opt.name.toLowerCase() === 'size')?.values || undefined,
              // API product data for variant handling
              apiProduct: apiProduct,
              options: apiProduct.options || [],
              variants: apiProduct.variants || [],
            };
          });

          setSimilarProducts(mappedProducts);
        } else {
          // Fallback to static data if API returns no products
          setSimilarProducts(products.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching similar products:', err);
        setError(err.message || 'Failed to fetch similar products');
        // Fallback to static data on error
        setSimilarProducts(products.slice(0, 4));
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarProducts();
  }, [productId]);

  if (loading) {
    return <ProductsSliderSkeleton title="You Might Like" />;
  }

  if (error && similarProducts.length === 0) {
    return null; // Don't show section if there's an error and no fallback products
  }

  if (similarProducts.length === 0) {
    return null; // Don't show section if no products
  }

  return (
    <section className="flat-spacing">
      <div className="container">
        <div className="heading-section text-center">
          <h2 className="heading wow fadeInUp" data-wow-delay="0s">
            You Might Like
          </h2>
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
          {similarProducts.map((product, i) => (
            <SwiperSlide key={product.id || product.uuid || i} className="swiper-slide">
              <ProductCard1 product={product} />
            </SwiperSlide>
          ))}

          <div className="sw-pagination-latest spd4  sw-dots type-circle justify-content-center" />
        </Swiper>
      </div>
    </section>
  );
}
