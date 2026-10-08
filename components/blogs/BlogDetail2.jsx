"use client";

import React from "react";
import Image from "next/image";

export default function BlogDetail2({ blog }) {
  if (!blog) {
    return null;
  }

  // Format the published date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Handle share functionality
  const handleShare = async () => {
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareTitle = blog.title || "";
    const shareText = blog.description 
      ? `${shareTitle}\n\n${blog.description.replace(/<[^>]*>/g, "").substring(0, 100)}...`
      : shareTitle;

    // Check if Web Share API is supported
    if (typeof window !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: currentUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(currentUrl);
        alert("Link copied to clipboard!");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        // Final fallback: show the URL
        prompt("Copy this link:", currentUrl);
      }
    }
  };

  return (
    <section className="flat-spacing">
      <div className="container">
        <div className="row">
          <div className="col-lg-12 mb-lg-30">
            <div className="blog-detail-wrap page-single-2">
              <div className="inner">
                <div className="heading">
                  <h3 className="fw-5">{blog.title}</h3>
                  <div className="meta">
                    <div className="meta-item gap-8">
                      <div className="icon">
                        <i className="icon-calendar" />
                      </div>
                      <p className="body-text-1">
                        {formatDate(blog.published_at)}
                      </p>
                    </div>
                  </div>
                </div>
                {blog.image && (
                  <div className="image">
                    <Image
                      className="lazyload"
                      data-src={blog.image}
                      alt={blog.title || "Blog image"}
                      src={blog.image}
                      width={1275}
                      height={717}
                      unoptimized
                    />
                  </div>
                )}
                {blog.description && (
                  <div className="content">
                    <div
                      className="body-text-1"
                      dangerouslySetInnerHTML={{ __html: blog.description }}
                    />
                  </div>
                )}
                <div className="bot d-flex justify-content-between gap-10 flex-wrap">
                  <div className="d-flex align-items-center justify-content-between gap-16">
                    <p>Share this post:</p>
                    <ul className="tf-social-icon style-1">
                      <li>
                        <button
                          onClick={handleShare}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "44px",
                            height: "44px",
                            fontSize: "20px",
                            color: "var(--main)",
                            border: "1px solid var(--main)",
                            borderRadius: "50%",
                            background: "transparent",
                            cursor: "pointer",
                            padding: 0,
                            transition: "all 0.3s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--main)";
                            e.currentTarget.style.color = "var(--white)";
                            e.currentTarget.style.border = "none";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--main)";
                            e.currentTarget.style.border = "1px solid var(--main)";
                          }}
                          aria-label="Share this post"
                        >
                          <i className="icon icon-share" />
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
