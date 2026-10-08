import PageLoaderShell from "@/components/loaders/PageLoaderShell";
import { AccountLayoutSkeleton } from "@/components/common/SectionSkeletons";

export default function Loading() {
  return (
    <PageLoaderShell footerPadding>
      <AccountLayoutSkeleton variant="addresses" />
    </PageLoaderShell>
  );
}
