"use client";

import PageLoaderShell from "@/components/loaders/PageLoaderShell";
import { BlogDetailSkeleton } from "@/components/common/SectionSkeletons";
import BlogDetail2 from "@/components/blogs/BlogDetail2";
import RelatedBlogs from "@/components/blogs/RelatedBlogs";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import { blogService } from "@/services/blogService";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import FeaturePageGuard from "@/components/common/FeaturePageGuard";

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await blogService.getBlogBySlug(slug);
        
        if (response.success && response.data) {
          setBlog(response.data);
        } else {
          setError("Blog not found");
        }
      } catch (err) {
        console.error("Error fetching blog:", err);
        if (err.statusCode === 404) {
          setError("Blog not found");
        } else {
          setError(err.message || "Failed to load blog");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug, router]);

  if (loading) {
    return (
      <FeaturePageGuard module="content">
        <PageLoaderShell footerPadding>
          <BlogDetailSkeleton />
        </PageLoaderShell>
      </FeaturePageGuard>
    );
  }

  if (error || !blog) {
    return (
      <FeaturePageGuard module="content">
        <Topbar6 bgColor="bg-main" />
        <Header1 />
        <div className="container py-5">
          <div className="text-center">
            <h2>Blog Not Found</h2>
            <p>{error || "The blog you're looking for doesn't exist."}</p>
          </div>
        </div>
        <Footer1 />
      </FeaturePageGuard>
    );
  }

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

