import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { buildLoginPath } from "@/lib/authRedirect";

type Prefs = {
  post_updates: boolean;
  admin_messages: boolean;
  comment_notifications: boolean;
  member_messages: boolean;
};

const DEFAULT_PREFS: Prefs = {
  post_updates: true,
  admin_messages: true,
  comment_notifications: true,
  member_messages: true,
};

const CATEGORIES: { key: keyof Prefs; title: string; description: string }[] = [
  {
    key: "post_updates",
    title: "Post review updates",
    description: "Emails when your post is received, approved, adjusted, or needs changes.",
  },
  {
    key: "admin_messages",
    title: "Messages from DeetSheet",
    description: "Emails when a DeetSheet moderator sends you a message.",
  },
  {
    key: "member_messages",
    title: "Messages from other members",
    description:
      "Emails when another member messages you. Message requests are never emailed.",
  },
  {
    key: "comment_notifications",
    title: "Comment notifications",
    description: "Emails when someone comments on one of your posts.",
  },
];

const EmailPreferences = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<keyof Prefs | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(buildLoginPath("/email-preferences"), { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("email_preferences")
        .select("post_updates, admin_messages, comment_notifications, member_messages")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data) setPrefs(data as Prefs);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, navigate]);

  const update = async (key: keyof Prefs, value: boolean) => {
    if (!user?.email) return;
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(key);
    const { error } = await supabase.from("email_preferences").upsert(
      { user_id: user.id, email: user.email, ...next },
      { onConflict: "user_id" },
    );
    setSaving(null);
    if (error) {
      setPrefs(previous);
      toast({
        title: "Couldn't save",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-3xl font-bold font-heading text-foreground mb-2">
          Email preferences
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Choose which DeetSheet emails you'd like to receive.
        </p>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading your preferences…</p>
        ) : (
          <div className="space-y-3">
            {CATEGORIES.map(({ key, title, description }) => (
              <div
                key={key}
                className="flex items-start justify-between gap-6 rounded-lg border bg-card px-4 py-4"
              >
                <div>
                  <Label htmlFor={key} className="text-sm font-semibold text-card-foreground">
                    {title}
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
                <Switch
                  id={key}
                  checked={prefs[key]}
                  disabled={saving === key}
                  onCheckedChange={(v) => update(key, v)}
                />
              </div>
            ))}

            <div className="flex items-start justify-between gap-6 rounded-lg border bg-muted/40 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  Account &amp; security emails
                </p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Sign-in, password, and account notices. These are always sent.
                </p>
              </div>
              <Switch checked disabled aria-label="Account emails are always on" />
            </div>
          </div>
        )}
      </main>
      <DeetFooter />
    </div>
  );
};

export default EmailPreferences;
