import PageLoaderShell from "@/components/loaders/PageLoaderShell";
import { SearchResultsPageSkeleton } from "@/components/common/SectionSkeletons";

export default function Loading() {
  return (
    <PageLoaderShell footerPadding>
      <SearchResultsPageSkeleton />
    </PageLoaderShell>
  );
}
