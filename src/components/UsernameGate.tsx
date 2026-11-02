import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { checkUsername, isUniqueViolation } from "@/lib/username";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EXCLUDED = ["/login", "/signup", "/auth/callback", "/forgot-password", "/reset-password"];

/** Non-dismissable prompt shown to signed-in users who have no username yet. */
const UsernameGate = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const [needsUsername, setNeedsUsername] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setNeedsUsername(false);
      return;
    }
    supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (!cancelled && !err) setNeedsUsername(!data?.username?.trim());
      });
    return () => {
      cancelled = true;
    };
  }, [user, pathname]);

  if (!user || !needsUsername || EXCLUDED.includes(pathname)) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const problem = await checkUsername(value);
      if (problem) {
        setError(problem);
        return;
      }
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ username: value.trim() })
        .eq("id", user.id);
      if (updErr) {
        setError(isUniqueViolation(updErr) ? "That username is taken" : updErr.message);
        return;
      }
      setNeedsUsername(false);
      queryClient.invalidateQueries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save username");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open>
      <DialogContent
        className="[&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Choose a username to continue.</DialogTitle>
          <DialogDescription>
            3–30 characters: letters, numbers, underscore, dot or dash.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="gate-username">Username</Label>
            <Input
              id="gate-username"
              autoFocus
              value={value}
              maxLength={30}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder="your_username"
              aria-invalid={!!error}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={saving || !value.trim()}>
            {saving ? "Saving..." : "Save username"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UsernameGate;
