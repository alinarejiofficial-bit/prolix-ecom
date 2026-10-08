"use client";
import React, { useState, useEffect } from "react";
import Pagination from "../common/Pagination";
import Link from "next/link";
import Image from "next/image";
import { blogService } from "@/services/blogService";
import { BlogListSkeleton } from "@/components/common/SectionSkeletons";

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const perPage = 10;

  const fetchBlogs = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const response = await blogService.getBlogs({
        page,
        per_page: perPage,
        search: search || undefined,
      });

      if (response.success && response.data) {
        setBlogs(response.data);
        setPagination(response.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setBlogs([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs(1, searchTerm);
  }, [searchTerm]);

  const handlePageChange = (page) => {
    fetchBlogs(page, searchTerm);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.per_page) : 0;

  return (
    <div className="main-content-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-8 mb-lg-30">
            {/* Search Bar */}
            <div className="mb-4">
              <form onSubmit={handleSearch} className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search blogs..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button type="submit" className="tf-btn btn-md">
                  Search
                </button>
                {searchTerm && (
                  <button
                    type="button"
                    className="btn-style-1"
                    onClick={() => {
                      setSearchInput("");
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                  >
                    Clear
                  </button>
                )}
              </form>
            </div>

            {loading ? (
              <BlogListSkeleton count={3} />
            ) : blogs.length === 0 ? (
              <div className="text-center py-5">
                <p>No blogs found.</p>
              </div>
            ) : (
              <>
                {blogs.map((post) => (
                  <div key={post.id || post.uuid} className="wg-blog style-row hover-image mb_40">
                    <div className="image">
                      <Image
                        className="lazyload"
                        alt={post.title || "Blog Image"}
                        src={post.image || "/images/blog/blog-grid-1.jpg"}
                        width={600}
                        height={399}
                        onError={(e) => {
                          e.target.src = "/images/blog/blog-grid-1.jpg";
                        }}
                      />
                    </div>
                    <div className="content">
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-10">
                        <div className="meta">
                          <div className="meta-item gap-8">
                            <div className="icon">
                              <i className="icon-calendar" />
                            </div>
                            <p className="text-caption-1">
                              {formatDate(post.published_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <h5 className="title">
                        <Link className="link" href={`/blog/${post.slug || post.uuid || post.id}`}>
                          {post.title}
                        </Link>
                      </h5>
                      <Link
                        href={`/blog/${post.slug || post.uuid || post.id}`}
                        className="link text-button bot-button"
                      >
                        Read More
                      </Link>
                    </div>
                  </div>
                ))}
                {pagination && totalPages > 1 && (
                  <ul className="wg-pagination">
                    <Pagination
                      totalPages={totalPages}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                    />
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
