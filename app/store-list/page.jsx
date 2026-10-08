import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import StoreLocations2 from "@/components/otherPages/StoreLocations2";

export const metadata = {
  title: "Store Locations - Prolix | Find Our Stores",
  description: "Find Prolix store locations near you. Visit our physical stores to see products in person, get expert advice, and enjoy in-store shopping experience.",
  keywords: "store locations, physical stores, Prolix stores, find store, store locator, visit store, retail locations",
};

export default function StoreListPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      
      <StoreLocations2 />
      <Footer1 />
    </>
  );
}

