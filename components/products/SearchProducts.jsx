"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard1 from "../productCards/ProductCard1";
import Link from "next/link";
import { productService } from "@/services/productService";
import { ProductGridSkeleton } from "@/components/common/SectionSkeletons";
import Pagination from "../common/Pagination";
import { getColorVariantImage, resolveMediaUrl } from "@/utils/productImages";

// Transform API product to ProductCard1 format (same as SearchModal)
const transformProduct = (apiProduct) => {
  const hasOffer = apiProduct.offer_percentage > 0;
  const mrp = parseFloat(apiProduct.mrp) || 0;
  const sellingPrice = parseFloat(apiProduct.selling_price) || 0;
  
  const thumbnailUrl =
    resolveMediaUrl(apiProduct.thumbnail) ||
    resolveMediaUrl(apiProduct.images?.[0]) ||
    "/images/products/default.jpg";

  const hoverImageUrl =
    resolveMediaUrl(apiProduct.images?.[1]) || thumbnailUrl;

  const colors = [];
  if (apiProduct.options && apiProduct.options.length > 0) {
    const colorOption = apiProduct.options.find(
      (opt) =>
        opt.name.toLowerCase() === "color" || opt.name.toLowerCase() === "colour",
    );

    if (colorOption?.values?.length) {
      colorOption.values.forEach((colorValue, index) => {
        colors.push({
          imgSrc: getColorVariantImage(apiProduct, colorOption, colorValue, index),
          bgColor: getColorClass(colorValue),
        });
      });
    }
  }

  return {
    id: apiProduct.uuid,
    uuid: apiProduct.uuid,
    product_id: apiProduct.uuid,
    title: apiProduct.name,
    price: sellingPrice,
    oldPrice: hasOffer && mrp > sellingPrice ? mrp : null,
    imgSrc: thumbnailUrl,
    imgHover: hoverImageUrl,
    isOnSale: hasOffer,
    salePercentage: hasOffer ? `${Math.round(apiProduct.offer_percentage)}%` : null,
    offer_percentage: apiProduct.offer_percentage || 0,
    is_wishlisted: apiProduct.is_wishlisted || false,
    colors: colors.length > 0 ? colors : undefined,
  };
};

// Helper function to get color class from color name
const getColorClass = (colorName) => {
  const colorMap = {
    'white': 'bg-white',
    'black': 'bg-black',
    'red': 'bg-red',
    'blue': 'bg-blue',
    'green': 'bg-green',
    'yellow': 'bg-yellow',
    'orange': 'bg-orange',
    'grey': 'bg-grey',
    'gray': 'bg-grey',
    'pink': 'bg-pink',
    'purple': 'bg-purple',
    'brown': 'bg-brown',
  };
  
  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || 'bg-grey';
};

export default function SearchProducts() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Get search query from URL
  const queryParam = searchParams.get('q') || searchParams.get('search') || '';

  // Fetch search results
  const fetchSearchResults = useCallback(async (query, page = 1) => {
    if (!query || query.trim().length < 1) {
      setResults([]);
      setSuggestions([]);
      setPagination(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await productService.searchProducts({ 
        q: query.trim(),
        per_page: 20,
        include_suggestions: true
      });
      
      if (response.success && response.data) {
        const transformedResults = (response.data.results || []).map(transformProduct);
        const transformedSuggestions = (response.data.suggestions || []).map(transformProduct);
        
        setResults(transformedResults);
        setSuggestions(transformedSuggestions);
        setPagination(response.data.pagination || null);
      }
    } catch (err) {
      console.error("Error in search:", err);
      setError(err.message || "Search failed");
      setResults([]);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load search results when query param changes
  useEffect(() => {
    if (queryParam) {
      fetchSearchResults(queryParam);
    } else {
      setResults([]);
      setSuggestions([]);
    }
  }, [queryParam, fetchSearchResults]);

  // Handle pagination
  const handlePageChange = (page) => {
    if (queryParam) {
      router.push(`/search-result?q=${encodeURIComponent(queryParam)}&page=${page}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Search Results */}
      {queryParam && (
        <section className="flat-spacing pt-4">
          <div className="container">
            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            ) : (
              <>
                {/* Search Results */}
                {results.length > 0 ? (
                  <>
                    <div className="heading-section wow fadeInUp mb-4">
                      <h5 className="heading">
                        Search results for "{queryParam}"
                        {pagination && (
                          <span className="text-muted ms-2">
                            ({pagination.total} {pagination.total === 1 ? 'product' : 'products'})
                          </span>
                        )}
                      </h5>
                    </div>
                    <div className="tf-grid-layout tf-col-2 lg-col-3 xl-col-4">
                      {results.map((product) => (
                        <ProductCard1 product={product} key={product.uuid || product.id} />
                      ))}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.last_page > 1 && (
                      <ul className="wg-pagination justify-content-center mt-4">
                        <Pagination
                          currentPage={pagination.current_page}
                          totalPages={pagination.last_page}
                          onPageChange={handlePageChange}
                        />
                      </ul>
                    )}
                  </>
                ) : queryParam.trim().length >= 1 ? (
                  <div className="text-center py-5">
                    <h3 className="heading mb-3">No products found</h3>
                    <p className="text-muted">We couldn't find any products matching "{queryParam}"</p>
                    <Link href="/products" className="btn-main mt-3">
                      Browse All Products
                    </Link>
                  </div>
                ) : null}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="mt-5">
                    <div className="heading-section wow fadeInUp mb-4">
                      <h5 className="heading">You might also like</h5>
                    </div>
                    <div className="tf-grid-layout tf-col-2 lg-col-3 xl-col-4">
                      {suggestions.map((product) => (
                        <ProductCard1 product={product} key={product.uuid || product.id} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* Show suggestions when no search query */}
      {!queryParam && (
        <section className="flat-spacing pt-0">
          <div className="container">
            <div className="heading-section text-center wow fadeInUp">
              <h3 className="heading">Start searching to find products</h3>
              <p className="text-muted mt-2">Enter a search term above to find products</p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
