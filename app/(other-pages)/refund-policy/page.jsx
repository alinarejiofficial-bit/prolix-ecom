import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import RefundPolicy from "@/components/otherPages/RefundPolicy";
import React from "react";

export const metadata = {
  title: "Refund Policy - Prolix | Returns & Refunds Information",
  description: "Review Prolix's refund and return policy. Learn about our return process, refund eligibility, and how to return items. Customer satisfaction guaranteed.",
  keywords: "refund policy, returns, refunds, return policy, money back guarantee, Prolix refunds, return process",
};

export default function RefundPolicyPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      
      <RefundPolicy />
      <Footer1 />
    </>
  );
}

