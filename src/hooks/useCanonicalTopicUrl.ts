import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { canonicalTopicPath } from "@/lib/topicSlug";

/** Replace legacy topic segments without reloading or adding a history entry. */
export function useCanonicalTopicUrl(name: string | undefined) {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!name) return;
    const pathname = canonicalTopicPath(location.pathname, name);
    if (pathname !== location.pathname) {
      navigate({ pathname, search: location.search, hash: location.hash }, { replace: true });
    }
  }, [name, location.pathname, location.search, location.hash, navigate]);
}