"use client";

import React, { useState } from "react";
import Image from "next/image";
import { PLACEHOLDER_IMAGE } from "@/utils/productImages";

const colorOptionsDefault = [
  {
    id: "values-beige",
    value: "Beige",
    color: "beige",
  },
  {
    id: "values-gray",
    value: "Gray",
    color: "gray",
  },
  {
    id: "values-grey",
    value: "Grey",
    color: "grey",
  },
];

function isRealImage(image) {
  return Boolean(image && image !== PLACEHOLDER_IMAGE);
}

export default function ColorSelect({
  activeColor = "",
  setActiveColor,
  colorOptions = colorOptionsDefault,
}) {
  const [activeColorDefault, setActiveColorDefault] = useState("gray");
  const useImageSwatches = colorOptions.some((option) => isRealImage(option.image));

  const handleSelectColor = (value) => {
    if (setActiveColor) {
      setActiveColor(value);
    } else {
      setActiveColorDefault(value);
    }
  };

  const isColorActive = (optionValue, optionColor) => {
    if (!activeColor) return activeColorDefault == optionColor;
    const activeColorNormalized = activeColor.toLowerCase().replace(/\s+/g, "-");
    return (
      activeColor === optionValue ||
      activeColorNormalized === optionColor ||
      activeColor === optionColor
    );
  };

  return (
    <div className="variant-picker-item">
      <div className="variant-picker-label mb_12">
        Colors:
        <span
          className="text-title variant-picker-label-value value-currentColor"
          style={{ textTransform: "capitalize" }}
        >
          {activeColor || activeColorDefault}
        </span>
      </div>
      <div className="variant-picker-values">
        {colorOptions.map(({ id, value, color, image }) => {
          const imageSrc = isRealImage(image) ? image : null;
          const active = isColorActive(value, color);

          return (
            <React.Fragment key={id}>
              <input id={id} type="radio" readOnly checked={active} />
              <label
                onClick={() => handleSelectColor(value)}
                className={`hover-tooltip tooltip-bot color-btn ${
                  useImageSwatches ? "style-image-rounded" : "radius-60"
                } ${active ? "active" : ""}`}
                htmlFor={id}
                style={
                  useImageSwatches
                    ? { width: "56px", height: "56px" }
                    : { width: "56px", height: "56px" }
                }
              >
                {useImageSwatches ? (
                  <Image
                    src={imageSrc || PLACEHOLDER_IMAGE}
                    alt={value}
                    width={56}
                    height={56}
                    className="variant-color-image"
                    style={{
                      borderRadius: "50%",
                      objectFit: "cover",
                      width: "100%",
                      height: "100%",
                      display: "block",
                    }}
                    unoptimized
                  />
                ) : (
                  <span className={`btn-checkbox bg-color-${color}`} />
                )}
                <span className="tooltip">{value}</span>
              </label>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
