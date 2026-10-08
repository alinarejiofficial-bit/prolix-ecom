"use client";

import { categoryService } from "@/services/categoryService";
import { productService } from "@/services/productService";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RangeSlider from "react-range-slider-input";
import { useCategoryFromPath } from "@/hooks/useCategoryFromPath";

export default function FilterModal({ allProps }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { categoryId: categoryIdFromPath } = useCategoryFromPath();
  const [apiCategories, setApiCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const selectedCategoryId = categoryIdFromPath ?? searchParams.get('category_id');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const [catResponse, prodResponse] = await Promise.allSettled([
          categoryService.getCategories(1, 100),
          productService.getProducts({ per_page: 100 }),
        ]);

        if (catResponse.status === "fulfilled" && catResponse.value?.success && catResponse.value?.data) {
          setApiCategories(catResponse.value.data);
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
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId, e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');

    if (selectedCategoryId === categoryId.toString()) {
      // If already selected, go to all products
      const query = params.toString();
      router.push(query ? `/products?${query}` : '/products');
    } else {
      // Go to /products/category/:id
      const query = params.toString();
      router.push(query ? `/products/category/${categoryId}?${query}` : `/products/category/${categoryId}`);
    }
  };

  return (
    <div className="offcanvas offcanvas-start canvas-filter" id="filterShop">
      <div className="canvas-wrapper">
        <div className="canvas-header">
          <h5>Filters</h5>
          <span
            className="icon-close icon-close-popup"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="canvas-body">
          <div className="widget-facet facet-categories">
            <h6 className="facet-title">Product Categories</h6>
            {categoriesLoading ? (
              <ul className="facet-content">
                <li>
                  <span className="text-secondary">Loading categories...</span>
                </li>
              </ul>
            ) : apiCategories.length === 0 ? (
              <ul className="facet-content">
                <li>
                  <span className="text-secondary">No categories found</span>
                </li>
              </ul>
            ) : (
              <ul className="facet-content">
                {apiCategories.map((category) => {
                  const categoryId = category.id || category.uuid;
                  const isSelected = selectedCategoryId && (
                    selectedCategoryId === categoryId?.toString() || 
                    selectedCategoryId === category.uuid?.toString()
                  );
                  return (
                    <li key={categoryId}>
                      <a
                        href="#"
                        onClick={(e) => handleCategoryClick(categoryId, e)}
                        className={`categories-item ${isSelected ? 'active' : ''}`}
                      >
                        {category.name}{" "}
                        <span className="count-cate">
                          ({categoryCounts[category.id] ?? category.products_count ?? category.children_count ?? 0})
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="widget-facet facet-price">
            <h6 className="facet-title">Price</h6>

            <RangeSlider
              min={0}
              max={20000}
              value={allProps.price}
              onInput={(value) => allProps.setPrice(value)}
            />
            <div className="box-price-product mt-3">
              <div className="box-price-item">
                <span className="title-price">Min price</span>
                <div
                  className="price-val"
                  id="price-min-value"
                  data-currency="₹"
                >
                  ₹{allProps.price[0].toLocaleString('en-IN')}
                </div>
              </div>
              <div className="box-price-item">
                <span className="title-price">Max price</span>
                <div
                  className="price-val"
                  id="price-max-value"
                  data-currency="₹"
                >
                  ₹{allProps.price[1].toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="canvas-bottom">
          <button
            id="reset-filter"
            onClick={allProps.clearFilter}
            className="tf-btn btn-reset"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}

