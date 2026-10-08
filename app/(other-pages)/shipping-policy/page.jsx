import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import ShippingPolicy from "@/components/otherPages/ShippingPolicy";
import React from "react";

export const metadata = {
  title: "Shipping Policy - Prolix | Delivery Information & Rates",
  description: "Learn about Prolix's shipping policy, delivery times, shipping rates, and tracking information. Fast and reliable shipping options available for all orders.",
  keywords: "shipping policy, delivery, shipping rates, delivery times, shipping information, free shipping, Prolix shipping",
};

export default function ShippingPolicyPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      
      <ShippingPolicy />
      <Footer1 />
    </>
  );
}

