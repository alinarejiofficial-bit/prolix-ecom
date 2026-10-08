"use client";
import React from "react";
import { useStoreConfig } from "@/context/StoreConfigContext";

export default function Topbar6({ bgColor = "bg-white" }) {
  const { contact } = useStoreConfig();

  if (!contact?.phone && !contact?.email) {
    return null;
  }

  return (
    <div className={`tf-topbar tf-topbar-line-bottom ${bgColor}`}>
      <div className="container">
        <div className="tf-topbar_wrap d-flex align-items-center justify-content-center justify-content-xl-between">
          <ul className="topbar-left">
            {contact?.phone && (
              <li>
                <a
                  className="text-caption-1 text-black"
                  href={`tel:${contact.phone}`}
                >
                  {contact.phone}
                </a>
              </li>
            )}
            {contact?.email && (
              <li>
                <a
                  className="text-caption-1 text-black"
                  href={`mailto:${contact.email}`}
                >
                  {contact.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
