"use client";

import LayoutHandler from "./LayoutHandler";
import Sorting from "./Sorting";
import Listview from "./Listview";
import GridView from "./GridView";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import FilterModal from "./FilterModal";
import { initialState, reducer } from "@/reducer/filterReducer";
import FilterMeta from "./FilterMeta";
import { productService } from "@/services/productService";
import { useSearchParams, useRouter } from "next/navigation";
import { useCategoryFromPath } from "@/hooks/useCategoryFromPath";
import { ProductGridSkeleton } from "@/components/common/SectionSkeletons";

// Map API product to component format
const mapApiProductToComponent = (apiProduct) => {
  // Get first variant as default variant
  const defaultVariant = apiProduct.variants && apiProduct.variants.length > 0 
    ? apiProduct.variants[0] 
    : {};
  const thumbnail = apiProduct.thumbnail || {};
  
  // Get images - first image from images array or variant image
  const firstImage = apiProduct.images && apiProduct.images.length > 0 
    ? apiProduct.images[0] 
    : {};
  const variantImageId = defaultVariant.image_media_id;
  
  // Price mapping - use selling_price and mrp from product or variant
  const sellingPrice = parseFloat(apiProduct.selling_price) || parseFloat(defaultVariant.selling_price) || 0;
  const mrp = parseFloat(apiProduct.mrp) || parseFloat(defaultVariant.mrp) || null;
  const oldPrice = mrp && mrp > sellingPrice ? mrp : null;
  
  // Calculate sale percentage - use offer_percentage if available, otherwise calculate
  const offerPercentage = apiProduct.offer_percentage || defaultVariant.offer_percentage || null;
  const hasSale = oldPrice !== null || (offerPercentage && offerPercentage > 0);
  const salePercentage = offerPercentage 
    ? offerPercentage 
    : (oldPrice ? Math.round(((oldPrice - sellingPrice) / oldPrice) * 100) : null);

  // Get image URLs
  const imgSrc = thumbnail.url || firstImage.url || "/images/products/default.jpg";
  const imgHover = firstImage.url || thumbnail.url || imgSrc;

  const variants = apiProduct.variants || [];
  const options = apiProduct.options || [];
  const hasVariants = variants.length > 1 || (options && options.length > 0);

  return {
    id: apiProduct.uuid || apiProduct.id, // Use uuid as id
    uuid: apiProduct.uuid,
    title: apiProduct.name,
    slug: apiProduct.slug || apiProduct.uuid, // Use uuid as slug if slug not available
    price: sellingPrice,
    oldPrice: oldPrice,
    mrp: mrp,
    offer_percentage: offerPercentage,
    imgSrc: imgSrc,
    imgHover: imgHover,
    isOnSale: hasSale,
    salePercentage: salePercentage ? `${salePercentage}%` : null,
    hotSale: apiProduct.is_featured && hasSale,
    inStock: (defaultVariant.stock_qty && defaultVariant.stock_qty > 0) || false,
    stockQty: defaultVariant.stock_qty || 0,
    sku: defaultVariant.sku || "",
    description: apiProduct.description || "",
    category: apiProduct.category || null,
    averageRating: apiProduct.rating || apiProduct.average_rating || 0,
    reviewsCount: apiProduct.reviews_count || 0,
    // For add to cart / buy now with variants
    apiProduct: apiProduct,
    variants,
    options,
    defaultVariant: defaultVariant?.uuid ? defaultVariant : variants[0] || null,
    hasVariants,
    // Default values for filters (can be enhanced later)
    filterBrands: [],
    filterColor: [],
    filterSizes: [],
  };
};

