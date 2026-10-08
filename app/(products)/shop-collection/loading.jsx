import PageLoaderShell from "@/components/loaders/PageLoaderShell";
import { CollectionsSkeleton } from "@/components/common/SectionSkeletons";

export default function Loading() {
  return (
    <PageLoaderShell showCartToggler>
      <CollectionsSkeleton />
    </PageLoaderShell>
  );
}
