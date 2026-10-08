"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Custom hook to detect when an element enters the viewport
 * @param {Object} options - Intersection Observer options
 * @param {number} options.threshold - Threshold for intersection (0-1)
 * @param {string} options.rootMargin - Root margin for the observer
 * @returns {Array} [ref, isIntersecting] - Ref to attach to element and intersection state
 */
export function useIntersectionObserver(options = {}) {
  const {
    threshold = 0.1,
    rootMargin = "50px", // Start loading slightly before the element is fully visible
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const isVisible = entry.isIntersecting;

        setIsIntersecting(isVisible);

        // Once it has intersected, keep the state true (don't reset)
        if (isVisible && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, hasIntersected]);

  return [elementRef, hasIntersected];
}

