"use client";

// Count is updated by wobcart-checkout.js on [data-cart-badge] elements.
export default function CartBadge({ className = "count-box" }) {
  return (
    <span className={className} data-cart-badge style={{ display: "none" }} />
  );
}
