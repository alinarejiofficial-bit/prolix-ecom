"use client";
import React from "react";
import Nav from "./Nav";
import Link from "next/link";
import { useContextElement } from "@/context/Context";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/common/BrandLogo";
import CartBadge from "@/components/common/CartBadge";
import { openWobcartCartDrawer } from "@/utils/wobcartCheckout";

export default function Header1({ fullWidth = false }) {
  const { isAuthenticated, user } = useContextElement();
  const router = useRouter();

  const handleUserIconClick = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      router.push("/my-account");
    } else {
      router.push("/login");
    }
  };

  return (
    <header
      id="header"
      className={`header-default ${fullWidth ? "header-fullwidth" : ""} `}
    >
      <div className={fullWidth ? "" : "container"}>
        <div className="row wrapper-header align-items-center position-relative">
          <div className="col-md-4 col-2 d-xl-none header-col-left">
            <a
              href="#mobileMenu"
              className="mobile-menu"
              data-bs-toggle="offcanvas"
              aria-controls="mobileMenu"
            >
              <i className="icon icon-categories" />
            </a>
          </div>
          <div className="col-xl-3 col-md-4 col-6 text-center text-xl-start header-col-center">
            <Link href="/" className="logo-header d-inline-flex align-items-center justify-content-center justify-content-xl-start">
              <BrandLogo width={280} height={80} maxHeight="80px" priority />
            </Link>
          </div>
          <div className="col-xl-6 d-none d-xl-block">
            <nav className="box-navigation text-center">
              <ul className="box-nav-ul d-flex align-items-center justify-content-center">
                <Nav />
              </ul>
            </nav>
          </div>
          <div className="col-xl-3 col-md-4 col-4 d-flex justify-content-end header-col-right">
            <ul className="nav-icon d-flex justify-content-end align-items-center header-nav-icons">
              <li className="nav-search d-none d-md-block">
                <a
                  href="#search"
                  data-bs-toggle="modal"
                  className="nav-icon-item d-flex align-items-center gap-2"
                  style={{ minWidth: '24px', height: '24px' }}
                  aria-label="Search"
                >
                  <svg
                    className="icon flex-shrink-0"
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                      stroke="#181818"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21.35 21.0004L17 16.6504"
                      stroke="#181818"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="nav-icon-text text-caption-1 text-main fw-semibold d-none">
                    Search
                  </span>
                </a>
              </li>
              <li className="nav-wishlist d-none d-md-block">
                <Link
                  href="/wish-list"
                  className="nav-icon-item d-flex align-items-center"
                  aria-label="Wishlist"
                  title="Wishlist"
                  style={{ minWidth: "24px", height: "24px" }}
                >
                  <svg
                    className="icon flex-shrink-0"
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20.8401 4.60987C20.3294 4.09888 19.7229 3.69352 19.0555 3.41696C18.388 3.14039 17.6726 2.99805 16.9501 2.99805C16.2276 2.99805 15.5122 3.14039 14.8448 3.41696C14.1773 3.69352 13.5709 4.09888 13.0601 4.60987L12.0001 5.66987L10.9401 4.60987C9.90843 3.57818 8.50915 2.99858 7.05012 2.99858C5.59109 2.99858 4.19181 3.57818 3.16012 4.60987C2.12843 5.64156 1.54883 7.04084 1.54883 8.49987C1.54883 9.95891 2.12843 11.3582 3.16012 12.3899L4.22012 13.4499L12.0001 21.2299L19.7801 13.4499L20.8401 12.3899C21.3511 11.8791 21.7565 11.2727 22.033 10.6052C22.3096 9.93777 22.4519 9.22236 22.4519 8.49987C22.4519 7.77738 22.3096 7.06198 22.033 6.39452C21.7565 5.72706 21.3511 5.12063 20.8401 4.60987Z"
                      stroke="#181818"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </li>

              {/* User Account - Always visible */}
              <li className="nav-user">
                <a
                  href="#"
                  className="nav-icon-item d-flex align-items-center gap-2"
                  onClick={handleUserIconClick}
                  title={isAuthenticated ? `Welcome, ${user?.name || 'User'}` : 'Sign In'}
                  aria-label={isAuthenticated ? "My account" : "Account"}
                  style={{ minWidth: '24px', height: '24px' }}
                >
                  <svg
                    className="icon flex-shrink-0"
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                      stroke={isAuthenticated ? "#28a745" : "#181818"}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                      stroke={isAuthenticated ? "#28a745" : "#181818"}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="nav-icon-text text-caption-1 text-main fw-semibold d-none">
                    {isAuthenticated ? "Account" : "Account"}
                  </span>
                </a>
              </li>
              <li className="nav-cart">
                <a
                  href="#"
                  className="nav-icon-item d-flex align-items-center"
                  onClick={(e) => {
                    e.preventDefault();
                    openWobcartCartDrawer().catch(() => {});
                  }}
                  aria-label="Open cart"
                  style={{ minWidth: "24px", height: "24px", position: "relative" }}
                >
                  <svg
                    className="icon flex-shrink-0"
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.5078 10.8734V6.36686C16.5078 5.17166 16.033 4.02541 15.1879 3.18028C14.3428 2.33514 13.1965 1.86035 12.0013 1.86035C10.8061 1.86035 9.65985 2.33514 8.81472 3.18028C7.96958 4.02541 7.49479 5.17166 7.49479 6.36686V10.8734M4.11491 8.62012H19.8877L21.0143 22.1396H2.98828L4.11491 8.62012Z"
                      stroke="#181818"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <CartBadge className="count-box header-cart-badge" />
                </a>
              </li>
              
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
