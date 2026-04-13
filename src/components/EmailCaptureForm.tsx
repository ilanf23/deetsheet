import { useState } from "react";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Inline email capture form that writes to the `email_captures` table
 * created in Sprint 0 migration 20260410120300_email_captures.sql.
 * Designed to be dropped into the homepage sidebar or footer CTA area.
 */
const EmailCaptureForm = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("email_captures" as any)
        .insert({ email: email.trim().toLowerCase(), source: "homepage" });

      if (error) {
        // Unique constraint means they already signed up
        if (error.code === "23505") {
          toast({ title: "You're already signed up!", description: "We'll keep you in the loop." });
          setSubmitted(true);
          return;
        }
        throw error;
      }
      setSubmitted(true);
      toast({ title: "You're in!", description: "We'll send you the best deets." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border bg-card p-5 text-center">
        <Mail className="w-8 h-8 text-orange-500 mx-auto mb-2" />
        <p className="text-sm font-medium">Thanks for signing up!</p>
        <p className="text-xs text-muted-foreground mt-1">We'll keep you posted on the best deets.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-5 h-5 text-orange-500" />
        <h3 className="text-sm font-semibold">Get the DeetSheet</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Top-rated advice delivered to your inbox. No spam, ever.
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="text-sm"
        />
        <Button
          type="submit"
          size="sm"
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
        >
          {loading ? "..." : "Join"}
        </Button>
      </div>
    </form>
  );
};

export default EmailCaptureForm;
