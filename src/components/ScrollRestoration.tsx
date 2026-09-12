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
const RESTORE_HARD_CAP_MS = 10000;
/** A list that hasn't grown for this long is treated as fully loaded. */
const GROWTH_STALL_MS = 1500;

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

    // Content loads after the route mounts (and infinite lists grow as we
    // scroll them), so keep nudging until every target is tall enough to hold
    // its saved offset — or we run out of patience.
    const start = performance.now();
    let frame = 0;
    const tick = () => {
      let allReached = true;

      if (target > 0) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, Math.min(target, Math.max(maxScroll, 0)));
        if (Math.abs(window.scrollY - target) >= 2) allReached = false;
      }

      for (const col of restorableColumns()) {
        const name = col.getAttribute(COLUMN_ATTR);
        if (!name) continue;
        const colTarget = targetFor(name);
        if (colTarget === null || colTarget <= 0) continue;
        const max = col.scrollHeight - col.clientHeight;
        col.scrollTop = Math.min(colTarget, Math.max(max, 0));
        if (Math.abs(col.scrollTop - colTarget) >= 2) allReached = false;
      }

      if (!allReached && performance.now() - start < RESTORE_WINDOW_MS) {
        frame = window.requestAnimationFrame(tick);
      } else {
        // Let the trailing scroll events from our last nudge settle before
        // user scrolls start being recorded again.
        window.setTimeout(() => {
          restoringRef.current = false;
        }, 100);
      }
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      restoringRef.current = false;
    };
    // Restoration runs once per history entry.
  }, [currentKey, navigationType]);

  return null;
};

export default ScrollRestoration;
