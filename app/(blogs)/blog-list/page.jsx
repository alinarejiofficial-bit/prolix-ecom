import BlogList from "@/components/blogs/BlogList";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import FeaturePageGuard from "@/components/common/FeaturePageGuard";
import React from "react";

export const metadata = {
  title: "Blog List - Prolix | All Blog Posts & Articles",
  description: "Browse all blog posts and articles from Prolix. Read fashion tips, style guides, trend updates, and lifestyle content. Find inspiration for your next look.",
  keywords: "blog list, all blog posts, articles, fashion articles, style articles, Prolix blog posts, blog archive",
};

export default function BlogListPage() {
  return (
    <FeaturePageGuard module="content">
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      <BlogList />
      <Footer1 />
    </FeaturePageGuard>
  );
}
