"use client";

import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import CartTogglerSide from "@/components/common/CartTogglerSide";

export default function PageLoaderShell({
  children,
  showFooter = true,
  showCartToggler = false,
  footerPadding = false,
}) {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      {children}
      {showFooter && <Footer1 hasPaddingBottom={footerPadding} />}
      {showCartToggler && <CartTogglerSide />}
    </>
  );
}
