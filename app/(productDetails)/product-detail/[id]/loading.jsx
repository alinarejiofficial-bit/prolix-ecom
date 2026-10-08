import PageLoaderShell from "@/components/loaders/PageLoaderShell";
import ProductDetailSkeleton from "@/components/productDetails/ProductDetailSkeleton";

export default function Loading() {
  return (
    <PageLoaderShell footerPadding>
      <ProductDetailSkeleton />
    </PageLoaderShell>
  );
}
