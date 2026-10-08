import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import Wishlist from "@/components/otherPages/Wishlist";
import React from "react";

export const metadata = {
  title: "Wishlist - Prolix | Save Your Favorite Products",
  description: "View and manage your Prolix wishlist. Save your favorite products for later, share with friends, and get notified when items go on sale.",
  keywords: "wishlist, saved items, favorite products, wish list, save for later, Prolix wishlist, product wishlist",
};

export default function WishListPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      
      <Wishlist />

      <Footer1 />
    </>
  );
}
