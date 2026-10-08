import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import Contact3 from "@/components/otherPages/Contact3";
import StoreLocations3 from "@/components/otherPages/StoreLocations3";
import React from "react";
export const metadata = {
  title: "Contact Us - Prolix | Get in Touch",
  description: "Contact Prolix customer support team. Find our contact form, store locations, phone numbers, and email. We're here to help with any questions or concerns.",
  keywords: "contact Prolix, customer support, help, contact form, store locations, customer service, get in touch",
};

export default function ContactPage2() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      
      <StoreLocations3 />
      <Contact3 />

      <Footer1 />
    </>
  );
}
