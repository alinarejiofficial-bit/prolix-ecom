"use client";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import AccountSidebar from "@/components/my-account/AccountSidebar";
import Information from "@/components/my-account/Information";
import AccountAuthLoading from "@/components/loaders/AccountAuthLoading";
import React, { useEffect } from "react";
import { useContextElement } from "@/context/Context";
import { useRouter } from "next/navigation";

export default function MyAccountPage() {
  const { isAuthenticated, authLoading } = useContextElement();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return <AccountAuthLoading />;
  }

  if (!isAuthenticated) {
    return null;
  }
  return (
    <>
      <Topbar6 bgColor="bg-white" />
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
            <Information />
          </div>
        </div>
      </section>
      <Footer1 />
    </>
  );
}
