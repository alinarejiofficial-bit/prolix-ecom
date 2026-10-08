"use client";

import React from "react";
import SkeletonLoader from "@/components/common/SkeletonLoader";

export default function ProductDetailSkeleton() {
  return (
    <>
      {/* Breadcrumb Skeleton */}
      <div className="tf-breadcrumb">
        <div className="container">
          <div className="tf-breadcrumb-wrap">
            <div className="tf-breadcrumb-list">
              <SkeletonLoader width="80px" height="20px" />
              <i className="icon icon-arrRight" style={{ margin: "0 10px" }} />
              <SkeletonLoader width="200px" height="20px" />
            </div>
            <div className="tf-breadcrumb-share">
              <SkeletonLoader width="80px" height="30px" className="rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Skeleton */}
      <section className="flat-spacing" style={{ paddingTop: "30px" }}>
        <div className="tf-main-product section-image-zoom">
          <div className="container">
            <div className="row">
              {/* Product Image Skeleton */}
              <div className="col-md-6">
                <div className="tf-product-media-wrap sticky-top">
                  <div style={{ position: "relative", width: "100%", paddingBottom: "133%" }}>
                    <SkeletonLoader width="100%" height="100%" className="rounded" />
                  </div>
                  {/* Thumbnail images skeleton */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{ width: "80px", height: "80px", flexShrink: 0 }}>
                        <SkeletonLoader width="100%" height="100%" className="rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Info Skeleton */}
              <div className="col-md-6">
                <div className="tf-product-info-wrap position-relative mw-100p-hidden">
                  <div className="tf-product-info-list">
                    <div className="tf-product-info-heading">
                      <div className="tf-product-info-name">
                        <SkeletonLoader width="100px" height="16px" className="mb-2" />
                        <SkeletonLoader width="90%" height="32px" className="mb-3" />
                        <div className="sub">
                          <div className="tf-product-info-rate" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <div style={{ display: "flex", gap: "4px" }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <SkeletonLoader key={star} width="16px" height="16px" />
                              ))}
                            </div>
                            <SkeletonLoader width="100px" height="16px" />
                          </div>
                        </div>
                      </div>
                      <div className="tf-product-info-desc">
                        <div className="tf-product-info-price">
                          <SkeletonLoader width="150px" height="40px" className="mb-2" />
                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <SkeletonLoader width="120px" height="24px" />
                            <SkeletonLoader width="60px" height="24px" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="tf-product-info-choose-option">
                      {/* Color Select Skeleton */}
                      <div style={{ marginBottom: "20px" }}>
                        <SkeletonLoader width="80px" height="20px" className="mb-2" />
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {[1, 2, 3, 4].map((i) => (
                            <SkeletonLoader key={i} width="40px" height="40px" className="rounded-circle" />
                          ))}
                        </div>
                      </div>

                      {/* Size Select Skeleton */}
                      <div style={{ marginBottom: "20px" }}>
                        <SkeletonLoader width="60px" height="20px" className="mb-2" />
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <SkeletonLoader key={i} width="50px" height="40px" className="rounded" />
                          ))}
                        </div>
                      </div>

                      {/* Quantity Skeleton */}
                      <div style={{ marginBottom: "20px" }}>
                        <SkeletonLoader width="80px" height="20px" className="mb-2" />
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <SkeletonLoader width="40px" height="40px" className="rounded" />
                          <SkeletonLoader width="60px" height="40px" className="rounded" />
                          <SkeletonLoader width="40px" height="40px" className="rounded" />
                        </div>
                      </div>

                      {/* Buttons Skeleton */}
                      <div style={{ marginBottom: "20px" }}>
                        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                          <SkeletonLoader width="70%" height="50px" className="rounded" />
                          <SkeletonLoader width="50px" height="50px" className="rounded" />
                        </div>
                        <SkeletonLoader width="100%" height="50px" className="rounded" />
                      </div>

                      {/* Help Info Skeleton */}
                      <div style={{ marginBottom: "20px" }}>
                        <div style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "flex-start" }}>
                          <SkeletonLoader width="20px" height="20px" />
                          <SkeletonLoader width="90%" height="40px" />
                        </div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <SkeletonLoader width="20px" height="20px" />
                          <SkeletonLoader width="85%" height="40px" />
                        </div>
                      </div>

                      {/* SKU Info Skeleton */}
                      <ul className="tf-product-info-sku" style={{ listStyle: "none", padding: 0 }}>
                        {[1, 2, 3, 4].map((i) => (
                          <li key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                            <SkeletonLoader width="80px" height="16px" />
                            <SkeletonLoader width="150px" height="16px" />
                          </li>
                        ))}
                      </ul>

                      {/* Payment Info Skeleton */}
                      <div style={{ marginTop: "20px" }}>
                        <SkeletonLoader width="200px" height="20px" className="mb-2" />
                        <SkeletonLoader width="120px" height="40px" className="rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Descriptions Skeleton */}
      <section className="">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="widget-tabs style-1">
                {/* Tabs Skeleton */}
                <ul className="widget-menu-tab" style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                  <li>
                    <SkeletonLoader width="100px" height="40px" className="rounded" />
                  </li>
                  <li>
                    <SkeletonLoader width="150px" height="40px" className="rounded" />
                  </li>
                </ul>
                <div className="widget-content-tab">
                  <div className="widget-content-inner active">
                    <div className="tab-description">
                      <SkeletonLoader width="100%" height="200px" className="mb-3" />
                      <SkeletonLoader width="100%" height="200px" className="mb-3" />
                      <SkeletonLoader width="80%" height="200px" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products Skeleton */}
      <section className="flat-spacing">
        <div className="container">
          <div className="heading-section text-center">
            <SkeletonLoader width="200px" height="40px" className="mx-auto mb-3" />
          </div>
          <div style={{ display: "flex", gap: "15px", padding: "30px 0", overflow: "hidden" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ minWidth: "250px", flexShrink: 0 }}>
                <SkeletonLoader width="100%" height="350px" className="rounded mb-3" />
                <SkeletonLoader width="90%" height="20px" className="mb-2" />
                <SkeletonLoader width="60%" height="20px" className="mb-2" />
                <SkeletonLoader width="80px" height="24px" />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", padding: "20px 0" }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "#e0e0e0",
                }}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

