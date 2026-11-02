import { supabase } from "@/integrations/supabase/client";

export const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,30}$/;

/** Returns an error message, or null when the username format is valid. */
export const validateUsernameFormat = (raw: string): string | null => {
  const value = raw.trim();
  if (value.length < 3 || value.length > 30) return "Username must be 3–30 characters.";
  if (!USERNAME_PATTERN.test(value)) return "Use only letters, numbers, underscore, dot or dash.";
  return null;
};

/** Case-insensitive check against other profiles (ignores the caller's own row). */
export const isUsernameTaken = async (raw: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc("is_username_taken" as never, { _username: raw.trim() } as never);
  if (error) throw error;
  return !!data;
};

/** Full check: format + taken. Returns an error message or null. */
export const checkUsername = async (raw: string): Promise<string | null> => {
  const formatError = validateUsernameFormat(raw);
  if (formatError) return formatError;
  if (await isUsernameTaken(raw)) return "That username is taken";
  return null;
};

/** Whether the signed-in user currently has a username saved. */
export const currentUserHasUsername = async (userId: string): Promise<boolean> => {
  const { data } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();
  return !!data?.username?.trim();
};

export const isUniqueViolation = (error: { code?: string } | null | undefined) => error?.code === "23505";
