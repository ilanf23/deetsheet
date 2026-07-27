const STORAGE_KEY = "deetsheet:returnTo";

/** Only allow same-site relative paths — never absolute/external URLs. */
export function sanitizeReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export function buildLoginPath(returnTo: string): string {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function rememberReturnTo(returnTo: string | null) {
  try {
    if (returnTo) sessionStorage.setItem(STORAGE_KEY, returnTo);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — fall back to default redirect */
  }
}

export function consumeReturnTo(): string | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return sanitizeReturnTo(value);
  } catch {
    return null;
  }
}
