"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStoreConfig } from "@/context/StoreConfigContext";

export default function MobileMenu() {
  const pathname = usePathname();
  const { contact, isModuleEnabled } = useStoreConfig();

  return (
    <div className="offcanvas offcanvas-start canvas-mb" id="mobileMenu">
      <span
        className="icon-close icon-close-popup"
        data-bs-dismiss="offcanvas"
        aria-label="Close"
      />
      <div className="mb-canvas-content">
        <div className="mb-body">
          <div className="mb-content-top">
            <ul className="nav-ul-mb" id="wrapper-menu-navigation">
              <li className="nav-mb-item">
                <Link
                  href="/products"
                  className={`mb-menu-link ${pathname === "/products" ? "active" : ""}`}
                >
                  <span>Shop</span>
                </Link>
              </li>
              <li className="nav-mb-item">
                <Link
                  href="/shop-collection"
                  className={`mb-menu-link ${pathname === "/shop-collection" ? "active" : ""}`}
                >
                  <span>Collections</span>
                </Link>
              </li>
              {isModuleEnabled("content") && (
                <li className="nav-mb-item">
                  <Link
                    href="/blog"
                    className={`mb-menu-link ${pathname?.startsWith("/blog") ? "active" : ""}`}
                  >
                    <span>Journal</span>
                  </Link>
                </li>
              )}
              {isModuleEnabled("tailoring") && (
                <li className="nav-mb-item">
                  <Link
                    href="/tailoring"
                    className={`mb-menu-link ${pathname === "/tailoring" ? "active" : ""}`}
                  >
                    <span>Tailoring</span>
                  </Link>
                </li>
              )}
              {isModuleEnabled("careers") && (
                <li className="nav-mb-item">
                  <Link
                    href="/careers"
                    className={`mb-menu-link ${pathname === "/careers" ? "active" : ""}`}
                  >
                    <span>Careers</span>
                  </Link>
                </li>
              )}
              <li className="nav-mb-item">
                <Link
                  href="/contact"
                  className={`mb-menu-link ${pathname === "/contact" ? "active" : ""}`}
                >
                  <span>Contact</span>
                </Link>
              </li>
              <li className="nav-mb-item">
                <Link
                  href="/login"
                  className={`mb-menu-link ${pathname === "/login" ? "active" : ""}`}
                >
                  <span>Account</span>
                </Link>
              </li>
            </ul>
          </div>
          <div className="mb-other-content">
            <div className="mb-notice">
              <Link href={`/contact`} className="text-need">
                Need help?
              </Link>
            </div>
            {contact?.address && (
              <div className="mb-contact">
                <p className="text-caption-1">{contact.address}</p>
              </div>
            )}
            <ul className="mb-info">
              {contact?.email && (
                <li>
                  <i className="icon icon-mail" />
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </li>
              )}
              {contact?.phone && (
                <li>
                  <i className="icon icon-phone" />
                  <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
