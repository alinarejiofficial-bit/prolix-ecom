"use client";

import Image from "next/image";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { BRAND_NAME, DEFAULT_BRAND_LOGO } from "@/utils/brand";

export default function BrandLogo({
  width = 144,
  height = 36,
  className = "logo",
  maxHeight = "40px",
  priority = false,
}) {
<<<<<<< HEAD
  const { branding, loading } = useStoreConfig();
  const alt = branding?.companyName || BRAND_NAME;

  if (loading) {
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{ display: "inline-block", width, height, maxHeight }}
      />
    );
  }

  const src = branding?.logoUrl || DEFAULT_BRAND_LOGO;
=======
  const { branding } = useStoreConfig();
  const src = branding?.logoUrl || DEFAULT_BRAND_LOGO;
  const alt = branding?.companyName || BRAND_NAME;
>>>>>>> f260a2e71f33901e474030a5b50a22a246f5fadd

  return (
    <Image
      key={src}
      alt={alt}
      className={className}
      src={src}
      width={width}
      height={height}
      priority={priority}
      unoptimized
      style={{ objectFit: "contain", maxHeight, width: "auto", height: "auto" }}
    />
  );
}
