"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { orderService } from "@/services/orderService";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { AccountOrdersSkeleton } from "@/components/common/SectionSkeletons";

export default function Orers() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Intersection observer for infinite scroll
  const [loadMoreRef, hasIntersected] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "100px",
  });

  useEffect(() => {
    fetchOrders(1, true);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter((order) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          order.order_number?.toLowerCase().includes(searchLower) ||
          order.items?.some((item) =>
            item.name?.toLowerCase().includes(searchLower)
          )
        );
      });
      setFilteredOrders(filtered);
    }
  }, [searchQuery, orders]);

  const fetchOrders = async (page = 1, isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const response = await orderService.getOrders({ per_page: 10, page });
      if (response.success && response.data) {
        if (isInitial) {
          setOrders(response.data);
          setFilteredOrders(response.data);
        } else {
          setOrders((prev) => [...prev, ...response.data]);
          setFilteredOrders((prev) => [...prev, ...response.data]);
        }
        setPagination(response.pagination);
        setCurrentPage(page);
        setHasMore(
          response.pagination?.current_page < response.pagination?.last_page
        );
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreOrders = useCallback(() => {
    if (hasMore && !loadingMore && pagination) {
      const nextPage = currentPage + 1;
      fetchOrders(nextPage, false);
    }
  }, [hasMore, loadingMore, currentPage, pagination]);

  // Load more when intersection observer triggers
  useEffect(() => {
    if (hasIntersected && hasMore && !loadingMore && !loading) {
      loadMoreOrders();
    }
  }, [hasIntersected, hasMore, loadingMore, loading, loadMoreOrders]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "delivered") return "green";
    if (statusLower === "cancelled" || statusLower === "refunded") return "red";
    return "gray";
  };

  const getStatusText = (order) => {
    const statusLower = order.status?.toLowerCase();
    if (statusLower === "delivered") {
      return `Delivered on ${formatDate(order.ordered_on)}`;
    }
    if (statusLower === "cancelled") {
      return `Cancelled on ${formatDate(order.ordered_on)}`;
    }
    if (statusLower === "refunded") {
      return "Refund completed";
    }
    return order.status || "Pending";
  };

  const getStatusMessage = (order) => {
    const statusLower = order.status?.toLowerCase();
    if (statusLower === "delivered") {
      return "Your item has been delivered";
    }
    if (statusLower === "cancelled" || statusLower === "refunded") {
      return "As per your request, your item has been cancelled";
    }
    return "";
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by useEffect
  };

  if (loading) {
    return (
      <div className="my-account-content">
        <div className="account-orders">
          <AccountOrdersSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="my-account-content">
      <div className="account-orders">
        <h3 className="mb-4" style={{ fontSize: "24px", fontWeight: "600", color: "#0F1111" }}>
          Your Orders
        </h3>

        {/* Search Bar */}
        <div className="mb-4" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search your orders"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 15px",
              border: "1px solid #D5D9D9",
              borderRadius: "8px",
              fontSize: "14px",
              backgroundColor: "#fff",
            }}
          />
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div
            className="text-center py-5"
            style={{
              backgroundColor: "#fff",
              border: "1px solid #D5D9D9",
              borderRadius: "8px",
              padding: "40px 20px",
            }}
          >
            <p style={{ fontSize: "16px", color: "#565959", margin: 0 }}>
              {searchQuery ? "No orders found matching your search." : "You haven't placed any orders yet."}
            </p>
          </div>
        ) : (
          <div className="orders-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredOrders.map((order) => {
              const firstItem = order.items?.[0];
              const statusColor = getStatusColor(order.status);
              const statusText = getStatusText(order);
              const statusMessage = getStatusMessage(order);
              const itemCount = order.items?.length || 0;

              return (
                <div
                  key={order.uuid}
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #D5D9D9",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  {/* Order Header */}
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid #E7E7E7",
                      backgroundColor: "#F8F9FA",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#0F1111" }}>
                          ORDER PLACED
                        </span>
                        <span style={{ fontSize: "14px", color: "#565959" }}>
                          {formatFullDate(order.ordered_on)}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#0F1111" }}>
                          TOTAL
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#0F1111" }}>
                          ₹{parseFloat(order.total || 0).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#0F1111" }}>
                          ORDER #
                        </span>
                        <span style={{ fontSize: "14px", color: "#007185", cursor: "pointer" }}>
                          {order.order_number}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/my-account-orders-details/${order.uuid}`}
                      style={{
                        padding: "8px 16px",
                        border: "1px solid #D5D9D9",
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                        color: "#0F1111",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#F7FAFA";
                        e.currentTarget.style.borderColor = "#007185";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#fff";
                        e.currentTarget.style.borderColor = "#D5D9D9";
                      }}
                    >
                      Order Details
                    </Link>
                  </div>

                  {/* Order Items */}
                  <div style={{ padding: "20px" }}>
                    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                      {/* Product Image */}
                      {firstItem?.image && (
                        <div style={{ flexShrink: 0 }}>
                          <Image
                            src={firstItem.image}
                            alt={firstItem.name || "Product"}
                            width={120}
                            height={120}
                            style={{
                              objectFit: "cover",
                              borderRadius: "4px",
                              border: "1px solid #E7E7E7",
                            }}
                          />
                        </div>
                      )}

                      {/* Product Details */}
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: "12px" }}>
                          <Link
                            href={`/my-account-orders-details/${order.uuid}`}
                            style={{
                              fontSize: "16px",
                              fontWeight: "500",
                              color: "#007185",
                              textDecoration: "none",
                              lineHeight: "1.4",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "#C7511F";
                              e.currentTarget.style.textDecoration = "underline";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "#007185";
                              e.currentTarget.style.textDecoration = "none";
                            }}
                          >
                            {firstItem?.name || "Product"}
                          </Link>
                          {itemCount > 1 && (
                            <span style={{ fontSize: "14px", color: "#565959", marginLeft: "8px" }}>
                              +{itemCount - 1} more item{itemCount - 1 > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        {/* Variant Details */}
                        {firstItem?.option_values && firstItem.option_values.length > 0 && (
                          <div style={{ marginBottom: "8px", fontSize: "14px", color: "#565959" }}>
                            {firstItem.option_values.map((opt, idx) => (
                              <span key={idx}>
                                {opt.option_name}: {opt.value}
                                {idx < firstItem.option_values.length - 1 && ", "}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Status */}
                        <div style={{ marginBottom: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <div
                              style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                backgroundColor:
                                  statusColor === "green"
                                    ? "#28a745"
                                    : statusColor === "red"
                                    ? "#dc3545"
                                    : "#FFA500",
                              }}
                            />
                            <span style={{ fontSize: "14px", fontWeight: "500", color: "#0F1111" }}>
                              {statusText}
                            </span>
                          </div>
                          {statusMessage && (
                            <div
                              style={{
                                fontSize: "13px",
                                color: "#565959",
                                marginLeft: "18px",
                              }}
                            >
                              {statusMessage}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
                          {order.status?.toLowerCase() === "delivered" && order.can_review && (
                            <Link
                              href={`/my-account-orders-details/${order.uuid}`}
                              style={{
                                padding: "6px 12px",
                                border: "1px solid #D5D9D9",
                                borderRadius: "6px",
                                backgroundColor: "#fff",
                                color: "#0F1111",
                                textDecoration: "none",
                                fontSize: "13px",
                                fontWeight: "500",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#F7FAFA";
                                e.currentTarget.style.borderColor = "#007185";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#fff";
                                e.currentTarget.style.borderColor = "#D5D9D9";
                              }}
                            >
                              <i className="icon icon-star" style={{ fontSize: "14px" }} />
                              Rate & Review
                            </Link>
                          )}
                          {order.payment_status?.toLowerCase() === "paid" && (
                            <Link
                              href={`/my-account-orders-details/${order.uuid}`}
                              style={{
                                padding: "6px 12px",
                                border: "1px solid #D5D9D9",
                                borderRadius: "6px",
                                backgroundColor: "#fff",
                                color: "#0F1111",
                                textDecoration: "none",
                                fontSize: "13px",
                                fontWeight: "500",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#F7FAFA";
                                e.currentTarget.style.borderColor = "#007185";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#fff";
                                e.currentTarget.style.borderColor = "#D5D9D9";
                              }}
                            >
                              View Invoice
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Infinite Scroll Trigger */}
            {hasMore && (
              <div ref={loadMoreRef} style={{ padding: "20px", textAlign: "center" }}>
                {loadingMore && (
                  <div>
                    <div className="spinner-border text-primary" role="status" style={{ width: "2rem", height: "2rem" }}>
                      <span className="visually-hidden">Loading more...</span>
                    </div>
                    <p className="mt-2" style={{ fontSize: "14px", color: "#565959" }}>
                      Loading more orders...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* End of List Message */}
            {!hasMore && filteredOrders.length > 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#565959",
                  fontSize: "14px",
                }}
              >
                You've reached the end of your orders
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
