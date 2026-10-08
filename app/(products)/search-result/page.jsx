"use client";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import SearchProducts from "@/components/products/SearchProducts";
import { ProductGridSkeleton } from "@/components/common/SectionSkeletons";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || searchParams.get('search') || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query.length >= 1) {
      router.push(`/search-result?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form className="form-search" onSubmit={handleSubmit}>
      <fieldset className="text">
        <input
          type="text"
          placeholder="Searching..."
          className=""
          name="text"
          tabIndex={0}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-required="true"
          required
        />
      </fieldset>
      <button className="" type="submit" disabled={loading}>
        {loading ? (
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        ) : (
          <svg
            className="icon"
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
              stroke="#181818"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21.35 21.0004L17 16.6504"
              stroke="#181818"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </form>
  );
}

export default function SearchResultPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      <section className="flat-spacing pt-4 pb-0">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-6">
              <Suspense fallback={
                <form className="form-search">
                  <fieldset className="text">
                    <input
                      type="text"
                      placeholder="Searching..."
                      className=""
                      name="text"
                      tabIndex={0}
                      disabled
                    />
                  </fieldset>
                  <button className="" type="button" disabled>
                    <svg
                      className="icon"
                      width={20}
                      height={20}
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                        stroke="#181818"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M21.35 21.0004L17 16.6504"
                        stroke="#181818"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </form>
              }>
                <SearchForm />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
      <Suspense fallback={
        <section className="flat-spacing pt-4">
          <div className="container">
            <ProductGridSkeleton count={6} />
          </div>
        </section>
      }>
        <SearchProducts />
      </Suspense>

      <Footer1 />
    </>
  );
}

