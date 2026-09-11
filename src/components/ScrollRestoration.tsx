import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Restores the window scroll position when the user presses Back/Forward, and
 * scrolls to the top on a fresh navigation.
 *
 * The browser's own restoration is unreliable in a SPA: the page is re-rendered
 * empty first and feed content arrives asynchronously, so by the time the list
 * exists the browser has already given up. We remember the offset per history
 * entry and re-apply it over a short window while the page grows tall enough.
 */
const STORAGE_PREFIX = "scrollpos:";
const RESTORE_WINDOW_MS = 2000;

function readSaved(key: string): number | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}

function writeSaved(key: string, value: number) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, String(value));
  } catch {
    /* private mode / quota: scroll memory is best-effort */
  }
}

const ScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const currentKey = location.key || "default";
  const keyRef = useRef(currentKey);

  // Keep the offset for the entry we are currently on up to date.
  useEffect(() => {
    keyRef.current = currentKey;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        writeSaved(keyRef.current, window.scrollY);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      // Save one final time as we leave this history entry.
      writeSaved(keyRef.current, window.scrollY);
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [currentKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    if (navigationType !== "POP") {
      window.scrollTo(0, 0);
      return;
    }

    const target = readSaved(currentKey);
    if (target === null || target <= 0) {
      window.scrollTo(0, 0);
      return;
    }

    // Content loads after the route mounts, so keep nudging until the document
    // is tall enough to hold the saved offset (or we run out of patience).
    const start = performance.now();
    let frame = 0;
    const tick = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, Math.min(target, Math.max(maxScroll, 0)));
      const reached = Math.abs(window.scrollY - target) < 2;
      if (!reached && performance.now() - start < RESTORE_WINDOW_MS) {
        frame = window.requestAnimationFrame(tick);
      }
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
    // Restoration runs once per history entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, navigationType]);

  return null;
};

export default ScrollRestoration;
