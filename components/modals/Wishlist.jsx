"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useContextElement } from "@/context/Context";
import { wishlistService } from "@/services/wishlistService";
import { ProductGridSkeleton } from "@/components/common/SectionSkeletons";

export default function Wishlist() {
  const { removeFromWishlist, isAuthenticated, openAuthModal } = useContextElement();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  // Fetch wishlist items from API
  const fetchWishlistItems = async (page = 1) => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      const response = await wishlistService.getWishlists({ page, per_page: 10 });
      
      if (response.success && response.data) {
        // Transform API data to match component format
        const transformedItems = response.data.map((item) => ({
          uuid: item.uuid,
          product_id: item.product_id,
          id: item.product_id, // For product detail link
          title: item.name,
          name: item.name,
          imgSrc: item.image || "/images/products/default.jpg",
          price: parseFloat(item.selling_price) || 0,
          mrp: parseFloat(item.mrp) || 0,
          offer_percentage: item.offer_percentage || 0,
          stock_qty: item.stock_qty || 0,
        }));
        setItems(transformedItems);
        setPagination(response.pagination);
      } else {
        setItems([]);
        setPagination(null);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch wishlist when modal is shown
  useEffect(() => {
    const modalElement = document.getElementById("wishlist");
    if (modalElement) {
      const handleShow = () => {
        fetchWishlistItems(1);
      };
      
      modalElement.addEventListener("shown.bs.modal", handleShow);
      
      // Also fetch on mount if modal is already shown
      const bootstrap = require("bootstrap");
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance && modalInstance._isShown) {
        fetchWishlistItems(1);
      }

      return () => {
        modalElement.removeEventListener("shown.bs.modal", handleShow);
      };
    }
  }, [isAuthenticated]);

  // Handle remove item
  const handleRemove = async (item) => {
    try {
      await removeFromWishlist(
        item.product_id,
        item.uuid, // wishlistItemUuid
        item.product_id // productUuid for API endpoint
      );
      // Refresh the wishlist after removal
      fetchWishlistItems(pagination?.current_page || 1);
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  // Handle login click - close wishlist modal and open auth modal
  const handleLoginClick = (e) => {
    e.preventDefault();
    // Close wishlist modal
    const bootstrap = require("bootstrap");
    const wishlistModalElement = document.getElementById("wishlist");
    if (wishlistModalElement) {
      const wishlistModal = bootstrap.Modal.getInstance(wishlistModalElement);
      if (wishlistModal) {
        wishlistModal.hide();
      }
    }
    // Open auth modal
    openAuthModal();
  };
  return (
    <div className="modal fullRight fade modal-wishlist" id="wishlist">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="header">
            <h5 className="title">Wish List</h5>
            <span
              className="icon-close icon-close-popup"
              data-bs-dismiss="modal"
            />
          </div>
          <div className="wrap">
            <div className="tf-mini-cart-wrap">
              <div className="tf-mini-cart-main">
                <div className="tf-mini-cart-sroll">
                  {loading ? (
                    <div className="p-4">
                      <ProductGridSkeleton count={2} />
                    </div>
                  ) : !isAuthenticated ? (
                    <div className="p-4 text-center">
                      Please login to view your wishlist.{" "}
                      <a 
                        href="#" 
                        className="btn-line" 
                        onClick={handleLoginClick}
                        style={{ textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        Login
                      </a>
                    </div>
                  ) : items.length > 0 ? (
                    <div className="tf-mini-cart-items">
                      {items.map((item) => (
                        <div key={item.uuid} className="tf-mini-cart-item file-delete">
                          <div className="tf-mini-cart-image">
                            <Link href={`/product-detail/${item.id}`}>
                              <Image
                                className="lazyload"
                                alt={item.title || item.name}
                                src={item.imgSrc}
                                width={600}
                                height={800}
                              />
                            </Link>
                          </div>
                          <div className="tf-mini-cart-info flex-grow-1">
                            <div className="mb_12 d-flex align-items-center justify-content-between flex-wrap gap-12">
                              <div className="text-title">
                                <Link
                                  href={`/product-detail/${item.id}`}
                                  className="link text-line-clamp-1"
                                >
                                  {item.title || item.name}
                                </Link>
                              </div>
                              <div
                                className="text-button tf-btn-remove remove"
                                onClick={() => handleRemove(item)}
                                style={{ cursor: 'pointer' }}
                              >
                                Remove
                              </div>
                            </div>
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-12">
                              {item.offer_percentage > 0 && item.mrp > item.price && (
                                <div className="text-secondary-2" style={{ textDecoration: 'line-through' }}>
                                  ₹{item.mrp.toFixed(2)}
                                </div>
                              )}
                              <div className="text-button">
                                ₹{item.price.toFixed(2)}
                                {item.offer_percentage > 0 && (
                                  <span className="text-critical ms-2">
                                    -{item.offer_percentage}%
                                  </span>
                                )}
                              </div>
                            </div>
                            {item.stock_qty === 0 && (
                              <div className="text-danger small mt-2">Out of Stock</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4">
                      Your wishlist is empty. Start adding your favorite
                      products to save them for later!{" "}
                      <Link className="btn-line" href="/products">
                        Explore Products
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              <div className="tf-mini-cart-bottom">
                <Link
                  href={`/wish-list`}
                  className="btn-style-2 w-100 radius-4 view-all-wishlist"
                >
                  <span className="text-btn-uppercase">View All Wish List</span>
                </Link>
                <Link
                  href={`/products`}
                  className="text-btn-uppercase"
                >
                  Or continue shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
