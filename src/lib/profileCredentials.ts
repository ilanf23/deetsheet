export const CREDENTIAL_ICON_VALUES = [
  "pencil",
  "graduation",
  "briefcase",
  "award",
  "eye",
] as const;

export type CredentialIcon = (typeof CREDENTIAL_ICON_VALUES)[number];

export type ProfileCredential = {
  icon: CredentialIcon;
  text: string;
};

const MAX_CREDENTIALS = 30;
const MAX_TEXT_LENGTH = 200;

function isCredentialIcon(value: unknown): value is CredentialIcon {
  return (
    typeof value === "string" &&
    (CREDENTIAL_ICON_VALUES as readonly string[]).includes(value)
  );
}

/** Keep only credentials the `profiles.credentials` check constraint accepts. */
export function parseProfileCredentials(value: unknown): ProfileCredential[] {
  if (!Array.isArray(value)) return [];

  const credentials: ProfileCredential[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as { icon?: unknown; text?: unknown };
    const text = typeof raw.text === "string" ? raw.text.trim() : "";
    if (!text || text.length > MAX_TEXT_LENGTH) continue;
    credentials.push({
      icon: isCredentialIcon(raw.icon) ? raw.icon : "pencil",
      text,
    });
    if (credentials.length >= MAX_CREDENTIALS) break;
  }
  return credentials;
}
