import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import Collections from "@/components/products/Collections";
import FeaturePageGuard from "@/components/common/FeaturePageGuard";
import React from "react";

export const metadata = {
  title: "Shop by Category - Prolix | Browse Product Collections",
  description: "Explore our product categories and collections at Prolix. Find the perfect items by browsing through our curated collections. Shop by category for easy navigation.",
  keywords: "categories, collections, shop by category, product categories, browse collections, Prolix categories",
};

export default function ShopCollectionPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      <FeaturePageGuard module="content">
        <Collections parentClass="py-4 py-md-5" />
      </FeaturePageGuard>
      <Footer1 />
    </>
  );
}
