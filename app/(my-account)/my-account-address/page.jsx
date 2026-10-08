import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import AccountSidebar from "@/components/my-account/AccountSidebar";
import Address from "@/components/my-account/Address";
import React from "react";

export const metadata = {
  title: "My Addresses - Prolix | Manage Shipping Addresses",
  description: "Manage your shipping and billing addresses at Prolix. Add, edit, or delete addresses for faster checkout. Keep your delivery information up to date.",
  keywords: "my addresses, shipping address, billing address, manage addresses, delivery address, Prolix addresses, address book",
};

export default function MyAccountAddressPage() {
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
            <Address />
          </div>
        </div>
      </section>
      <Footer1 />
    </>
  );
}
