"use client";

import { useState, useEffect } from "react";

export default function SizeSelect({ 
  selectedSize: externalSelectedSize, 
  setSelectedSize: externalSetSelectedSize,
  sizeOptions = [],
  variants = [],
  sizeOptionName = "Size"
}) {
  // Use external state if provided, otherwise use internal state
  const [internalSelectedSize, setInternalSelectedSize] = useState(
    sizeOptions.length > 0 ? sizeOptions[0].value : ""
  );
  
  const selectedSize = externalSelectedSize !== undefined ? externalSelectedSize : internalSelectedSize;
  const setSelectedSize = externalSetSelectedSize || setInternalSelectedSize;

  // Check if a size is available (has stock)
  const isSizeAvailable = (sizeValue) => {
    if (!variants.length) return true;
    
    const variant = variants.find(v => {
      const variantOptions = v.options || {};
      const variantSize = variantOptions[sizeOptionName] || variantOptions[sizeOptionName.toLowerCase()];
      return variantSize === sizeValue;
    });
    
    return variant ? (variant.stock_qty > 0) : false;
  };

  const handleChange = (value) => {
    if (externalSetSelectedSize) {
      externalSetSelectedSize(value);
    } else {
      setInternalSelectedSize(value);
    }
  };

  // Use provided sizeOptions or fallback to default
  const sizes = sizeOptions.length > 0 
    ? sizeOptions.map(opt => ({
        ...opt,
        disabled: opt.disabled !== undefined ? opt.disabled : !isSizeAvailable(opt.value)
      }))
    : [
        { id: "values-s", value: "S", disabled: false },
        { id: "values-m", value: "M", disabled: false },
        { id: "values-l", value: "L", disabled: false },
        { id: "values-xl", value: "XL", disabled: false },
      ];

  return (
    <div className="variant-picker-item">
      <div className="d-flex justify-content-between align-items-center mb_12">
        <div className="variant-picker-label">
          selected size:
          <span className="text-title variant-picker-label-value">
            {selectedSize}
          </span>
        </div>
        <a
          href="#size-guide"
          data-bs-toggle="modal"
          className="find-size text-btn-uppercase hover-text-main d-flex align-items-center gap-1"
          style={{ cursor: "pointer", fontSize: "12px" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 3H3v18h18V3zM7 3v4M12 3v2M17 3v4M7 21v-4M12 21v-2M17 21v-4" />
          </svg>
          Size Guide
        </a>
      </div>
      <div className="variant-picker-values gap12">
        {sizes.map(({ id, value, disabled }) => (
          <div key={id} onClick={() => !disabled && handleChange(value)}>
            <input
              type="radio"
              id={id}
              checked={selectedSize === value}
              disabled={disabled}
              readOnly
            />
            <label
              className={`style-text size-btn ${
                disabled ? "type-disable" : ""
              } ${selectedSize === value ? "active" : ""}`}
              htmlFor={id}
              data-value={value}
            >
              <span className="text-title">{value}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
