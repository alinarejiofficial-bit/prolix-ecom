"use client";

import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import Descriptions1 from "@/components/productDetails/descriptions/Descriptions1";
import Details1 from "@/components/productDetails/details/Details1";
import RelatedProducts from "@/components/productDetails/RelatedProducts";
import ProductDetailSkeleton from "@/components/productDetails/ProductDetailSkeleton";
import { productService } from "@/services/productService";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await productService.getProductByUuid(id);
        
        if (response.success && response.data) {
          // Map API product to component format
          const apiProduct = response.data;
          const firstVariant = apiProduct.variants && apiProduct.variants.length > 0 
            ? apiProduct.variants[0] 
            : {};
          
          const mappedProduct = {
            id: apiProduct.uuid,
            uuid: apiProduct.uuid,
            title: apiProduct.name,
            name: apiProduct.name,
            description: apiProduct.description || "",
            price: parseFloat(apiProduct.selling_price) || 0,
            oldPrice: parseFloat(apiProduct.mrp) > parseFloat(apiProduct.selling_price) 
              ? parseFloat(apiProduct.mrp) 
              : null,
            imgSrc: apiProduct.thumbnail?.url ?? apiProduct.thumbnail ?? (apiProduct.images?.[0]?.url) ?? "/images/avatar/accessories.jpg",
            images: apiProduct.images || [],
            category: apiProduct.category,
            rating: apiProduct.rating || 0,
            ratingsSummary: apiProduct.ratings_summary,
            ratings: apiProduct.ratings || [],
            // API product data for variant handling
            apiProduct: apiProduct,
            options: apiProduct.options || [],
            variants: apiProduct.variants || [],
            // Default variant
            selectedVariant: firstVariant,
          };
          
          setProduct(mappedProduct);
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <>
        <Topbar6 bgColor="bg-main" />
        <Header1 />
        <ProductDetailSkeleton />
        <Footer1 hasPaddingBottom />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Topbar6 bgColor="bg-main" />
        <Header1 />
        <div className="container py-5">
          <div className="alert alert-danger" role="alert">
            {error || "Product not found"}
          </div>
        </div>
        <Footer1 hasPaddingBottom />
      </>
    );
  }

  return (
    <>
      <Topbar6 bgColor="bg-main" />
      <Header1 />
      <Details1 product={product} />
      <Descriptions1 product={product} />
      <RelatedProducts productId={product.uuid || product.id} />
      <Footer1 hasPaddingBottom />
    </>
  );
}
