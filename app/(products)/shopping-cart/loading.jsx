import PageLoaderShell from "@/components/loaders/PageLoaderShell";
import { CartPageSkeleton } from "@/components/common/SectionSkeletons";

export default function Loading() {
  return (
    <PageLoaderShell footerPadding>
      <CartPageSkeleton />
    </PageLoaderShell>
  );
}
