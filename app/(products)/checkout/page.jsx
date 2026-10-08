import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import WobcartCheckoutLauncher from "@/components/otherPages/WobcartCheckoutLauncher";
import { CheckoutPageSkeleton } from "@/components/common/SectionSkeletons";
import React, { Suspense } from "react";

export const metadata = {
  title: "Checkout - Prolix | Secure Payment & Fast Delivery",
  description: "Complete your purchase securely at Prolix. Fast and secure checkout process with multiple payment options. Free shipping available on eligible orders.",
  keywords: "checkout, secure payment, online payment, buy now, secure checkout, payment gateway, Prolix checkout",
};

export default function CheckoutPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      
      <Suspense fallback={<CheckoutPageSkeleton />}>
        <WobcartCheckoutLauncher />
      </Suspense>
      <Footer1 />
    </>
  );
}
