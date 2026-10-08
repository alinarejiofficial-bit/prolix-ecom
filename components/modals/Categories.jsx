"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { categoryService } from "@/services/categoryService";

// Recursive component to render nested category children
function CategoryChildren({ children, level = 0 }) {
  if (!children || children.length === 0) {
    return null;
  }

  return (
    <ul className="facet-body">
      {children.map((child) => {
        const hasChildren = child.children && child.children.length > 0;
        const collapseId = `category-${child.id || child.uuid}`;
        const categoryId = child.id || child.uuid;
        const categoryLink = `/products/category/${categoryId}`;

        return (
          <li key={child.id || child.uuid}>
            {hasChildren ? (
              <>
                <div
                  role="dialog"
                  className="facet-title collapsed"
                  data-bs-target={`#${collapseId}`}
                  data-bs-toggle="collapse"
                  aria-expanded="false"
                  aria-controls={collapseId}
                >
                  <Image
                    className="avt"
                    alt={child.name || "category"}
                    src={child.image || "/images/avatar/accessories.jpg"}
                    width={48}
                    height={48}
                    onError={(e) => {
                      e.target.src = "/images/avatar/accessories.jpg";
                    }}
                  />
                  <span className="title">{child.name}</span>
                  <span className="icon icon-arrow-down" />
                </div>
                <div id={collapseId} className="collapse">
                  <CategoryChildren children={child.children} level={level + 1} />
                </div>
              </>
            ) : (
              <Link href={categoryLink} className="item link">
                <Image
                  className="avt"
                  alt={child.name || "category"}
                  src={child.image || "/images/avatar/accessories.jpg"}
                  width={48}
                  height={48}
                  onError={(e) => {
                    e.target.src = "/images/avatar/accessories.jpg";
                  }}
                />
                <span className="title-sub text-caption-1 text-secondary">
                  {child.name}
                </span>
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryService.getAllCategories(20);

        if (response.success && response.data) {
          setCategories(response.data);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err.message);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div
      className="offcanvas offcanvas-start canvas-filter canvas-categories"
      id="shopCategories"
    >
      <div className="canvas-wrapper">
        <div className="canvas-header">
          <span className="icon-left icon-filter" />
          <h5>Categories</h5>
          <span
            className="icon-close icon-close-popup"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="canvas-body">
          {loading ? (
            <div className="text-center py-4">
              <span className="text-secondary">Loading categories...</span>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <span className="text-danger">Error loading categories: {error}</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-4">
              <span className="text-secondary">No categories available</span>
            </div>
          ) : (
            categories.map((category) => {
              const hasChildren = category.children && category.children.length > 0;
              const collapseId = `category-${category.id || category.uuid}`;
              const categoryId = category.id || category.uuid;
              const categoryLink = `/products/category/${categoryId}`;

              return (
                <div key={category.id || category.uuid} className="wd-facet-categories">
                  {hasChildren ? (
                    <>
                      <div
                        role="dialog"
                        className="facet-title collapsed"
                        data-bs-target={`#${collapseId}`}
                        data-bs-toggle="collapse"
                        aria-expanded="false"
                        aria-controls={collapseId}
                      >
                        <Image
                          className="avt"
                          alt={category.name || "category"}
                          src={category.image || "/images/avatar/accessories.jpg"}
                          width={48}
                          height={48}
                          onError={(e) => {
                            e.target.src = "/images/avatar/accessories.jpg";
                          }}
                        />
                        <span className="title">{category.name}</span>
                        <span className="icon icon-arrow-down" />
                      </div>
                      <div id={collapseId} className="collapse">
                        <CategoryChildren children={category.children} />
                      </div>
                    </>
                  ) : (
                    <Link href={categoryLink} className="facet-title" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <Image
                        className="avt"
                        alt={category.name || "category"}
                        src={category.image || "/images/avatar/accessories.jpg"}
                        width={48}
                        height={48}
                        onError={(e) => {
                          e.target.src = "/images/avatar/accessories.jpg";
                        }}
                      />
                      <span className="title">{category.name}</span>
                    </Link>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
