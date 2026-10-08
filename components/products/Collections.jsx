"use client";
import React, { useEffect, useState } from "react";
import { categoryService } from "@/services/categoryService";
import { productService } from "@/services/productService";
import Image from "next/image";
import Link from "next/link";
import { CollectionsSkeleton } from "@/components/common/SectionSkeletons";
import { useStoreConfig } from "@/context/StoreConfigContext";

const ITEMS_PER_PAGE = 12;
const PLACEHOLDER = "/images/avatar/accessories.jpg";

export default function Collections({ parentClass = "" }) {
  const { isModuleEnabled } = useStoreConfig();
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: ITEMS_PER_PAGE,
    total: 0,
    next_page: null,
    prev_page: null,
  });
  const [currentPage, setCurrentPage] = useState(1);

  const isEnabled = isModuleEnabled("content");

  useEffect(() => {
    if (!isEnabled) return;
    fetchCategories(currentPage);
  }, [currentPage, isEnabled]);

  const fetchCategories = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const [catResponse, prodResponse] = await Promise.allSettled([
        categoryService.getCategories(page, ITEMS_PER_PAGE),
        productService.getProducts({ per_page: 100 }),
      ]);

      if (catResponse.status === "fulfilled" && catResponse.value?.success && catResponse.value?.data) {
        setCategories(catResponse.value.data);
        if (catResponse.value.pagination) {
          setPagination(catResponse.value.pagination);
        }
      } else {
        setError("Failed to load categories");
      }

      if (prodResponse.status === "fulfilled" && prodResponse.value?.data?.items) {
        const counts = {};
        prodResponse.value.data.items.forEach((item) => {
          const catId = item.category?.id || item.category_id;
          if (catId != null) {
            counts[catId] = (counts[catId] || 0) + 1;
          }
        });
        setCategoryCounts(counts);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= Math.ceil(pagination.total / pagination.per_page)) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.per_page) || 1;

  const getItemCount = (category) => {
    if (categoryCounts[category.id] !== undefined) {
      return categoryCounts[category.id];
    }
    return category.products_count ?? category.children_count ?? category.items_count ?? null;
  };

  // If content module is disabled from admin, completely unmount (zero pieces lay outside)
  if (!isEnabled) {
    return null;
  }

  if (loading && categories.length === 0) {
    return (
      <section className={`${parentClass} wc-editorial-section`.trim()}>
        <CollectionsSkeleton count={8} showHeader={true} />
      </section>
    );
  }

  if (error && categories.length === 0) {
    return (
      <section className={`${parentClass} wc-editorial-section`.trim()}>
        <div className="container">
          <div className="text-center py-5">
            <p className="text-secondary small mb-3">{error}</p>
            <button
              onClick={() => fetchCategories(currentPage)}
              className="wc-editorial-page-btn px-4 py-2"
              style={{ width: "auto", height: "auto" }}
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`${parentClass} wc-editorial-section`.trim()}>
      <div className="container">
        {/* Section Heading matching Home Categories & Store Rhythm */}
        <div className="heading-section text-center wow fadeInUp mb-4 mb-md-5">
          <h3 className="heading">Shop by Category</h3>
          <p className="subheading text-secondary">
            Browse our curated seasonal collections
          </p>
        </div>

        <div className="wc-editorial-grid">
          {categories.map((category, index) => {
            const itemCount = getItemCount(category);
            const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
            const formattedIndex = String(globalIndex).padStart(2, "0");

            return (
              <Link
                key={category.id || category.uuid || index}
                href={`/products/category/${category.id}`}
                className="wc-editorial-card"
              >
                <div className="wc-editorial-media">
                  <Image
                    className="wc-editorial-img"
                    src={category.image || PLACEHOLDER}
                    alt={category.name || "Collection"}
                    width={600}
                    height={800}
                    unoptimized
                    onError={(e) => {
                      e.target.src = PLACEHOLDER;
                    }}
                  />
                </div>
                <div className="wc-editorial-meta">
                  <span className="wc-editorial-num">{formattedIndex}</span>
                  <div className="wc-editorial-name-wrap">
                    <span className="wc-editorial-name">
                      {category.name}
                    </span>
                    {itemCount != null && itemCount > 0 && (
                      <span className="wc-editorial-count-tag">
                        ({itemCount})
                      </span>
                    )}
                    <span className="wc-editorial-arrow">↗</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Minimal Editorial Pagination */}
        {totalPages > 1 && (
          <ul className="wc-editorial-pagination">
            <li>
              <button
                type="button"
                className={`wc-editorial-page-btn ${
                  currentPage === 1 ? "disabled" : ""
                }`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous Page"
              >
                ←
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              const formattedPage = String(page).padStart(2, "0");
              return (
                <li key={page}>
                  <button
                    type="button"
                    className={`wc-editorial-page-btn ${
                      page === currentPage ? "active" : ""
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {formattedPage}
                  </button>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                className={`wc-editorial-page-btn ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next Page"
              >
                →
              </button>
            </li>
          </ul>
        )}
      </div>
    </section>
  );
}
