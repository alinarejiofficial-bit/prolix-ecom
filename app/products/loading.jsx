import PageLoaderShell from "@/components/loaders/PageLoaderShell";
import { ProductGridPageSkeleton } from "@/components/common/SectionSkeletons";

export default function Loading() {
  return (
    <PageLoaderShell showCartToggler>
      <ProductGridPageSkeleton />
    </PageLoaderShell>
  );
}
