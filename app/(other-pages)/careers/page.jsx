import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import Careers from "@/components/otherPages/Careers";
import FeaturePageGuard from "@/components/common/FeaturePageGuard";
import React from "react";

export const metadata = {
  title: "Careers - Prolix | Join Our Team",
  description: "Join the Prolix team! Explore career opportunities, job openings, and positions available. Be part of a growing eCommerce company and build your career with us.",
  keywords: "careers, jobs, employment, job openings, careers at Prolix, join our team, work with us, job opportunities",
};

export default function CareersPage() {
  return (
    <FeaturePageGuard module="careers">
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      <Careers />
      <Footer1 />
    </FeaturePageGuard>
  );
}

