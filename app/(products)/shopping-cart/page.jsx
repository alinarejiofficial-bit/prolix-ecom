import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import ShopCart from "@/components/otherPages/ShopCart";
import React from "react";

export const metadata = {
  title: "Shopping Cart - Prolix | Review Your Items",
  description: "Review items in your shopping cart at Prolix. Manage quantities, apply discount codes, and proceed to secure checkout. Fast and secure online shopping experience.",
  keywords: "shopping cart, cart, checkout, Prolix cart, review items, online shopping cart, secure checkout",
};

export default function ShopingCartPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      
      <ShopCart />
      <Footer1 />
    </>
  );
}
