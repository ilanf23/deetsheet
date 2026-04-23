import { useEffect, useRef, useState } from "react";

/**
 * Reveal items progressively as the user scrolls. Uses IntersectionObserver
 * on a sentinel <div> rendered after the visible slice. When the sentinel
 * enters the viewport, we bump `visibleCount` by `step` until we reach
 * `total`. This drives the Reddit-style "endless" feed on the homepage.
 */
export function useInfiniteList<T>(items: T[], initial = 10, step = 10) {
  const [visibleCount, setVisibleCount] = useState(initial);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset when the underlying list changes (e.g. data refetch).
  useEffect(() => {
    setVisibleCount(initial);
  }, [items.length, initial]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (visibleCount >= items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + step, items.length));
        }
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visibleCount, items.length, step]);

  return {
    visible: items.slice(0, visibleCount),
    sentinelRef,
    hasMore: visibleCount < items.length,
  };
}
