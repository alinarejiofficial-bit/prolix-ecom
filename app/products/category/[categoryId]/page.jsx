import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import Products15 from "@/components/products/Products15";
import CartTogglerSide from "@/components/common/CartTogglerSide";
import { ProductGridPageSkeleton } from "@/components/common/SectionSkeletons";
import React, { Suspense } from "react";

export async function generateMetadata({ params }) {
  const { categoryId } = await params;
  return {
    title: `Category ${categoryId} - Prolix | Shop by Category`,
    description: `Browse products in this category at Prolix. Filter by price, sort, and find what you need.`,
    keywords: "products, category, shop, Prolix, online shopping",
  };
}

export default async function ProductsCategoryPage({ params }) {
  const { categoryId } = await params;

  return (
    <>
      <Topbar6 bgColor="bg-main" />
      <Header1 />
      
      <Suspense fallback={<ProductGridPageSkeleton />}>
        <Products15 categoryIdFromPath={categoryId} parentClass="flat-spacing pt-4" infiniteScroll />
      </Suspense>
      <Footer1 />
      <CartTogglerSide />
    </>
  );
}
