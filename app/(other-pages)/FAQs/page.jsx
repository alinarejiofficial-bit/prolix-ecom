import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import Faqs from "@/components/otherPages/Faqs";
import React from "react";
export const metadata = {
  title: "FAQs - Prolix | Frequently Asked Questions",
  description: "Find answers to frequently asked questions about Prolix. Get help with orders, shipping, returns, payments, and more. Quick answers to common questions.",
  keywords: "FAQs, frequently asked questions, help, questions, answers, Prolix FAQ, customer support, help center",
};

export default function FAQSPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      
      <Faqs />
      <Footer1 />
    </>
  );
}
