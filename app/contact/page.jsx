import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import StoreLocations3 from "@/components/otherPages/StoreLocations3";

export const metadata = {
  title: "Contact Us - Prolix | Customer Support & Help",
  description:
    "Get in touch with Prolix customer support team. Find our contact information, store locations, and reach out for assistance with orders, products, or any inquiries.",
};

export default function ContactPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      <StoreLocations3 />
      <Footer1 />
    </>
  );
}
