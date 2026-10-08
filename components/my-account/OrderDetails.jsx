"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { orderService } from "@/services/orderService";
import { OrderDetailsSkeleton } from "@/components/common/SectionSkeletons";

export default function OrderDetails({ orderUuid: propOrderUuid }) {
  const params = useParams();
  const orderUuid = propOrderUuid || params?.uuid;
  const [activeTab, setActiveTab] = useState(1);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => {
    if (orderUuid) {
      fetchOrderDetails();
    }
  }, [orderUuid]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getOrderByUuid(orderUuid);
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        setError("Order not found");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError(err.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("en-IN", options);
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("en-IN", options);
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "delivered") return "badge-success";
    if (statusLower === "cancelled" || statusLower === "refunded")
      return "badge-danger";
    if (statusLower === "processing" || statusLower === "shipped")
      return "badge-warning";
    return "badge-secondary";
  };

  const handleDownloadInvoice = async () => {
    if (!orderUuid) return;
    
    try {
      setDownloadingInvoice(true);
      await orderService.downloadInvoice(orderUuid);
    } catch (err) {
      console.error("Error downloading invoice:", err);
      alert(err.message || "Failed to download invoice. Please try again.");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="my-account-content">
        <div className="account-order-details">
          <OrderDetailsSkeleton />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="my-account-content">
        <div className="account-order-details">
          <div className="text-center py-4 text-danger">
            {error || "Order not found"}
          </div>
        </div>
      </div>
    );
  }

  const firstItem = order.items?.[0];
  const shippingAddress = order.shipping_address;

  return (
    <div className="my-account-content">
      <div className="account-order-details">
        <div className="wd-form-order">
          <div className="order-head">
            {firstItem?.product_image && (
              <figure className="img-product">
                <Image
                  alt={firstItem.product_name || "Product"}
                  src={firstItem.product_image}
                  width={600}
                  height={800}
                />
              </figure>
            )}
            <div className="content">
              <div className={`badge ${getStatusBadgeClass(order.status)}`}>
                {order.status || "Pending"}
              </div>
              <h6 className="mt-8 fw-5">Order {order.order_number}</h6>
              <div className="mt-8">
                <button
                  onClick={handleDownloadInvoice}
                  disabled={downloadingInvoice}
                  className="tf-btn btn-fill radius-4"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    opacity: downloadingInvoice ? 0.6 : 1,
                    cursor: downloadingInvoice ? "not-allowed" : "pointer",
                  }}
                >
                  {downloadingInvoice ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span className="text">Downloading...</span>
                    </>
                  ) : (
                    <>
                      <i className="icon icon-download" style={{ fontSize: "16px" }} />
                      <span className="text">Download Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="tf-grid-layout md-col-2 gap-15">
            <div className="item">
              <div className="text-2 text_black-2">Order Date</div>
              <div className="text-2 mt_4 fw-6">
                {formatDate(order.ordered_on)}
              </div>
            </div>
            <div className="item">
              <div className="text-2 text_black-2">Order Number</div>
              <div className="text-2 mt_4 fw-6">{order.order_number}</div>
            </div>
            <div className="item">
              <div className="text-2 text_black-2">Payment Status</div>
              <div className="text-2 mt_4 fw-6">
                {order.payment_status || "N/A"}
              </div>
            </div>
            <div className="item">
              <div className="text-2 text_black-2">Payment Method</div>
              <div className="text-2 mt_4 fw-6">
                {order.payment_method || "N/A"}
              </div>
            </div>
            {shippingAddress && (
              <div className="item">
                <div className="text-2 text_black-2">Shipping Address</div>
                <div className="text-2 mt_4 fw-6">
                  {[
                    shippingAddress.address_line_1,
                    shippingAddress.address_line_2,
                    shippingAddress.city,
                    shippingAddress.state,
                    shippingAddress.postal_code,
                    shippingAddress.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>
            )}
          </div>
          <div className="widget-tabs style-3 widget-order-tab">
            <ul className="widget-menu-tab">
              <li
                className={`item-title ${activeTab == 1 ? "active" : ""} `}
                onClick={() => setActiveTab(1)}
              >
                <span className="inner">Order History</span>
              </li>
              <li
                className={`item-title ${activeTab == 2 ? "active" : ""} `}
                onClick={() => setActiveTab(2)}
              >
                <span className="inner">Item Details</span>
              </li>
              <li
                className={`item-title ${activeTab == 3 ? "active" : ""} `}
                onClick={() => setActiveTab(3)}
              >
                <span className="inner">Payment Details</span>
              </li>
              <li
                className={`item-title ${activeTab == 4 ? "active" : ""} `}
                onClick={() => setActiveTab(4)}
              >
                <span className="inner">Order Summary</span>
              </li>
            </ul>
            <div className="widget-content-tab">
              {/* Order History Tab */}
              <div
                className={`widget-content-inner ${
                  activeTab == 1 ? "active" : ""
                } `}
              >
                <div className="widget-timeline">
                  <ul className="timeline">
                    {order.status_history && order.status_history.length > 0 ? (
                      order.status_history.map((history, index) => (
                        <li key={index}>
                          <div
                            className={`timeline-badge ${
                              history.status?.toLowerCase() === "delivered" ||
                              history.status?.toLowerCase() === "completed"
                                ? "success"
                                : ""
                            }`}
                          />
                          <div className="timeline-box">
                            <a className="timeline-panel" href="#">
                              <div className="text-2 fw-6">
                                {history.status || "Status Update"}
                              </div>
                              <span>
                                {formatDateShort(history.created_at || history.updated_at)}
                              </span>
                            </a>
                            {history.notes && <p>{history.notes}</p>}
                          </div>
                        </li>
                      ))
                    ) : (
                      <li>
                        <div className="timeline-badge" />
                        <div className="timeline-box">
                          <a className="timeline-panel" href="#">
                            <div className="text-2 fw-6">Order Placed</div>
                            <span>{formatDateShort(order.ordered_on)}</span>
                          </a>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Item Details Tab */}
              <div
                className={`widget-content-inner ${
                  activeTab == 2 ? "active" : ""
                } `}
              >
                {order.items && order.items.length > 0 ? (
                  <div>
                    {order.items.map((item, index) => (
                      <div key={index} className="mb-4">
                        <div className="order-head">
                          {item.product_image && (
                            <figure className="img-product">
                              <Image
                                alt={item.product_name || "Product"}
                                src={item.product_image}
                                width={600}
                                height={800}
                              />
                            </figure>
                          )}
                          <div className="content">
                            <div className="text-2 fw-6">
                              {item.product_name || "Product"}
                            </div>
                            {item.variant_details && (
                              <div className="mt_4">
                                <span className="fw-6">Variant :</span>{" "}
                                {item.variant_details}
                              </div>
                            )}
                            <div className="mt_4">
                              <span className="fw-6">Price :</span> ₹
                              {item.price?.toLocaleString("en-IN") || "0"}
                            </div>
                            {item.quantity && (
                              <div className="mt_4">
                                <span className="fw-6">Quantity :</span>{" "}
                                {item.quantity}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No items found in this order.</p>
                )}
              </div>

              {/* Payment Details Tab */}
              <div
                className={`widget-content-inner ${
                  activeTab == 3 ? "active" : ""
                } `}
              >
                {order.payments && order.payments.length > 0 ? (
                  <div>
                    {order.payments.map((payment, index) => (
                      <div key={index} className="mb-4">
                        <ul>
                          <li className="d-flex justify-content-between text-2">
                            <span>Payment Method</span>
                            <span className="fw-6">
                              {payment.method || order.payment_method || "N/A"}
                            </span>
                          </li>
                          <li className="d-flex justify-content-between text-2 mt_4">
                            <span>Amount</span>
                            <span className="fw-6">
                              ₹{payment.amount?.toLocaleString("en-IN") || "0"}
                            </span>
                          </li>
                          <li className="d-flex justify-content-between text-2 mt_4">
                            <span>Status</span>
                            <span className="fw-6">
                              {payment.status || order.payment_status || "N/A"}
                            </span>
                          </li>
                          {payment.transaction_id && (
                            <li className="d-flex justify-content-between text-2 mt_4">
                              <span>Transaction ID</span>
                              <span className="fw-6">
                                {payment.transaction_id}
                              </span>
                            </li>
                          )}
                          {payment.paid_at && (
                            <li className="d-flex justify-content-between text-2 mt_4">
                              <span>Paid At</span>
                              <span className="fw-6">
                                {formatDate(payment.paid_at)}
                              </span>
                            </li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <ul>
                      <li className="d-flex justify-content-between text-2">
                        <span>Payment Method</span>
                        <span className="fw-6">
                          {order.payment_method || "N/A"}
                        </span>
                      </li>
                      <li className="d-flex justify-content-between text-2 mt_4">
                        <span>Payment Status</span>
                        <span className="fw-6">
                          {order.payment_status || "N/A"}
                        </span>
                      </li>
                      {Number(order.prebooking_amount_paid) > 0 && (
                        <li className="d-flex justify-content-between text-2 mt_4">
                          <span>Advance Deposit Paid</span>
                          <span className="fw-6 text-success">
                            ₹{Number(order.prebooking_amount_paid)?.toLocaleString("en-IN")}
                          </span>
                        </li>
                      )}
                      {Number(order.balance_amount) > 0 && (
                        <li className="d-flex justify-content-between text-2 mt_4">
                          <span>Balance Due on Delivery</span>
                          <span className="fw-6 text-danger">
                            ₹{Number(order.balance_amount)?.toLocaleString("en-IN")}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Order Summary Tab */}
              <div
                className={`widget-content-inner ${
                  activeTab == 4 ? "active" : ""
                } `}
              >
                <p className="text-2 text-success">
                  Thank you! Your order has been received.
                </p>
                <ul className="mt_20">
                  <li>
                    Order Number : <span className="fw-7">{order.order_number}</span>
                  </li>
                  <li>
                    Date :{" "}
                    <span className="fw-7">{formatDate(order.ordered_on)}</span>
                  </li>
                  <li>
                    Subtotal :{" "}
                    <span className="fw-7">
                      ₹{order.subtotal?.toLocaleString("en-IN") || "0"}
                    </span>
                  </li>
                  {order.discount > 0 && (
                    <li>
                      Discount :{" "}
                      <span className="fw-7">
                        -₹{order.discount?.toLocaleString("en-IN") || "0"}
                      </span>
                    </li>
                  )}
                  {order.coupon_discount > 0 && (
                    <li>
                      Coupon Discount ({order.coupon_code}) :{" "}
                      <span className="fw-7">
                        -₹
                        {order.coupon_discount?.toLocaleString("en-IN") || "0"}
                      </span>
                    </li>
                  )}
                  {order.tax > 0 && (
                    <li>
                      Tax :{" "}
                      <span className="fw-7">
                        ₹{order.tax?.toLocaleString("en-IN") || "0"}
                      </span>
                    </li>
                  )}
                  {order.shipping > 0 && (
                    <li>
                      Shipping :{" "}
                      <span className="fw-7">
                        ₹{order.shipping?.toLocaleString("en-IN") || "0"}
                      </span>
                    </li>
                  )}
                  <li className="mt_8">
                    Total :{" "}
                    <span className="fw-7">
                      ₹{order.total?.toLocaleString("en-IN") || "0"}
                    </span>
                  </li>
                  <li>
                    Payment Method :{" "}
                    <span className="fw-7">
                      {order.payment_method || "N/A"}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
