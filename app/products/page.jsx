import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import Products15 from "@/components/products/Products15";
import CartTogglerSide from "@/components/common/CartTogglerSide";
import { ProductGridPageSkeleton } from "@/components/common/SectionSkeletons";
import React, { Suspense } from "react";

export const metadata = {
  title: "All Products - Prolix | Shop Our Complete Collection",
  description: "Browse our complete collection of products at Prolix. Discover fashion, lifestyle, and trending items. Shop by category, filter by price, and find your perfect style.",
  keywords: "products, shop, buy online, Prolix products, fashion products, lifestyle products, online shopping, product catalog",
};

export default function ProductsPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      
      <Suspense fallback={<ProductGridPageSkeleton />}>
        <Products15 parentClass="flat-spacing pt-4" infiniteScroll />
      </Suspense>
      <Footer1 />
      <CartTogglerSide />
    </>
  );
}

