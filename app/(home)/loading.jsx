import PageLoaderShell from "@/components/loaders/PageLoaderShell";
import { HomePageContentSkeleton } from "@/components/common/SectionSkeletons";

export default function Loading() {
  return (
    <PageLoaderShell showCartToggler>
      <HomePageContentSkeleton />
    </PageLoaderShell>
  );
}
