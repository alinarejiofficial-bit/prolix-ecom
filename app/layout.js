"use client";
import { usePathname } from "next/navigation";
import Script from "next/script";
import "../public/scss/main.scss";
import "photoswipe/style.css";
import "react-range-slider-input/dist/style.css";
import "../public/css/image-compare-viewer.min.css";
import { useEffect, useState } from "react";
import Context from "@/context/Context";
import CartModal from "@/components/modals/CartModal";
import QuickView from "@/components/modals/QuickView";
import QuickAdd from "@/components/modals/QuickAdd";
import MobileMenu from "@/components/modals/MobileMenu";
import SearchModal from "@/components/modals/SearchModal";
import SizeGuide from "@/components/modals/SizeGuide";
import Wishlist from "@/components/modals/Wishlist";
import Categories from "@/components/modals/Categories";
import AccountSidebar from "@/components/modals/AccountSidebar";
import ApplyModal from "@/components/modals/ApplyModal";
import WobcartCheckoutScript from "@/components/WobcartCheckoutScript";
import WhatsAppWidget from "@/components/common/WhatsAppWidget";
import BrandFavicon from "@/components/common/BrandFavicon";
import RecentPurchasesToast from "@/components/common/RecentPurchasesToast";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [headerScroll, setHeaderScroll] = useState(null);
  const cleanupStaleBackdrops = () => {
    const staleBackdrops = document.querySelectorAll(
      ".modal-backdrop, .offcanvas-backdrop",
    );
    staleBackdrops.forEach((backdrop) => backdrop.remove());
    document.body.classList.remove("modal-open", "offcanvas-open");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  };
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Import the script only on the client side
      import("bootstrap/dist/js/bootstrap.esm").then(() => {
        // Module is imported, you can access any exported functionality if
      });
    }
  }, []);
  useEffect(() => {
    const lastScrollY = { current: window.scrollY };

    setHeaderScroll({
      direction: "up",
      scrolled: window.scrollY > 100,
    });

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      let direction = "up";

      if (currentScrollY > 250) {
        direction = currentScrollY > lastScrollY.current ? "down" : "up";
      }

      lastScrollY.current = currentScrollY;

      setHeaderScroll({
        direction,
        scrolled: currentScrollY > 100,
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);

  useEffect(() => {
    if (!headerScroll) {
      return;
    }

    if (headerScroll.scrolled) {
      document.body.dataset.headerScrolled = "true";
    } else {
      delete document.body.dataset.headerScrolled;
    }

    document.body.dataset.headerScroll = headerScroll.direction;
  }, [headerScroll]);
  useEffect(() => {
    // Close any open modal
    const bootstrap = require("bootstrap"); // dynamically import bootstrap
    const modalElements = document.querySelectorAll(".modal.show");
    modalElements.forEach((modal) => {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) {
        modalInstance.hide();
      }
    });

    // Close any open offcanvas
    const offcanvasElements = document.querySelectorAll(".offcanvas.show");
    offcanvasElements.forEach((offcanvas) => {
      const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvas);
      if (offcanvasInstance) {
        offcanvasInstance.hide();
      }
    });
    cleanupStaleBackdrops();
  }, [pathname]); // Runs every time the route changes

  useEffect(() => {
    const handlePageResume = () => {
      // Returning from external checkout can keep stale backdrop/body lock.
      cleanupStaleBackdrops();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handlePageResume();
      }
    };

    window.addEventListener("pageshow", handlePageResume);
    window.addEventListener("focus", handlePageResume);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageResume);
      window.removeEventListener("focus", handlePageResume);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    // Defer WOW until after React hydration — it mutates inline styles on `.wow`
    // elements and will cause hydration mismatches if it runs too early.
    let innerFrame;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        const { initWow } = require("@/utlis/initWow");
        initWow();
      });
    });

    return () => {
      cancelAnimationFrame(outerFrame);
      if (innerFrame) cancelAnimationFrame(innerFrame);
    };
  }, [pathname]);
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N65RGHR5');`,
          }}
        />
        {/* End Google Tag Manager */}
        <link rel="icon" href="/images/logo/prolix-favicon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/images/logo/prolix-favicon.png" />
      </head>
      <body className="preload-wrapper popup-loader">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-N65RGHR5"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        {/* End Google Tag Manager (noscript)  finished */}
        <Context>
          <WobcartCheckoutScript />
          <BrandFavicon />
          <div id="wrapper">{children}</div>
          <CartModal />
          <QuickView />
          <QuickAdd />
          <MobileMenu />

          <SearchModal />
          <SizeGuide />
          <Wishlist />
          <Categories />
          <AccountSidebar />
          <ApplyModal />
          <WhatsAppWidget />
          <RecentPurchasesToast />
        </Context>
      </body>
    </html>
  );
}
