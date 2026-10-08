import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import Terms from "@/components/otherPages/Terms";
import React from "react";
export const metadata = {
  title: "Terms of Use - Prolix | Terms & Conditions",
  description: "Review Prolix's terms of use and conditions. Understand the rules and guidelines for using our website and services. Read our terms before making a purchase.",
  keywords: "terms of use, terms and conditions, user agreement, website terms, legal terms, Prolix terms",
};

export default function TermsOfUsePage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      
      <Terms />
      <Footer1 />
    </>
  );
}
