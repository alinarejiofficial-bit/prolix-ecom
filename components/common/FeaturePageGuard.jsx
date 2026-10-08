"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStoreConfig } from "@/context/StoreConfigContext";

export default function FeaturePageGuard({ module, feature, children }) {
  const router = useRouter();
  const { loading, isModuleEnabled, isFeatureEnabled } = useStoreConfig();
  const allowed = (!module || isModuleEnabled(module)) && (!feature || isFeatureEnabled(feature));

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace("/");
    }
  }, [allowed, loading, router]);

  if (loading || !allowed) {
    return null;
  }

  return children;
}
