import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import Products15 from "@/components/products/Products15";
import { ProductGridPageSkeleton } from "@/components/common/SectionSkeletons";
import React, { Suspense } from "react";

export const metadata = {
  title: "Shop All Products - Prolix | Infinite Scroll Collection",
  description: "Browse our complete product collection with infinite scroll at Prolix. Discover fashion, lifestyle, and trending products. Easy browsing experience with continuous loading.",
  keywords: "shop products, infinite scroll, all products, browse products, product catalog, Prolix shop, online store",
};

export default function ShopInfinateScrollingPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      
      <Suspense fallback={<ProductGridPageSkeleton />}>
        <Products15 parentClass="flat-spacing pt-4" />
      </Suspense>
      <Footer1 />
    </>
  );
}
