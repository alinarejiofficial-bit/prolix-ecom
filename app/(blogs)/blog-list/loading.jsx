import PageLoaderShell from "@/components/loaders/PageLoaderShell";
import { BlogListSkeleton } from "@/components/common/SectionSkeletons";

export default function Loading() {
  return (
    <PageLoaderShell footerPadding>
      <BlogListSkeleton />
    </PageLoaderShell>
  );
}
