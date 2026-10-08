import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import Testimonials2 from "@/components/otherPages/Testimonials2";
import React from "react";
export const metadata = {
  title: "Customer Feedback - Prolix | Reviews & Testimonials",
  description: "Read customer reviews and testimonials about Prolix. See what our customers say about our products, service, and shopping experience. Share your feedback.",
  keywords: "customer feedback, reviews, testimonials, customer reviews, product reviews, Prolix reviews, customer testimonials",
};

export default function CustomerFeedbackPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      
      <Testimonials2 />
      <Footer1 />
    </>
  );
}
