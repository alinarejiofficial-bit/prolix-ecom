import PageLoaderShell from "@/components/loaders/PageLoaderShell";
import { WishlistPageSkeleton } from "@/components/common/SectionSkeletons";

export default function Loading() {
  return (
    <PageLoaderShell footerPadding>
      <WishlistPageSkeleton />
    </PageLoaderShell>
  );
}
