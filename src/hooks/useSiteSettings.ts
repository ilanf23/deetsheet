import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const USER_MESSAGING_KEY = "user_messaging_enabled";

/**
 * Platform-wide kill switch for user-to-user messaging. Defaults to OFF when
 * the row is missing or unreadable — admin↔user messaging is unaffected.
 */
export function useUserMessagingEnabled() {
  return useQuery({
    queryKey: ["site-setting", USER_MESSAGING_KEY],
    staleTime: 60_000,
    queryFn: async (): Promise<boolean> => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", USER_MESSAGING_KEY)
        .maybeSingle();
      return data?.value === true;
    },
  });
}

export function useSetUserMessagingEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: USER_MESSAGING_KEY, value: enabled }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["site-setting", USER_MESSAGING_KEY] }),
  });
}
