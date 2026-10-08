import PageLoaderShell from "@/components/loaders/PageLoaderShell";
import { BlogDetailSkeleton } from "@/components/common/SectionSkeletons";

export default function Loading() {
  return (
    <PageLoaderShell footerPadding>
      <BlogDetailSkeleton />
    </PageLoaderShell>
  );
}
