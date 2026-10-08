"use client";

import React from "react";
import SkeletonLoader from "./SkeletonLoader";

// Banner Slider Skeleton – responsive height
export function BannerSliderSkeleton() {
  return (
    <section className="tf-slideshow slider-style2 slider-effect-fade w-100" style={{ minHeight: "280px", display: "block" }}>
      <div
        className="wrap-slider w-100 overflow-hidden"
        style={{
          position: "relative",
          minHeight: "280px",
          height: "50vw",
          maxHeight: "803px",
          display: "block",
        }}
      >
        <SkeletonLoader width="100%" height="100%" />
      </div>
      <div className="wrap-pagination">
        <div className="container">
          <div className="sw-dots sw-pagination-slider type-circle justify-content-center spd30">
            <div className="d-flex gap-2 justify-content-center py-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-circle" style={{ width: "12px", height: "12px", background: "#e0e0e0" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Categories Skeleton – responsive grid
export function CategoriesSkeleton() {
  return (
    <section className="flat-spacing">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 mb-md-4">
          <div className="flex-grow-1" style={{ maxWidth: "300px" }}>
            <SkeletonLoader width="100%" height="40px" />
          </div>
          <div className="d-none d-md-block" style={{ width: "200px" }}>
            <SkeletonLoader width="100%" height="40px" />
          </div>
        </div>
      </div>
      <div className="container-full slider-layout-right">
        <div className="row g-3 g-md-4 px-2 px-md-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="col-4 col-sm-3 col-md-2">
              <div className="rounded overflow-hidden" style={{ aspectRatio: "1", maxHeight: "280px" }}>
                <SkeletonLoader width="100%" height="100%" className="rounded" />
              </div>
              <div className="mt-2 text-center">
                <SkeletonLoader width="80%" height="20px" className="mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Products Slider Skeleton – responsive grid
export function ProductsSliderSkeleton({ title = "Loading Products", parentClass = "flat-spacing" }) {
  return (
    <section className={parentClass}>
      <div className="container">
        <div className="heading-section text-center">
          <div className="mx-auto mb-3" style={{ maxWidth: "250px" }}>
            <SkeletonLoader width="100%" height="40px" />
          </div>
          <div className="mx-auto" style={{ maxWidth: "400px" }}>
            <SkeletonLoader width="100%" height="20px" />
          </div>
        </div>
        <div className="row g-3 g-md-4 py-3 py-md-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="col-6 col-md-4 col-lg-3">
              <div className="rounded mb-3 overflow-hidden" style={{ aspectRatio: "1", maxHeight: "280px" }}>
                <SkeletonLoader width="100%" height="100%" className="rounded" />
              </div>
              <SkeletonLoader width="90%" height="20px" className="mb-2" />
              <SkeletonLoader width="60%" height="20px" className="mb-2" />
              <SkeletonLoader width="80px" height="24px" />
            </div>
          ))}
        </div>
        <div className="d-flex gap-2 justify-content-center py-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-circle"
              style={{ width: "12px", height: "12px", background: "#e0e0e0" }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Collections Skeleton – Editorial 3:4 portrait grid matching container
export function CollectionsSkeleton({ count = 4, showHeader = true }) {
  return (
    <div className="container">
      {showHeader && (
        <div className="heading-section text-center mb-4 mb-md-5">
          <div style={{ width: "220px", height: "32px", background: "#e5e7eb", borderRadius: "6px", margin: "0 auto 12px" }} />
          <div style={{ width: "280px", height: "16px", background: "#f3f4f6", borderRadius: "4px", margin: "0 auto" }} />
        </div>
      )}
      <div className="wc-editorial-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="wc-editorial-card">
            <div className="wc-editorial-media" style={{ aspectRatio: "3/4", borderRadius: "14px", overflow: "hidden" }}>
              <SkeletonLoader width="100%" height="100%" />
            </div>
            <div className="wc-editorial-meta">
              <div style={{ width: "22px", height: "16px", background: "#f4f4f5", borderRadius: "4px" }} />
              <div style={{ width: "70px", height: "14px", background: "#e5e7eb", borderRadius: "3px" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Banner Offer Section Skeleton – matches dual-image split offer
export function BannerOfferSkeleton() {
  return (
    <div className="wc-split-offer-wrap">
      <div className="wc-split-offer-grid">
        <div className="wc-split-offer-media">
          <SkeletonLoader width="100%" height="100%" />
        </div>
        <div className="wc-split-offer-media d-none d-md-block">
          <SkeletonLoader width="100%" height="100%" />
        </div>
      </div>
      <div className="wc-split-offer-card">
        <div style={{ width: "130px", height: "22px", background: "#e5e7eb", borderRadius: "50px", margin: "0 auto 12px" }} />
        <div style={{ width: "230px", height: "28px", background: "#e5e7eb", borderRadius: "6px", margin: "0 auto 8px" }} />
        <div style={{ width: "180px", height: "16px", background: "#f3f4f6", borderRadius: "4px", margin: "0 auto 16px" }} />
        <div style={{ width: "140px", height: "38px", background: "#111111", borderRadius: "50px", margin: "0 auto" }} />
      </div>
    </div>
  );
}

// Announcements Skeleton – responsive
export function AnnouncementsSkeleton() {
  return (
    <section className="tf-marquee">
      <div className="marquee-wrapper">
        <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-md-start py-3 px-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ minWidth: "120px", maxWidth: "180px", flex: "1 1 auto" }}>
              <SkeletonLoader width="100%" height="20px" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Skeleton – responsive columns
export function TestimonialsSkeleton() {
  return (
    <section className="flat-spacing">
      <div className="container">
        <div className="heading-section text-center">
          <div className="mx-auto mb-3" style={{ maxWidth: "250px" }}>
            <SkeletonLoader width="100%" height="40px" />
          </div>
          <div className="mx-auto mb-5" style={{ maxWidth: "500px" }}>
            <SkeletonLoader width="100%" height="20px" />
          </div>
        </div>
        <div className="row g-3 g-md-4 py-3">
          {[1, 2].map((i) => (
            <div key={i} className="col-12 col-md-6">
              <div className="p-3 p-md-4 rounded" style={{ background: "#f8f9fa" }}>
                <div className="d-flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <SkeletonLoader key={star} width="16px" height="16px" />
                  ))}
                </div>
                <SkeletonLoader width="100%" height="60px" className="mb-4" />
                <div className="d-flex gap-3 align-items-center">
                  <SkeletonLoader width="60px" height="60px" className="rounded-circle flex-shrink-0" />
                  <div className="min-w-0 flex-grow-1" style={{ maxWidth: "150px" }}>
                    <SkeletonLoader width="100%" height="20px" className="mb-2" />
                    <SkeletonLoader width="80px" height="16px" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="d-flex gap-2 justify-content-center py-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-circle" style={{ width: "12px", height: "12px", background: "#e0e0e0" }} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomePageContentSkeleton() {
  return (
    <>
      <BannerSliderSkeleton />
      <AnnouncementsSkeleton />
      <CategoriesSkeleton />
      <ProductsSliderSkeleton parentClass="flat-spacing pt-5" />
      <CollectionsSkeleton />
      <ProductsSliderSkeleton parentClass="flat-spacing pt-0" />
      <BannerOfferSkeleton />
      <TestimonialsSkeleton />
    </>
  );
}

export function ProductGridPageSkeleton({ parentClass = "flat-spacing pt-4", count = 8 }) {
  return (
    <section className={parentClass}>
      <div className="container">
        <div className="tf-shop-control mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <SkeletonLoader width="120px" height="40px" className="rounded" />
            <div className="d-flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonLoader key={i} width="36px" height="36px" className="rounded" />
              ))}
            </div>
            <SkeletonLoader width="160px" height="40px" className="rounded" />
          </div>
        </div>
        <SkeletonLoader width="180px" height="18px" className="mb-4" />
        <ProductGridSkeleton count={count} />
      </div>
    </section>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="row g-3 g-md-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="col-6 col-md-4 col-lg-3">
          <div className="rounded mb-3 overflow-hidden" style={{ aspectRatio: "1", maxHeight: "280px" }}>
            <SkeletonLoader width="100%" height="100%" className="rounded" />
          </div>
          <SkeletonLoader width="90%" height="20px" className="mb-2" />
          <SkeletonLoader width="60%" height="20px" className="mb-2" />
          <SkeletonLoader width="80px" height="24px" />
        </div>
      ))}
    </div>
  );
}

export function BlogListSkeleton({ count = 4 }) {
  return (
    <div className="main-content-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-8 mb-lg-30">
            <div className="d-flex gap-2 mb-4">
              <SkeletonLoader width="100%" height="44px" className="rounded" />
              <SkeletonLoader width="100px" height="44px" className="rounded flex-shrink-0" />
            </div>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="wg-blog style-row hover-image mb_40">
                <div className="row g-3 align-items-center">
                  <div className="col-md-5">
                    <div className="rounded overflow-hidden" style={{ aspectRatio: "3/2" }}>
                      <SkeletonLoader width="100%" height="100%" />
                    </div>
                  </div>
                  <div className="col-md-7">
                    <SkeletonLoader width="120px" height="16px" className="mb-3" />
                    <SkeletonLoader width="90%" height="28px" className="mb-3" />
                    <SkeletonLoader width="100%" height="16px" className="mb-2" />
                    <SkeletonLoader width="85%" height="16px" className="mb-2" />
                    <SkeletonLoader width="70%" height="16px" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartPageSkeleton() {
  return (
    <section className="flat-spacing pt-4">
      <div className="container">
        <SkeletonLoader width="200px" height="36px" className="mb-4" />
        <div className="row g-4">
          <div className="col-lg-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="d-flex gap-3 mb-4 pb-4 border-bottom">
                <SkeletonLoader width="100px" height="120px" className="rounded flex-shrink-0" />
                <div className="flex-grow-1">
                  <SkeletonLoader width="70%" height="22px" className="mb-2" />
                  <SkeletonLoader width="40%" height="18px" className="mb-3" />
                  <SkeletonLoader width="120px" height="36px" className="rounded" />
                </div>
                <SkeletonLoader width="80px" height="24px" />
              </div>
            ))}
          </div>
          <div className="col-lg-4">
            <div className="p-4 rounded" style={{ background: "#f8f9fa" }}>
              <SkeletonLoader width="60%" height="24px" className="mb-4" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="d-flex justify-content-between mb-3">
                  <SkeletonLoader width="100px" height="18px" />
                  <SkeletonLoader width="70px" height="18px" />
                </div>
              ))}
              <SkeletonLoader width="100%" height="48px" className="rounded mt-3" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CheckoutPageSkeleton() {
  return (
    <section className="flat-spacing pt-4">
      <div className="container text-center py-5">
        <SkeletonLoader width="64px" height="64px" className="rounded-circle mx-auto mb-3" />
        <SkeletonLoader width="240px" height="24px" className="mx-auto mb-2" />
        <SkeletonLoader width="320px" height="18px" className="mx-auto" />
      </div>
    </section>
  );
}

export function StaticPageSkeleton() {
  return (
    <section className="flat-spacing pt-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <SkeletonLoader width="280px" height="40px" className="mb-4 mx-auto" />
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonLoader key={i} width={i === 5 ? "70%" : "100%"} height="18px" className="mb-3" />
            ))}
            <SkeletonLoader width="200px" height="28px" className="my-4" />
            {[1, 2, 3, 4].map((i) => (
              <SkeletonLoader key={i} width={i === 4 ? "80%" : "100%"} height="18px" className="mb-3" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ContactPageSkeleton() {
  return (
    <section className="flat-spacing pt-4">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-5">
            <SkeletonLoader width="220px" height="36px" className="mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="d-flex gap-3 mb-4">
                <SkeletonLoader width="40px" height="40px" className="rounded-circle flex-shrink-0" />
                <div className="flex-grow-1">
                  <SkeletonLoader width="100px" height="18px" className="mb-2" />
                  <SkeletonLoader width="80%" height="16px" />
                </div>
              </div>
            ))}
          </div>
          <div className="col-lg-7">
            <div className="p-4 rounded" style={{ background: "#f8f9fa" }}>
              {[1, 2].map((i) => (
                <SkeletonLoader key={i} width="100%" height="44px" className="rounded mb-3" />
              ))}
              <SkeletonLoader width="100%" height="120px" className="rounded mb-3" />
              <SkeletonLoader width="140px" height="44px" className="rounded" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SearchResultsPageSkeleton() {
  return (
    <>
      <section className="flat-spacing pt-4 pb-0">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-6">
              <SkeletonLoader width="100%" height="44px" className="rounded" />
            </div>
          </div>
        </div>
      </section>
      <section className="flat-spacing pt-4">
        <div className="container">
          <SkeletonLoader width="280px" height="28px" className="mb-4" />
          <ProductGridSkeleton count={6} />
        </div>
      </section>
    </>
  );
}

function AccountSidebarSkeleton() {
  return (
    <div className="sidebar-account">
      <div className="text-center mb-4">
        <SkeletonLoader width="80px" height="80px" className="rounded-circle mx-auto mb-3" />
        <SkeletonLoader width="120px" height="20px" className="mx-auto" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonLoader key={i} width="100%" height="40px" className="rounded mb-2" />
      ))}
    </div>
  );
}

export function AccountFormSkeleton() {
  return (
    <>
      <SkeletonLoader width="200px" height="32px" className="mb-4" />
      <div className="row g-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="col-md-6">
            <SkeletonLoader width="80px" height="16px" className="mb-2" />
            <SkeletonLoader width="100%" height="44px" className="rounded" />
          </div>
        ))}
      </div>
      <SkeletonLoader width="140px" height="44px" className="rounded mt-4" />
    </>
  );
}

