import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import Login from "@/components/otherPages/Login";
import OrderTrac from "@/components/otherPages/OrderTrac";
import React from "react";

export const metadata = {
  title: "Order Tracking - Prolix | Track Your Order Status",
  description: "Track your Prolix order status in real-time. Enter your order number to get updates on shipping, delivery, and order progress. Stay informed about your purchase.",
  keywords: "order tracking, track order, order status, delivery tracking, shipping status, Prolix tracking, order number",
};

export default function OrderTrackingPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      
      <OrderTrac />
      <Footer1 />
    </>
  );
}
