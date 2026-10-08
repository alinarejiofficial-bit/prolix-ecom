import Testimonials from "@/components/common/Testimonials";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import Banner from "@/components/homes/eleganceNest/Banner";
import Collections from "@/components/homes/eleganceNest/Collections";
import Hero from "@/components/homes/eleganceNest/Hero";
import HomeCategories from "@/components/common/HomeCategories";
import Products from "@/components/common/Products4";
import Products2 from "@/components/common/Products2";
import React from "react";
import CartTogglerSide from "@/components/common/CartTogglerSide";
import HomeAnnouncements from "@/components/common/HomeAnnouncements";
import StoreHighlights from "@/components/common/StoreHighlights";

export const metadata = {
  title: "Prolix Chairs | Furniture that Blends Comfort, Style & Durability",
  description:
    "Prolix Chairs & Seatings – Redefining Comfort and Style with Ergonomic, Modern Seating Solutions for Every Space.",
  keywords:
    "Prolix, Prolix Chairs, chairs, office chair, dining chair, student chair, visitor chair, barstool, Nilkamal distributor, furniture, Malappuram",
};

export default function HomePage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      <Hero />
      <HomeAnnouncements />
      <StoreHighlights />
      <HomeCategories parentClass="home-section-spacing pt-2 pt-md-3" />
      <Banner />
      <Products parentClass="home-section-spacing pt-4 pt-md-5" />
      <Collections />
      <Products2
        parentClass="home-section-spacing"
        title="Our Best Sellers"
        subtitle="Comfort & Style You Can't Resist!"
      />
      <Testimonials parentClass="home-section-spacing" />
      <Footer1 />
      <CartTogglerSide />
    </>
  );
}
