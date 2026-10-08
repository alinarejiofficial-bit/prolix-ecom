import BlogList from "@/components/blogs/BlogList";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import FeaturePageGuard from "@/components/common/FeaturePageGuard";
import React from "react";

export const metadata = {
  title: "Blog - Prolix | Fashion Tips, Trends & News",
  description: "Read the latest blog posts from Prolix. Get fashion tips, style guides, trend updates, and shopping advice. Stay informed about the latest in fashion and lifestyle.",
  keywords: "blog, fashion blog, style tips, fashion trends, lifestyle blog, Prolix blog, fashion news, style guide",
};

export default function BlogPage() {
  return (
    <FeaturePageGuard module="content">
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      <BlogList />
      <Footer1 />
    </FeaturePageGuard>
  );
}

