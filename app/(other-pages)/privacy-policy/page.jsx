import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import PrivacyPolicy from "@/components/otherPages/PrivacyPolicy";
import React from "react";

export const metadata = {
  title: "Privacy Policy - Prolix | Data Protection & Privacy",
  description: "Read Prolix's privacy policy to understand how we collect, use, and protect your personal information. Your privacy and data security are our top priorities.",
  keywords: "privacy policy, data protection, privacy, personal information, data security, Prolix privacy, GDPR",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      
      <PrivacyPolicy />
      <Footer1 />
    </>
  );
}

