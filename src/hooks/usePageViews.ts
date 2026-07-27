import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GA_MEASUREMENT_ID = "G-8GKKC2CXYJ";

/**
 * Fires a GA4 page_view on every client-side route change.
 * No-ops safely when gtag hasn't loaded (blocked, offline, dev).
 */
export function usePageViews() {
  const location = useLocation();

  useEffect(() => {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag !== "function") return;
    gtag("config", GA_MEASUREMENT_ID, {
      page_path: location.pathname + location.search,
    });
  }, [location.pathname, location.search]);
}
