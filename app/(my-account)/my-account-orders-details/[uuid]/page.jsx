"use client";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import AccountSidebar from "@/components/my-account/AccountSidebar";
import AccountAuthLoading from "@/components/loaders/AccountAuthLoading";
import OrderDetails from "@/components/my-account/OrderDetails";
import React, { useEffect } from "react";
import { useContextElement } from "@/context/Context";
import { useRouter, useParams } from "next/navigation";

export default function MyAccountOrdersDetailsPage() {
  const { isAuthenticated, authLoading } = useContextElement();
  const router = useRouter();
  const params = useParams();
  const uuid = params?.uuid;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Redirect to home page if not authenticated
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return <AccountAuthLoading variant="order-details" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Topbar6 bgColor="bg-main" />
      <Header1 />
      <>
        
        <div className="btn-sidebar-account">
          <button data-bs-toggle="offcanvas" data-bs-target="#mbAccount">
            <i className="icon icon-squares-four" />
          </button>
        </div>
      </>

      <section className="flat-spacing">
        <div className="container">
          <div className="my-account-wrap">
            <AccountSidebar />
            <OrderDetails orderUuid={uuid} />
          </div>
        </div>
      </section>
      <Footer1 />
    </>
  );
}

