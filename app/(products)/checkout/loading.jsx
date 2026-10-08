import PageLoaderShell from "@/components/loaders/PageLoaderShell";
import { CheckoutPageSkeleton } from "@/components/common/SectionSkeletons";

export default function Loading() {
  return (
    <PageLoaderShell footerPadding>
      <CheckoutPageSkeleton />
    </PageLoaderShell>
  );
}