export default function Products15({ parentClass = "flat-spacing", infiniteScroll = false, categoryIdFromPath = null }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { categoryId: categoryIdFromPathname } = useCategoryFromPath();
  const effectiveCategoryId = categoryIdFromPath ?? categoryIdFromPathname;
  const [activeLayout, setActiveLayout] = useState(4);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiProducts, setApiProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const loadMoreSentinelRef = useRef(null);
  const loadMoreRef = useRef(null);

  const {
    price,
    availability,
    color,
    size,
    brands,
    filtered,
    sortingOption,
    sorted,
    currentPage,
    itemPerPage,
  } = state;

  // Base path for product URLs: /products or /products/category/:id
  const productsBasePath = effectiveCategoryId ? `/products/category/${effectiveCategoryId}` : '/products';

  // Build API params from URL/state (optionally override page for load more)
  const buildApiParams = useCallback((pageOverride = null) => {
    const page = pageOverride !== null ? pageOverride : (parseInt(searchParams.get('page')) || 1);
    const perPage = parseInt(searchParams.get('per_page')) || 20;
    const search = searchParams.get('search') || '';
    let categoryId = effectiveCategoryId ?? searchParams.get('category_id') ?? searchParams.get('category') ?? null;
    if (categoryId != null) categoryId = String(categoryId);
    if (categoryId && !isNaN(categoryId)) categoryId = parseInt(categoryId);
    else if (categoryId && isNaN(categoryId)) categoryId = null;
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const ratingParam = searchParams.get('rating');
    const sortByParam = searchParams.get('sort_by');
    const sortOrderParam = searchParams.get('sort_order');
    let sortBy = sortByParam || 'created_at';
    let sortOrder = sortOrderParam || 'desc';
    if (!sortByParam && sortingOption) {
      if (sortingOption === "Price Ascending") { sortBy = 'price'; sortOrder = 'asc'; }
      else if (sortingOption === "Price Descending") { sortBy = 'price'; sortOrder = 'desc'; }
      else if (sortingOption === "Title Ascending") { sortBy = 'name'; sortOrder = 'asc'; }
      else if (sortingOption === "Title Descending") { sortBy = 'name'; sortOrder = 'desc'; }
    }
    const pageNum = pageOverride !== null ? pageOverride : (infiniteScroll ? 1 : (parseInt(searchParams.get('page')) || 1));
    const apiParams = { page: pageNum, per_page: perPage, sort_by: sortBy, sort_order: sortOrder };
    if (search) apiParams.search = search;
    if (categoryId) apiParams.category_id = parseInt(categoryId);
    if (ratingParam != null && ratingParam !== '') {
      const r = parseFloat(ratingParam);
      if (!isNaN(r)) apiParams.rating = r;
    }
    if (minPrice != null) { const v = parseFloat(minPrice); if (!isNaN(v)) apiParams.min_price = v; }
    else if (price && price[0] !== 0) apiParams.min_price = price[0];
    if (maxPrice != null) { const v = parseFloat(maxPrice); if (!isNaN(v)) apiParams.max_price = v; }
    else if (price && price[1] !== 20000) apiParams.max_price = price[1];
    return apiParams;
  }, [searchParams, sortingOption, price, infiniteScroll, effectiveCategoryId]);

  // Load next page and append (infinite scroll)
  const loadMore = useCallback(async () => {
    if (!pagination || pagination.current_page >= pagination.last_page || loadMoreLoading || apiLoading) return;
    setLoadMoreLoading(true);
    try {
      const nextPage = pagination.current_page + 1;
      const apiParams = buildApiParams(nextPage);
      const response = await productService.getProducts(apiParams);
      if (response.success && response.data && response.data.items) {
        const mappedProducts = response.data.items.map(mapApiProductToComponent);
        setApiProducts((prev) => [...prev, ...mappedProducts]);
        dispatch({ type: "SET_FILTERED", payload: [...apiProducts, ...mappedProducts] });
        dispatch({ type: "SET_SORTED", payload: [...apiProducts, ...mappedProducts] });
        setPagination(response.data.pagination || null);
      }
    } catch (err) {
      console.error('Error loading more products:', err);
    } finally {
      setLoadMoreLoading(false);
    }
  }, [pagination, loadMoreLoading, apiLoading, buildApiParams, apiProducts]);
  loadMoreRef.current = loadMore;

  // Intersection observer for auto load on scroll (runs when sentinel exists after first load)
  useEffect(() => {
    if (!infiniteScroll || !pagination) return;
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        const fn = loadMoreRef.current;
        if (fn) fn();
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [infiniteScroll, pagination]);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setApiLoading(true);
      setError(null);
      try {
        const page = infiniteScroll ? 1 : (parseInt(searchParams.get('page')) || 1);
        const perPage = parseInt(searchParams.get('per_page')) || 20;
        const minPrice = searchParams.get('min_price');
        const maxPrice = searchParams.get('max_price');
        const apiParams = buildApiParams(infiniteScroll ? 1 : null);
        if (!infiniteScroll) apiParams.page = page;

        if (page !== currentPage) dispatch({ type: "SET_CURRENT_PAGE", payload: page });
        if (perPage !== itemPerPage) dispatch({ type: "SET_ITEM_PER_PAGE", payload: perPage });
        const currentMinPrice = minPrice ? parseFloat(minPrice) : 0;
        const currentMaxPrice = maxPrice ? parseFloat(maxPrice) : 20000;
        if (price[0] !== currentMinPrice || price[1] !== currentMaxPrice) {
          dispatch({ type: "SET_PRICE", payload: [isNaN(currentMinPrice) ? 0 : currentMinPrice, isNaN(currentMaxPrice) ? 20000 : currentMaxPrice] });
        }

        const response = await productService.getProducts(apiParams);
        if (response.success && response.data && response.data.items) {
          const mappedProducts = response.data.items.map(mapApiProductToComponent);
          setApiProducts(mappedProducts);
          setPagination(response.data.pagination || null);
          dispatch({ type: "SET_FILTERED", payload: mappedProducts });
          dispatch({ type: "SET_SORTED", payload: mappedProducts });
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to fetch products');
        setApiProducts([]);
      } finally {
        setApiLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams, infiniteScroll, buildApiParams]);

  // Update URL params when filters change (preserves /products or /products/category/:id)
  const updateUrlParams = (updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, value.toString());
      }
    });
    params.delete('page'); // Reset to page 1 when filters change
    const query = params.toString();
    router.push(query ? `${productsBasePath}?${query}` : productsBasePath);
  };

  const allProps = {
    ...state,
    setPrice: (value) => {
      dispatch({ type: "SET_PRICE", payload: value });
      // Only update URL params if price differs from default [0, 20000]
      updateUrlParams({
        min_price: value[0] !== 0 ? value[0] : null,
        max_price: value[1] !== 20000 ? value[1] : null,
      });
    },
    setColor: (value) => {
      value == color
        ? dispatch({ type: "SET_COLOR", payload: "All" })
        : dispatch({ type: "SET_COLOR", payload: value });
    },
    setSize: (value) => {
      value == size
        ? dispatch({ type: "SET_SIZE", payload: "All" })
        : dispatch({ type: "SET_SIZE", payload: value });
    },
    setAvailability: (value) => {
      value == availability
        ? dispatch({ type: "SET_AVAILABILITY", payload: "All" })
        : dispatch({ type: "SET_AVAILABILITY", payload: value });
    },
    setBrands: (newBrand) => {
      const updated = [...brands].includes(newBrand)
        ? [...brands].filter((elm) => elm != newBrand)
        : [...brands, newBrand];
      dispatch({ type: "SET_BRANDS", payload: updated });
    },
    removeBrand: (newBrand) => {
      const updated = [...brands].filter((brand) => brand != newBrand);
      dispatch({ type: "SET_BRANDS", payload: updated });
    },
    setSortingOption: (value) => {
      dispatch({ type: "SET_SORTING_OPTION", payload: value });
      // Map sorting to API format
      let sortBy = 'created_at';
      let sortOrder = 'desc';
      if (value === "Price Ascending") {
        sortBy = 'price';
        sortOrder = 'asc';
      } else if (value === "Price Descending") {
        sortBy = 'price';
        sortOrder = 'desc';
      } else if (value === "Title Ascending") {
        sortBy = 'name';
        sortOrder = 'asc';
      } else if (value === "Title Descending") {
        sortBy = 'name';
        sortOrder = 'desc';
      }
      updateUrlParams({ sort_by: sortBy, sort_order: sortOrder });
    },
    setCurrentPage: (value) => {
      dispatch({ type: "SET_CURRENT_PAGE", payload: value });
      updateUrlParams({ page: value });
    },
    setItemPerPage: (value) => {
      dispatch({ type: "SET_CURRENT_PAGE", payload: 1 });
      dispatch({ type: "SET_ITEM_PER_PAGE", payload: value });
      updateUrlParams({ per_page: value, page: 1 });
    },
    clearFilter: () => {
      dispatch({ type: "CLEAR_FILTER" });
      router.push('/products'); // Always go to all products when clearing
    },
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    const query = params.toString();
    router.push(query ? `${productsBasePath}?${query}` : productsBasePath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <section className={parentClass}>
        <div className="container">
          <div className="tf-shop-control">
            <div className="tf-control-filter">
              <a
                href="#filterShop"
                data-bs-toggle="offcanvas"
                aria-controls="filterShop"
                className="tf-btn-filter"
              >
                <span className="icon icon-filter" />
                <span className="text">Filters</span>
              </a>
            </div>
            <ul className="tf-control-layout">
              <LayoutHandler
                setActiveLayout={setActiveLayout}
                activeLayout={activeLayout}
              />
            </ul>
            <div className="tf-control-sorting">
              <p className="d-none d-lg-block text-caption-1">Sort by:</p>
              <Sorting allProps={allProps} />
            </div>
          </div>
          <div className="wrapper-control-shop">
            <FilterMeta productLength={pagination?.total || sorted.length} allProps={allProps} />

            {apiLoading ? (
              <ProductGridSkeleton count={8} />
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No products found.</p>
              </div>
            ) : (
              <>
                {activeLayout == 1 ? (
                  <div className="tf-list-layout wrapper-shop" id="listLayout">
                    <Listview pagination={false} products={sorted} hideAddToCart={false} />
                  </div>
                ) : (
                  <div
                    className={`tf-grid-layout wrapper-shop tf-col-${activeLayout}`}
                    id="gridLayout"
                  >
                    <GridView pagination={false} products={sorted} hideAddToCart={false} />
                  </div>
                )}

                {/* Infinite scroll: Load more button + sentinel for auto-load */}
                {infiniteScroll && (
                  <>
                    <div ref={loadMoreSentinelRef} className="infinite-scroll-sentinel" style={{ height: 1, visibility: 'hidden' }} aria-hidden="true" />
                    <div className="text-center mt-4 mb-2">
                      {pagination && pagination.current_page < pagination.last_page && (
                        <button
                          type="button"
                          className="tf-btn btn-lg px-4"
                          onClick={() => loadMore()}
                          disabled={loadMoreLoading}
                        >
                          {loadMoreLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                              Loading...
                            </>
                          ) : (
                            <>Load more</>
                          )}
                        </button>
                      )}
                      {pagination && pagination.current_page >= pagination.last_page && pagination.total > 0 && (
                        <p className="text-muted small py-3 mb-0">You've seen all {pagination.total} products.</p>
                      )}
                    </div>
                  </>
                )}

                {/* API Pagination (only when not infinite scroll) */}
                {!infiniteScroll && pagination && pagination.last_page > 1 && (
                  <ul className="wg-pagination justify-content-center mt-4">
                    <li className={pagination.current_page === 1 ? 'disabled' : ''}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.current_page > 1) {
                            handlePageChange(pagination.current_page - 1);
                          }
                        }}
                        className={pagination.current_page === 1 ? 'disabled' : ''}
                      >
                        &laquo; Previous
                      </a>
                    </li>
                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((pageNum) => {
                      const showPage =
                        pageNum === 1 ||
                        pageNum === pagination.last_page ||
                        (pageNum >= pagination.current_page - 2 && pageNum <= pagination.current_page + 2);
                      if (!showPage) {
                        if (pageNum === pagination.current_page - 3 || pageNum === pagination.current_page + 3) {
                          return (
                            <li key={pageNum}>
                              <span className="ellipsis">...</span>
                            </li>
                          );
                        }
                        return null;
                      }
                      return (
                        <li key={pageNum} className={pagination.current_page === pageNum ? 'active' : ''}>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (pagination.current_page !== pageNum) {
                                handlePageChange(pageNum);
                              }
                            }}
                            className={pagination.current_page === pageNum ? 'active' : ''}
                          >
                            {pageNum}
                          </a>
                        </li>
                      );
                    })}
                    <li className={pagination.current_page === pagination.last_page ? 'disabled' : ''}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.current_page < pagination.last_page) {
                            handlePageChange(pagination.current_page + 1);
                          }
                        }}
                        className={pagination.current_page === pagination.last_page ? 'disabled' : ''}
                      >
                        Next &raquo;
                      </a>
                    </li>
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <FilterModal allProps={allProps} />
    </>
  );
}
