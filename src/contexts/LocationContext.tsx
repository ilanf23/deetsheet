import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  readStoredLocation,
  writeStoredLocation,
  clearStoredLocation,
} from "@/lib/locationStorage";

/**
 * Unified location for the current visitor.
 *
 * - Signed in: source of truth is `profiles.location_id` → joined `locations` row.
 * - Signed out: source of truth is localStorage (`deetsheet:location:v1`).
 *
 * Either may be absent — the entire site must work in "national mode" when so.
 */

export interface ActiveLocation {
  id: string | null; // locations.id, only present for signed-in users
  city: string;
  state: string; // 2-letter
  country: string; // 2-letter, default "US"
}

interface LocationContextValue {
  location: ActiveLocation | null;
  loading: boolean;
  /**
   * Save a city/state for the current visitor. For signed-in users this writes
   * `profiles.location_id`; for anonymous visitors it writes localStorage.
   * Returns the resolved location id when signed-in, otherwise null.
   */
  setLocation: (city: string, state: string) => Promise<ActiveLocation | null>;
  /** Clear location everywhere appropriate for the current visitor. */
  clearLocation: () => Promise<void>;
  /** Mark the IP-suggestion banner as dismissed (anon only). No-op if signed-in. */
  dismissSuggestion: () => void;
  /** Whether the anon visitor has previously dismissed the location prompt. */
  hasDismissed: boolean;
}

const LocationContext = createContext<LocationContextValue>({
  location: null,
  loading: true,
  setLocation: async () => null,
  clearLocation: async () => {},
  dismissSuggestion: () => {},
  hasDismissed: false,
});

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [location, setLocationState] = useState<ActiveLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasDismissed, setHasDismissed] = useState(false);

  /** Pull the signed-in user's location from the profile + locations join. */
  const loadProfileLocation = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("location_id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.location_id) {
      setLocationState(null);
      return;
    }

    const { data: loc } = await supabase
      .from("locations")
      .select("id, city, state, country")
      .eq("id", profile.location_id)
      .maybeSingle();

    if (loc) {
      setLocationState({
        id: loc.id,
        city: loc.city,
        state: loc.state,
        country: loc.country,
      });
    } else {
      setLocationState(null);
    }
  }, []);

  /** Re-hydrate whenever auth changes. */
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      if (user) {
        // Signed-in: prefer profile. If they had an anon location set before
        // signup, the SignUp form is responsible for copying + clearing it.
        await loadProfileLocation(user.id);
      } else {
        const stored = readStoredLocation();
        if (stored?.source === "dismissed") {
          setHasDismissed(true);
          setLocationState(null);
        } else if (stored?.city && stored.state) {
          setHasDismissed(false);
          setLocationState({
            id: null,
            city: stored.city,
            state: stored.state,
            country: "US",
          });
        } else {
          setHasDismissed(false);
          setLocationState(null);
        }
      }
      if (!cancelled) setLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, loadProfileLocation]);

  const setLocation = useCallback(
    async (city: string, state: string): Promise<ActiveLocation | null> => {
      const cleanCity = city.trim();
      const cleanState = state.trim().toUpperCase();
      if (!cleanCity || cleanState.length !== 2) return null;

      if (user) {
        // Resolve (or create) the canonical locations row, then point the profile at it.
        const { data: locId, error: rpcError } = await supabase.rpc(
          "get_or_create_location",
          { _city: cleanCity, _state: cleanState, _country: "US" }
        );
        if (rpcError || !locId) return null;

        const { error: updErr } = await supabase
          .from("profiles")
          .update({ location_id: locId as string })
          .eq("id", user.id);
        if (updErr) return null;

        const next: ActiveLocation = {
          id: locId as string,
          city: cleanCity,
          state: cleanState,
          country: "US",
        };
        setLocationState(next);
        // Refresh any feed query that depends on location
        queryClient.invalidateQueries({ queryKey: ["home-feed"] });
        return next;
      }

      // Anonymous: persist to localStorage only.
      writeStoredLocation(cleanCity, cleanState, "manual");
      const next: ActiveLocation = {
        id: null,
        city: cleanCity,
        state: cleanState,
        country: "US",
      };
      setLocationState(next);
      setHasDismissed(false);
      queryClient.invalidateQueries({ queryKey: ["home-feed"] });
      return next;
    },
    [user, queryClient]
  );

  const clearLocation = useCallback(async () => {
    if (user) {
      await supabase.from("profiles").update({ location_id: null }).eq("id", user.id);
      setLocationState(null);
    } else {
      clearStoredLocation();
      setLocationState(null);
      setHasDismissed(false);
    }
    queryClient.invalidateQueries({ queryKey: ["home-feed"] });
  }, [user, queryClient]);

  const dismissSuggestion = useCallback(() => {
    if (user) return;
    writeStoredLocation(null, null, "dismissed");
    setHasDismissed(true);
  }, [user]);

  return (
    <LocationContext.Provider
      value={{ location, loading, setLocation, clearLocation, dismissSuggestion, hasDismissed }}
    >
      {children}
    </LocationContext.Provider>
  );
};
