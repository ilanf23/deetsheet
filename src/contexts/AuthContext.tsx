import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  avatarUrl: string | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  avatarUrl: null,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();
    if (!error && data) {
      setAvatarUrl(data.avatar_url || null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
    } else {
      setAvatarUrl(null);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        // The supabase client ticks an auto-refresh every ~30s. Without this
        // guard every tick produced brand new `user`/`session` identities and
        // re-rendered the entire app (blowing away open dialogs mid-typing).
        setSession((prev) => {
          if (prev?.access_token === nextSession?.access_token) return prev;
          return nextSession;
        });
        // Only swap the user object when the *identity* actually changed.
        // TOKEN_REFRESHED is a no-op for `user`.
        if (event !== "TOKEN_REFRESHED") {
          setUser((prev) => {
            const nextUser = nextSession?.user ?? null;
            if (prev?.id && nextUser?.id && prev.id === nextUser.id) return prev;
            if (!prev && !nextUser) return prev;
            return nextUser;
          });
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);


  // Fire the branded welcome email once per account. The edge function is
  // idempotent (deduped server-side), this just avoids repeat calls per tab.
  useEffect(() => {
    if (!user?.id) return;
    const key = `deetsheet:welcome-email:${user.id}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    supabase.functions
      .invoke("send-welcome-email")
      .catch((e) => console.error("welcome email failed", e));
  }, [user?.id]);


  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ user, session, loading, signOut, avatarUrl, refreshProfile }),
    [user, session, loading, signOut, avatarUrl, refreshProfile]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>

  );
};
