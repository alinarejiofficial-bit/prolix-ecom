import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import About from "@/components/otherPages/About";
import React from "react";

export const metadata = {
  title: "About Us - Prolix | Our Story & Mission",
  description: "Learn about Prolix - your trusted online shopping destination. Discover our story, mission, and commitment to providing quality products and excellent customer service.",
  keywords: "about Prolix, company information, our story, Prolix mission, about us, company history",
};

export default function AboutUsPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      
      <About />
      <Footer1 />
    </>
  );
}
