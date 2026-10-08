"use client";

import React from "react";
import { useStoreConfig } from "@/context/StoreConfigContext";

const SVG_PROPS = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const HIGHLIGHTS = [
  {
    title: "Ergonomic Excellence",
    text: "Designed for superior comfort and posture support.",
    shortText: "Comfort & posture support",
    icon: (
      <svg {...SVG_PROPS}>
        <path d="M7 3v9a2 2 0 0 0 2 2h7" />
        <path d="M7 12h9a2 2 0 0 1 2 2v1H7" />
        <line x1="12" y1="15" x2="12" y2="21" />
        <line x1="8" y1="21" x2="16" y2="21" />
      </svg>
    ),
  },
  {
    title: "Premium Quality",
    text: "Crafted with high-quality materials for durability and style.",
    shortText: "Durable, quality materials",
    icon: (
      <svg {...SVG_PROPS}>
        <circle cx="12" cy="8" r="6" />
        <polyline points="8.2 13.1 7 22 12 19 17 22 15.8 13.1" />
      </svg>
    ),
  },
  {
    title: "Modern & Aesthetic Designs",
    text: "Perfect for offices, homes, and study spaces.",
    shortText: "Offices, homes & study",
    icon: (
      <svg {...SVG_PROPS}>
        <polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2" />
      </svg>
    ),
  },
  {
    title: "Commitment to Innovation",
    text: "Continuously evolving to enhance your seating experience.",
    shortText: "Always evolving",
    icon: (
      <svg {...SVG_PROPS}>
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z" />
      </svg>
    ),
  },
];

export default function StoreHighlights() {
  const { isModuleEnabled } = useStoreConfig();

  // Controlled dynamically by the Content module in Wobcart Cloud
  if (!isModuleEnabled("content")) {
    return null;
  }

  return (
    <section className="wc-highlights-section">
      <div className="container">
        <div className="wc-highlights-grid">
          {HIGHLIGHTS.map((item) => (
            <div className="wc-highlight-item" key={item.title}>
              <div className="wc-highlight-icon">{item.icon}</div>
              <div className="wc-highlight-text">
                <h6>{item.title}</h6>
                <p>
                  <span className="d-none d-sm-inline">{item.text}</span>
                  <span className="d-sm-none">{item.shortText}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
