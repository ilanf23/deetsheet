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
/** Give up entirely after this long, however the lists are behaving. */
const RESTORE_HARD_CAP_MS = 15000;
/** A list that hasn't grown for this long is treated as fully loaded. */
const GROWTH_STALL_MS = 4000;
/** Marks the sentinel div rendered by useInfiniteList while more items exist. */
const SENTINEL_ATTR = "data-infinite-sentinel";

/**
 * Pages whose columns scroll independently (home, topic, post on lg+) never
 * scroll the window, so we track every element tagged with
 * `data-scroll-restore="<name>"` alongside `window.scrollY`. Each column is
 * saved under its own sub-key of the history entry.
 */
const COLUMN_ATTR = "data-scroll-restore";
const columnKey = (entryKey: string, name: string) => `${entryKey}#${name}`;
const restorableColumns = () =>
  Array.from(document.querySelectorAll<HTMLElement>(`[${COLUMN_ATTR}]`));

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
  // While we are programmatically restoring, the scroll events we cause must
  // not be written back as the "current" position — otherwise a partially
  // grown list clobbers the real target before content finishes loading.
  const restoringRef = useRef(false);

  // Keep the offset for the entry we are currently on up to date.
  useEffect(() => {
    keyRef.current = currentKey;
    let frame = 0;
    const saveAll = () => {
      writeSaved(keyRef.current, window.scrollY);
      for (const col of restorableColumns()) {
        const name = col.getAttribute(COLUMN_ATTR);
        if (name) writeSaved(columnKey(keyRef.current, name), col.scrollTop);
      }
    };
    const onScroll = () => {
      if (restoringRef.current || frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        saveAll();
      });
    };
    // Capture phase so scroll events from inner columns (which don't bubble)
    // are seen here as well as window scrolls.
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      // Save one final time as we leave this history entry.
      saveAll();
      if (frame) window.cancelAnimationFrame(frame);
      document.removeEventListener("scroll", onScroll, { capture: true });
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

    const target = readSaved(currentKey) ?? 0;
    if (target <= 0) window.scrollTo(0, 0);

    // Targets are read once per column and cached: reading storage on every
    // tick would pick up whatever an intermediate scroll event had saved.
    const colTargets = new Map<string, number | null>();
    const targetFor = (name: string) => {
      if (!colTargets.has(name)) colTargets.set(name, readSaved(columnKey(currentKey, name)));
      return colTargets.get(name) ?? null;
    };
    restoringRef.current = true;
    // Instant, never animated: a restore should look like the page was already
    // there, not like it scrolled itself.
    const prevBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";

    // Content loads after the route mounts, and the home page's middle column is
    // an infinite list that only appends when its sentinel is on screen. So we
    // pin each scroller at the bottom (`Math.min(target, max)`) until either the
    // saved offset is reached or the list stops growing altogether.
    const start = performance.now();
    // Per-scroller growth watch: last seen scrollHeight and when it last grew.
    const growth = new Map<string, { height: number; at: number }>();
    const stalled = (id: string, height: number, now: number) => {
      const seen = growth.get(id);
      if (!seen || height > seen.height) {
        growth.set(id, { height, at: now });
        return false;
      }
      return now - seen.at >= GROWTH_STALL_MS;
    };
    // A visible sentinel means a fetch/append is pending, so the list is not
    // stalled even if its scrollHeight hasn't changed yet.
    const sentinelVisible = (col: HTMLElement) => {
      const sentinel = col.querySelector<HTMLElement>(`[${SENTINEL_ATTR}]`);
      if (!sentinel) return false;
      const colRect = col.getBoundingClientRect();
      const sRect = sentinel.getBoundingClientRect();
      return sRect.top < colRect.bottom && sRect.bottom > colRect.top;
    };

    let intervalId: number | null = null;
    const lastDispatches = new Map<string, number>();
    const tick = () => {
      const now = performance.now();
      let keepGoing = false;

      if (target > 0) {
        const height = document.documentElement.scrollHeight;
        const maxScroll = height - window.innerHeight;
        window.scrollTo(0, Math.min(target, Math.max(maxScroll, 0)));
        // No scrollable content yet means the page is still mounting — that
        // is not a stall, keep waiting for it.
        const windowEmpty = height <= window.innerHeight + 1;
        if (
          Math.abs(window.scrollY - target) >= 2 &&
          (windowEmpty || !stalled("window", height, now))
        ) {
          keepGoing = true;
        }
      }

      for (const col of restorableColumns()) {
        const name = col.getAttribute(COLUMN_ATTR);
        if (!name) continue;
        const colTarget = targetFor(name);
        if (colTarget === null || colTarget <= 0) continue;
        const prevColScrollTop = col.scrollTop;
        const max = col.scrollHeight - col.clientHeight;
        col.scrollTop = Math.min(colTarget, Math.max(max, 0));
        const short = Math.abs(col.scrollTop - colTarget) >= 2;
        if (short && col.scrollTop === prevColScrollTop) {
          const last = lastDispatches.get(name) ?? 0;
          if (now - last > 300) {
            col.dispatchEvent(new Event("scroll"));
            lastDispatches.set(name, now);
          }
        }
        // An empty column is still mounting its first batch: not a stall.
        // Likewise, a sentinel on screen means the next batch is in flight.
        const colEmpty = col.scrollHeight <= col.clientHeight + 1;
        if (
          short &&
          (colEmpty ||
            sentinelVisible(col) ||
            !stalled(name, col.scrollHeight, now))
        ) {
          keepGoing = true;
        }
      }

      if (keepGoing && now - start < RESTORE_HARD_CAP_MS) {
        return;
      }
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
      document.documentElement.style.scrollBehavior = prevBehavior;
      // Let the trailing scroll events from our last nudge settle before
      // user scrolls start being recorded again. Until this flips, nothing is
      // written back, so a clamped position can never replace the target.
      window.setTimeout(() => {
        restoringRef.current = false;
      }, 100);
    };
    intervalId = window.setInterval(tick, 50);
    return () => {
      if (intervalId !== null) window.clearInterval(intervalId);
      document.documentElement.style.scrollBehavior = prevBehavior;
      restoringRef.current = false;
    };

    // Restoration runs once per history entry.
  }, [currentKey, navigationType]);

  return null;
};

export default ScrollRestoration;
