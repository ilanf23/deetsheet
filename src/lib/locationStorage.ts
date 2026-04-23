/**
 * Anonymous-visitor location persistence.
 *
 * Spec (per product decision):
 * - Key:     `deetsheet:location:v1`            (versioned for migrations)
 * - Value:   { city, state, source, setAt }     where source = "manual" | "ip" | "dismissed"
 * - On signup, the caller reads this, copies it into the profile, then clears the key.
 * - On logout, do NOT clear — anonymous browsing should still work.
 * - On parse failure or absence, the consumer treats it as "no location set".
 */

export type LocationSource = "manual" | "ip" | "dismissed";

export interface StoredLocation {
  city: string | null;
  state: string | null;
  source: LocationSource;
  setAt: string; // ISO timestamp
}

const KEY = "deetsheet:location:v1";

export const readStoredLocation = (): StoredLocation | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredLocation>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.source !== "manual" && parsed.source !== "ip" && parsed.source !== "dismissed") {
      return null;
    }
    return {
      city: typeof parsed.city === "string" ? parsed.city : null,
      state: typeof parsed.state === "string" ? parsed.state : null,
      source: parsed.source,
      setAt: typeof parsed.setAt === "string" ? parsed.setAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

export const writeStoredLocation = (
  city: string | null,
  state: string | null,
  source: LocationSource
): void => {
  if (typeof window === "undefined") return;
  const value: StoredLocation = {
    city,
    state,
    source,
    setAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* storage full or blocked — silently fall back to in-memory only */
  }
};

export const clearStoredLocation = (): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
