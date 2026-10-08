"use client";

import React, { useEffect } from "react";

export default function SkeletonLoader({ width = "100%", height = "100%", className = "" }) {
  useEffect(() => {
    const styleId = "skeleton-loader-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .skeleton-loader {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{
        width,
        height,
        display: "block",
      }}
    />
  );
}

