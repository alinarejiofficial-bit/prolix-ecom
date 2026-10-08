import PageLoaderShell from "@/components/loaders/PageLoaderShell";
import { StaticPageSkeleton } from "@/components/common/SectionSkeletons";

export default function Loading() {
  return (
    <PageLoaderShell footerPadding>
      <StaticPageSkeleton />
    </PageLoaderShell>
  );
}
