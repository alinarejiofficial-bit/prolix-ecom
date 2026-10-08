"use client";

import { useEffect } from "react";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { BRAND_NAME, DEFAULT_BRAND_FAVICON } from "@/utils/brand";

function upsertIcon(rel, href) {
  let link = document.querySelector(`link[rel='${rel}']`);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

export default function BrandFavicon() {
  const { branding, loading } = useStoreConfig();

  useEffect(() => {
    if (loading) return;
    const favicon = DEFAULT_BRAND_FAVICON;
    upsertIcon("icon", favicon);
    upsertIcon("apple-touch-icon", favicon);

    const name = branding?.companyName || BRAND_NAME;
    if (name && !document.title.toLowerCase().includes(name.toLowerCase())) {
      const current = document.title.replace(/\s*[-|].*$/, "").trim();
      if (!current || /lili/i.test(document.title)) {
        document.title = name;
      }
    }
  }, [branding, loading]);

  return null;
}