export function AccountOrdersSkeleton({ count = 3 }) {
  return (
    <>
      <SkeletonLoader width="180px" height="32px" className="mb-4" />
      <SkeletonLoader width="100%" height="44px" className="rounded mb-4" />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-3 p-md-4 rounded mb-3 border">
          <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
            <SkeletonLoader width="140px" height="20px" />
            <SkeletonLoader width="90px" height="28px" className="rounded" />
          </div>
          <div className="d-flex gap-3">
            <SkeletonLoader width="72px" height="72px" className="rounded flex-shrink-0" />
            <div className="flex-grow-1">
              <SkeletonLoader width="75%" height="18px" className="mb-2" />
              <SkeletonLoader width="50%" height="16px" className="mb-2" />
              <SkeletonLoader width="100px" height="20px" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function OrderDetailsSkeleton() {
  return (
    <>
      <SkeletonLoader width="220px" height="32px" className="mb-2" />
      <SkeletonLoader width="160px" height="18px" className="mb-4" />
      <div className="row g-4">
        <div className="col-lg-8">
          {[1, 2].map((i) => (
            <div key={i} className="d-flex gap-3 mb-3 pb-3 border-bottom">
              <SkeletonLoader width="80px" height="80px" className="rounded" />
              <div className="flex-grow-1">
                <SkeletonLoader width="70%" height="20px" className="mb-2" />
                <SkeletonLoader width="40%" height="16px" />
              </div>
              <SkeletonLoader width="70px" height="20px" />
            </div>
          ))}
        </div>
        <div className="col-lg-4">
          <div className="p-4 rounded border">
            <SkeletonLoader width="140px" height="22px" className="mb-3" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="d-flex justify-content-between mb-2">
                <SkeletonLoader width="90px" height="16px" />
                <SkeletonLoader width="60px" height="16px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function AddressListSkeleton() {
  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <SkeletonLoader width="160px" height="32px" />
        <SkeletonLoader width="180px" height="40px" className="rounded" />
      </div>
      <div className="row g-4">
        {[1, 2].map((i) => (
          <div key={i} className="col-md-6">
            <div className="p-4 rounded border h-100">
              <SkeletonLoader width="70px" height="24px" className="rounded mb-3" />
              <SkeletonLoader width="90%" height="18px" className="mb-2" />
              <SkeletonLoader width="80%" height="18px" className="mb-2" />
              <SkeletonLoader width="60%" height="18px" className="mb-4" />
              <div className="d-flex gap-2">
                <SkeletonLoader width="60px" height="32px" className="rounded" />
                <SkeletonLoader width="60px" height="32px" className="rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function AccountContentSkeleton({ variant = "form" }) {
  return (
    <div className="my-account-content">
      {variant === "orders" && <AccountOrdersSkeleton />}
      {variant === "order-details" && <OrderDetailsSkeleton />}
      {variant === "addresses" && <AddressListSkeleton />}
      {variant !== "orders" && variant !== "order-details" && variant !== "addresses" && (
        <AccountFormSkeleton />
      )}
    </div>
  );
}

export function BlogDetailSkeleton() {
  return (
    <section className="flat-spacing pt-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <SkeletonLoader width="85%" height="40px" className="mb-3 mx-auto" />
            <SkeletonLoader width="220px" height="18px" className="mb-4 mx-auto" />
            <div className="rounded overflow-hidden mb-4" style={{ aspectRatio: "16/9", maxHeight: "480px" }}>
              <SkeletonLoader width="100%" height="100%" />
            </div>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonLoader key={i} width={i === 6 ? "65%" : "100%"} height="18px" className="mb-3" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CareersPageSkeleton() {
  return (
    <section className="section-careers" style={{ padding: "72px 0 96px" }}>
      <div className="container">
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <SkeletonLoader width="72px" height="12px" className="mb-3" />
          <SkeletonLoader width="240px" height="36px" className="mb-3" />
          <SkeletonLoader width="420px" height="16px" className="mb-5" />
          <div className="d-flex gap-2 mb-4">
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} width="84px" height="32px" className="rounded-pill" />
            ))}
          </div>
          <SkeletonLoader width="100%" height="1px" className="mb-2" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-4" style={{ borderBottom: "1px solid #f0f0f0" }}>
              <SkeletonLoader width="55%" height="22px" className="mb-2" />
              <SkeletonLoader width="32%" height="14px" className="mb-3" />
              <SkeletonLoader width="90%" height="14px" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WishlistPageSkeleton() {
  return (
    <section className="flat-spacing">
      <div className="container">
        <SkeletonLoader width="200px" height="36px" className="mb-4" />
        <ProductGridSkeleton count={4} />
      </div>
    </section>
  );
}

export function AccountLayoutSkeleton({ variant = "form" }) {
  return (
    <section className="flat-spacing">
      <div className="container">
        <div className="my-account-wrap">
          <div className="wrap-sidebar-account">
            <AccountSidebarSkeleton />
          </div>
          <AccountContentSkeleton variant={variant} />
        </div>
      </div>
    </section>
  );
}

