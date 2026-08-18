import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // The user id we have already resolved a role for. Once resolved we never
  // flip back into a loading state for that same user — otherwise a background
  // re-render would unmount the admin route subtree (and any open dialog).
  const resolvedForUserId = useRef<string | null | undefined>(undefined);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading) return;
    if (resolvedForUserId.current === userId) return;

    if (!userId) {
      resolvedForUserId.current = null;
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (cancelled) return;
      resolvedForUserId.current = userId;
      setIsAdmin(!!data);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, authLoading]);

  return { isAdmin, isLoading, user };
}
