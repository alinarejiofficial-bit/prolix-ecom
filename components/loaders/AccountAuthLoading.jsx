"use client";

import PageLoaderShell from "@/components/loaders/PageLoaderShell";
import { AccountLayoutSkeleton } from "@/components/common/SectionSkeletons";

export default function AccountAuthLoading({ variant = "form" }) {
  return (
    <PageLoaderShell footerPadding>
      <AccountLayoutSkeleton variant={variant} />
    </PageLoaderShell>
  );
}
