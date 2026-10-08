"use client";
import React from "react";
import Link from "next/link";
export default function Breadcumb({ product }) {
  return (
    <div className="tf-breadcrumb">
      <div className="container">
        <div className="tf-breadcrumb-wrap">
          <div className="tf-breadcrumb-list">
            <Link href={`/`} className="text text-caption-1">
              Homepage
            </Link>

            <i className="icon icon-arrRight" />
            <span className="text text-caption-1">{product.title || product.name}</span>
          </div>
          <div className="tf-breadcrumb-share">
            <a
              href="#share_social"
              data-bs-toggle="modal"
              className="tf-breadcrumb-share-btn"
            >
              <i className="icon icon-share" />
              <span className="text text-caption-1">Share</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
