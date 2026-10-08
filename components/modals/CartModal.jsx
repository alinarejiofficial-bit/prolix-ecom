"use client";
import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContextElement } from "@/context/Context";
import { useStoreConfig } from "@/context/StoreConfigContext";
import {
  mapCartProductsToWobcartItems,
  openWobcartCheckout,
} from "@/utils/wobcartCheckout";

export default function CartModal() {
  const router = useRouter();
  const { isModuleEnabled } = useStoreConfig();
  const {
    cartProducts,
    totalPrice,
    removeItem,
  } = useContextElement();

  const modalRef = useRef(null);

  const handleCheckout = async () => {
    const items = mapCartProductsToWobcartItems(cartProducts);
    if (!items.length) {
      return;
    }

    const bootstrap = require("bootstrap");
    const cartModalElement = document.getElementById("shoppingCart");
    if (cartModalElement) {
      const cartModal = bootstrap.Modal.getInstance(cartModalElement);
      if (cartModal) {
        cartModal.hide();
      }
    }

    if (isModuleEnabled("wobcart_checkout")) {
      try {
        await openWobcartCheckout(items);
      } catch (error) {
        alert(error.message || "Unable to open checkout");
      }
    } else {
      router.push("/cart");
    }
  };

  // Handle body overflow when modal opens/closes
  useEffect(() => {
    const modal = document.getElementById("shoppingCart");
    if (!modal) return;

    const handleModalShow = () => {
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px";
    };

    const handleModalHide = () => {
      // Restore body scroll when modal is closed
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };

    modal.addEventListener("show.bs.modal", handleModalShow);
    modal.addEventListener("hidden.bs.modal", handleModalHide);

    return () => {
      modal.removeEventListener("show.bs.modal", handleModalShow);
      modal.removeEventListener("hidden.bs.modal", handleModalHide);
      // Cleanup on unmount
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, []);

  return (
    <div className="modal fullRight fade modal-shopping-cart" id="shoppingCart" ref={modalRef}>
      <div className="modal-dialog" style={{ height: "100%", margin: 0 }}>
        <div className="modal-content" style={{ height: "100%", overflow: "hidden" }}>
          <div className="d-flex flex-column flex-grow-1 h-100" style={{ overflow: "hidden" }}>
            <div className="header" style={{ flexShrink: 0 }}>
              <h5 className="title">Shopping Cart</h5>
              <span
                className="icon-close icon-close-popup"
                data-bs-dismiss="modal"
                style={{ cursor: "pointer" }}
              />
            </div>
            <div className="wrap" style={{ flex: "1 1 auto", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div className="tf-mini-cart-threshold" style={{ flexShrink: 0 }}>
                <div className="tf-progress-bar">
                  <div
                    className="value"
                    style={{ width: "0%" }}
                    data-progress={75}
                  >
                    <i className="icon icon-shipping" />
                  </div>
                </div>
              </div>
              <div className="tf-mini-cart-wrap" style={{ flex: "1 1 auto", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div className="tf-mini-cart-main" style={{ flex: "1 1 auto", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div className="tf-mini-cart-sroll" style={{ flex: "1 1 auto", overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
                    {cartProducts.length ? (
                      <div className="tf-mini-cart-items">
                        {cartProducts.map((product, i) => (
                          <div
                            key={i}
                            className="tf-mini-cart-item file-delete"
                          >
                            <div className="tf-mini-cart-image">
                              <Image
                                className="lazyload"
                                alt=""
                                src={product.imgSrc}
                                width={600}
                                height={800}
                              />
                            </div>
                            <div className="tf-mini-cart-info flex-grow-1">
                              <div className="mb_12 d-flex align-items-center justify-content-between flex-wrap gap-12">
                                <div className="text-title">
                                  <Link
                                    href={`/product-detail/${product.product_uuid || product.id}`}
                                    className="link text-line-clamp-1"
                                  >
                                    {product.title}
                                  </Link>
                                </div>
                                <div
                                  className="text-button tf-btn-remove remove"
                                  onClick={() => removeItem(product.id)}
                                >
                                  Remove
                                </div>
                              </div>
                              <div className="d-flex align-items-center justify-content-between flex-wrap gap-12">
                                <div className="text-secondary-2">
                                  {product.variant_name || "Standard"}
                                </div>
                                <div className="text-button">
                                  {product.quantity} X ₹
                                  {product.price.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4">
                        Your Cart is empty. Start adding favorite products to
                        cart!{" "}
                        <Link className="btn-line" href="/products">
                          Explore Products
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                {cartProducts.length > 0 && (
                  <div className="tf-mini-cart-bottom" style={{ flexShrink: 0 }}>
                    <div className="tf-mini-cart-bottom-wrap">
                      <div className="tf-cart-totals-discounts">
                        <h5>Subtotal</h5>
                        <h5 className="tf-totals-total-value">
                          ₹{totalPrice.toFixed(2)}
                        </h5>
                      </div>
                      <div className="tf-mini-cart-view-checkout">
                        <button
                          type="button"
                          className="tf-btn w-100 btn-fill radius-4"
                          onClick={handleCheckout}
                        >
                          <span className="text">Checkout</span>
                        </button>
                      </div>
                      <div className="text-center">
                        <Link
                          className="link text-btn-uppercase"
                          href={`/products`}
                        >
                          Or continue shopping
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
