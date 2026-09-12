import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Reveal items progressively as the user scrolls. Uses IntersectionObserver
 * on a sentinel <div> rendered after the visible slice. When the sentinel
 * enters the viewport (or the supplied scroll root), we bump `visibleCount`
 * by `step` until we reach `total`. This drives the Reddit-style "endless"
 * feed on the homepage. Pass `rootRef` when the sentinel lives inside an
 * independently-scrolling container (e.g. the homepage middle column).
 */
export function useInfiniteList<T>(
  items: T[],
  initial = 10,
  step = 10,
  rootMargin = "400px 0px",
  rootRef?: RefObject<Element | null>
) {
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

    const root = rootRef?.current ?? null;
    let loaded = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      setVisibleCount((c) => Math.min(c + step, items.length));
    };
    const check = () => {
      const r = node.getBoundingClientRect();
      const rb = root
        ? root.getBoundingClientRect()
        : { top: 0, bottom: window.innerHeight };
      if (r.bottom >= rb.top && r.top <= rb.bottom) load();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) load();
      },
      { root, rootMargin }
    );
    observer.observe(node);
    const target: EventTarget = root ?? window;
    target.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    const raf = requestAnimationFrame(check);
    return () => {
      observer.disconnect();
      target.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      cancelAnimationFrame(raf);
    };
  }, [visibleCount, items.length, step, rootMargin, rootRef]);

  return {
    visible: items.slice(0, visibleCount),
    sentinelRef,
    hasMore: visibleCount < items.length,
  };
}
