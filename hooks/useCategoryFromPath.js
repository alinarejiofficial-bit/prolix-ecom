"use client";

import { usePathname } from "next/navigation";

/**
 * Returns category ID when URL is /products/category/:categoryId, else null.
 * @returns {{ categoryId: string | null, isCategoryPage: boolean }}
 */
export function useCategoryFromPath() {
  const pathname = usePathname();
  const match = pathname?.match(/^\/products\/category\/([^/]+)$/);
  const categoryId = match ? match[1] : null;
  return {
    categoryId,
    isCategoryPage: Boolean(categoryId),
  };
}
