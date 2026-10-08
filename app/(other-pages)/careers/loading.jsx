import PageLoaderShell from "@/components/loaders/PageLoaderShell";
import { CareersPageSkeleton } from "@/components/common/SectionSkeletons";

export default function Loading() {
  return (
    <PageLoaderShell footerPadding>
      <CareersPageSkeleton />
    </PageLoaderShell>
  );
}
