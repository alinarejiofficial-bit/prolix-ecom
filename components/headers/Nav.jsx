"use client";
import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { useStoreConfig } from "@/context/StoreConfigContext";

export default function Nav() {
  const pathname = usePathname();
  const { isModuleEnabled } = useStoreConfig();

  return (
    <>
      <li className={`menu-item ${pathname === "/products" ? "active" : ""}`}>
        <Link href="/products" className="item-link">
          Shop
        </Link>
      </li>
      <li className={`menu-item ${pathname === "/shop-collection" || pathname?.startsWith("/products/category") ? "active" : ""}`}>
        <Link href="/shop-collection" className="item-link">
          Collections
        </Link>
      </li>
      {isModuleEnabled("content") && (
        <li className={`menu-item ${pathname?.startsWith("/blog") ? "active" : ""}`}>
          <Link href="/blog" className="item-link">
            Journal
          </Link>
        </li>
      )}
      {isModuleEnabled("tailoring") && (
        <li className={`menu-item ${pathname === "/tailoring" ? "active" : ""}`}>
          <Link href="/tailoring" className="item-link">
            Tailoring
          </Link>
        </li>
      )}
      {isModuleEnabled("careers") && (
        <li className={`menu-item ${pathname === "/careers" ? "active" : ""}`}>
          <Link href="/careers" className="item-link">
            Careers
          </Link>
        </li>
      )}
      <li className={`menu-item ${pathname === "/contact" ? "active" : ""}`}>
        <Link href="/contact" className="item-link">
          Contact
        </Link>
      </li>
    </>
  );
}
