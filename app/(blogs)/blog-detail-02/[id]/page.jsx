import BlogDetail2 from "@/components/blogs/BlogDetail2";

import RelatedBlogs from "@/components/blogs/RelatedBlogs";

import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import FeaturePageGuard from "@/components/common/FeaturePageGuard";
import { allBlogs } from "@/data/blogs";
import React from "react";

export default async function BlogDetailsPage2({ params }) {
  const { id } = await params;

  const blog = allBlogs.filter((p) => p.id == id)[0] || allBlogs[0];
  return (
    <FeaturePageGuard module="content">
      <Topbar6 bgColor="bg-main" />
      <Header1 />
      <BlogDetail2 blog={blog} />
      <RelatedBlogs />
      <Footer1 />
    </FeaturePageGuard>
  );
}
