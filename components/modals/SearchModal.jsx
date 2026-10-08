"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProductCard1 from "../productCards/ProductCard1";
import { productService } from "@/services/productService";
import { ProductGridSkeleton } from "@/components/common/SectionSkeletons";

export default function SearchModal() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Transform API product to ProductCard1 format
  const transformProduct = useCallback((apiProduct) => {
    const hasOffer = apiProduct.offer_percentage > 0;
    const mrp = parseFloat(apiProduct.mrp) || 0;
    const sellingPrice = parseFloat(apiProduct.selling_price) || 0;
    
    // Get thumbnail image
    const thumbnailUrl = apiProduct.thumbnail?.url || 
                        (apiProduct.images && apiProduct.images.length > 0 ? apiProduct.images[0].url : null) ||
                        "/images/products/default.jpg";
    
    // Get hover image (second image if available, otherwise same as thumbnail)
    const hoverImageUrl = apiProduct.images && apiProduct.images.length > 1 
      ? apiProduct.images[1].url 
      : thumbnailUrl;

    // Build colors array from variants if options exist
    const colors = [];
    if (apiProduct.options && apiProduct.options.length > 0) {
      const colorOption = apiProduct.options.find(opt => 
        opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour'
      );
      
      if (colorOption && colorOption.values && colorOption.values.length > 0) {
        colorOption.values.forEach((colorValue, index) => {
          // Use different images for color variants if available
          // Try to get a variant-specific image, otherwise use thumbnail
          let variantImage = thumbnailUrl;
          
          if (apiProduct.variants && apiProduct.variants.length > 0) {
            // Find variant with this color
            const variantWithColor = apiProduct.variants.find(v => 
              v.name && v.name.toLowerCase().includes(colorValue.toLowerCase())
            );
            
            // If variant has image_media_id, try to find corresponding image
            // Note: API images array may not have id field, so we'll use index-based or fallback
            if (variantWithColor && apiProduct.images && apiProduct.images.length > index) {
              variantImage = apiProduct.images[index]?.url || thumbnailUrl;
            }
          }

          colors.push({
            imgSrc: variantImage,
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
  }, []);

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

  // Debounced autocomplete search
  const handleAutocomplete = useCallback(async (query) => {
    if (!query || query.trim().length < 1) {
      // Load initial suggestions when query is empty
      try {
        setLoading(true);
        setError(null);
        const response = await productService.searchAutocomplete({ limit: 8 });
        
        if (response.success && response.data) {
          const transformedProducts = (response.data.products || []).map(transformProduct);
          setProducts(transformedProducts);
          setSuggestions([]);
          setNameSuggestions([]);
          setHasSearched(false);
        }
      } catch (err) {
        console.error("Error loading suggestions:", err);
        setError(err.message || "Failed to load suggestions");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Allow single letter searches
    try {
      setLoading(true);
      setError(null);
      const response = await productService.searchAutocomplete({ 
        q: query.trim(), 
        limit: 5 
      });
      
      if (response.success && response.data) {
        const transformedProducts = (response.data.products || []).map(transformProduct);
        setProducts(transformedProducts);
        setNameSuggestions(response.data.suggestions || []);
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Error in autocomplete:", err);
      setError(err.message || "Search failed");
      setProducts([]);
      setNameSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [transformProduct]);

  // Full search on form submit
  const handleSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 1) {
      // If query is empty, just load suggestions
      await handleAutocomplete("");
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      setHasSearched(true);
      
      const response = await productService.searchProducts({ 
        q: query.trim(),
        per_page: 20,
        include_suggestions: true
      });
      
      if (response.success && response.data) {
        const transformedResults = (response.data.results || []).map(transformProduct);
        const transformedSuggestions = (response.data.suggestions || []).map(transformProduct);
        
        setProducts(transformedResults);
        setSuggestions(transformedSuggestions);
        setNameSuggestions([]);
      }
    } catch (err) {
      console.error("Error in search:", err);
      setError(err.message || "Search failed");
      setProducts([]);
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, [transformProduct, handleAutocomplete]);

  // Handle input change with debounce
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced autocomplete
    debounceTimerRef.current = setTimeout(() => {
      handleAutocomplete(value);
    }, 300);
  }, [handleAutocomplete]);

  // Handle form submit - redirect to search results page
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    const query = searchQuery.trim();
    if (query.length >= 1) {
      // Close modal and redirect to search results page
      const modalElement = document.getElementById('search');
      if (modalElement) {
        const bootstrap = require("bootstrap");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
          modalInstance.hide();
        }
      }
      router.push(`/search-result?q=${encodeURIComponent(query)}`);
    } else {
      // If query is empty, just do local search
      handleSearch(searchQuery);
    }
  }, [searchQuery, handleSearch, router]);

  // Load initial suggestions when modal opens
  useEffect(() => {
    const modalElement = document.getElementById('search');
    if (modalElement) {
      const handleModalShow = () => {
        // Reset state when modal opens
        setSearchQuery("");
        setProducts([]);
        setSuggestions([]);
        setNameSuggestions([]);
        setError(null);
        setHasSearched(false);
        // Load initial suggestions
        handleAutocomplete("");
        // Focus input after a short delay to ensure modal is fully shown
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 300);
      };

      modalElement.addEventListener('shown.bs.modal', handleModalShow);
      
      return () => {
        modalElement.removeEventListener('shown.bs.modal', handleModalShow);
      };
    }
  }, [handleAutocomplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Determine what to display
  const displayProducts = hasSearched && searchQuery.trim().length >= 1 
    ? products 
    : (products.length > 0 ? products : []);

  const showSuggestions = hasSearched && suggestions.length > 0;
  const showNameSuggestions = nameSuggestions.length > 0 && !hasSearched;
  const showRecentProducts = !hasSearched && searchQuery.trim().length === 0;

  return (
    <div className="modal fade modal-search" id="search">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="d-flex justify-content-between align-items-center">
            <h5>Search</h5>
            <span
              className="icon-close icon-close-popup"
              data-bs-dismiss="modal"
            />
          </div>
          <form className="form-search" onSubmit={handleSubmit}>
            <fieldset className="text">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Searching..."
                className=""
                name="text"
                tabIndex={0}
                value={searchQuery}
                onChange={handleInputChange}
                aria-required="true"
              />
            </fieldset>
            <button 
              className="" 
              type="submit"
              disabled={searchLoading}
            >
              {searchLoading ? (
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

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger mt-3" role="alert">
              {error}
            </div>
          )}

          {/* Name Suggestions */}
          {showNameSuggestions && (
            <div className="mt-3">
              <h6 className="mb_16">Suggestions</h6>
              <ul className="list-unstyled">
                {nameSuggestions.map((suggestion, index) => (
                  <li 
                    key={index}
                    className="mb-2 cursor-pointer"
                    onClick={() => {
                      setSearchQuery(suggestion.text);
                      handleSearch(suggestion.text);
                    }}
                    style={{ cursor: 'pointer', padding: '8px', borderRadius: '4px' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {suggestion.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Loading State */}
          {(loading || searchLoading) && displayProducts.length === 0 && (
            <div className="py-3 px-2">
              <ProductGridSkeleton count={4} />
            </div>
          )}

          {/* Search Results or Suggestions */}
          <div className="search-results-container">
            {!loading && !searchLoading && (
              <>
                {displayProducts.length > 0 ? (
                  <div>
                    <h6 className="mb_16">
                      {hasSearched && searchQuery.trim().length >= 1 
                        ? `Search results for "${searchQuery}"` 
                        : showRecentProducts 
                          ? "Suggested Products" 
                          : "Products"}
                    </h6>
                    <div className="tf-grid-layout tf-col-2 lg-col-3 xl-col-4">
                      {displayProducts.map((product) => (
                        <ProductCard1 product={product} key={product.uuid || product.id} />
                      ))}
                    </div>
                  </div>
                ) : hasSearched && searchQuery.trim().length >= 1 ? (
                  <div className="text-center py-5">
                    <p>No products found for "{searchQuery}"</p>
                  </div>
                ) : null}

                {/* Additional Suggestions Section (from full search) */}
                {showSuggestions && (
                  <div className="mt-4">
                    <h6 className="mb_16">You might also like</h6>
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
        </div>
      </div>
    </div>
  );
}
