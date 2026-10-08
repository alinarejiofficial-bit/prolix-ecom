import PageLoaderShell from "@/components/loaders/PageLoaderShell";
import { ContactPageSkeleton } from "@/components/common/SectionSkeletons";

export default function Loading() {
  return (
    <PageLoaderShell footerPadding>
      <ContactPageSkeleton />
    </PageLoaderShell>
  );
}
