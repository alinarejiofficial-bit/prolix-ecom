"use client";

import { useEffect } from "react";
import { refreshWow } from "@/utlis/initWow";

/**
 * Re-initializes WOW.js animations after async content renders.
 * @param {boolean} ready - When true, WOW will scan for new `.wow` elements.
 */
export function useWowRefresh(ready) {
  useEffect(() => {
    if (!ready) return;

    const frame = requestAnimationFrame(() => {
      refreshWow();
    });

    return () => cancelAnimationFrame(frame);
  }, [ready]);
}
