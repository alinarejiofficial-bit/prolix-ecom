"use client";

import { useContextElement } from "@/context/Context";
import { useEffect, useState } from "react";
import ProductCard1 from "../productCards/ProductCard1";
import Pagination from "../common/Pagination";
import Link from "next/link";
import { wishlistService } from "@/services/wishlistService";
import { WishlistPageSkeleton } from "@/components/common/SectionSkeletons";

export default function Wishlist() {
  const { isAuthenticated } = useContextElement();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Transform API data to match ProductCard1 format
  const transformProduct = (item) => {
    const hasOffer = item.offer_percentage > 0;
    const mrp = parseFloat(item.mrp) || 0;
    const sellingPrice = parseFloat(item.selling_price) || 0;
    
    return {
      id: item.product_id, // Use product_id for product detail link
      uuid: item.uuid, // Keep wishlist item uuid for removal
      title: item.name,
      price: sellingPrice,
      oldPrice: hasOffer && mrp > sellingPrice ? mrp : null,
      imgSrc: item.image || "/images/products/default.jpg",
      imgHover: item.image || "/images/products/default.jpg",
      isOnSale: hasOffer,
      salePercentage: hasOffer ? `${Math.round(item.offer_percentage)}%` : null,
      stock_qty: item.stock_qty,
      is_wishlisted: true, // Mark as wishlisted since it's from wishlist page
    };
  };

  const fetchWishlists = async (page = 1) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await wishlistService.getWishlists({ page, per_page: 10 });
      
      if (response.success && response.data) {
        const transformedItems = response.data.map(transformProduct);
        setItems(transformedItems);
        setPagination(response.pagination);
        setCurrentPage(page);
      } else {
        setItems([]);
        setPagination(null);
      }
    } catch (error) {
      console.error("Error fetching wishlists:", error);
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWishlist = async (uuid) => {
    try {
      await wishlistService.removeWishlist(uuid);
      // If current page has only one item, go to previous page if available
      if (items.length === 1 && currentPage > 1) {
        fetchWishlists(currentPage - 1);
      } else {
        // Refresh the wishlist after removal
        fetchWishlists(currentPage);
      }
    } catch (error) {
      console.error("Error removing wishlist item:", error);
      alert(error.message || "Failed to remove item from wishlist");
    }
  };

  useEffect(() => {
    fetchWishlists(1);
  }, [isAuthenticated]);

  const handlePageChange = (page) => {
    fetchWishlists(page);
  };

  if (loading) {
    return <WishlistPageSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <section className="flat-spacing">
        <div className="container">
          <div className="p-5 text-center">
            Please login to view your wishlist.
            <Link className="btn-line ms-2" href="/login">
              Login
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flat-spacing">
      <div className="container">
        {items.length > 0 ? (
          <>
            <div className="tf-grid-layout tf-col-2 md-col-3 xl-col-4">
              {/* card product 1 */}
              {items.map((product) => (
                <div key={product.uuid} className="position-relative">
                  <ProductCard1 product={product} />
                  <button
                    className="box-icon wishlist btn-icon-action position-absolute"
                    style={{ 
                      top: '10px', 
                      right: '10px', 
                      zIndex: 10,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveWishlist(product.uuid);
                    }}
                    title="Remove from wishlist"
                  >
                    <span className="icon icon-close" style={{ color: '#dc3545' }}></span>
                  </button>
                </div>
              ))}
            </div>

            {/* pagination */}
            {pagination && pagination.last_page > 1 && (
              <ul className="wg-pagination justify-content-center mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.last_page}
                  onPageChange={handlePageChange}
                />
              </ul>
            )}
          </>
        ) : (
          <div className="p-5 text-center">
            Your wishlist is empty. Start adding your favorite products to save
            them for later!{" "}
            <Link className="btn-line" href="/products">
              Explore Products
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
