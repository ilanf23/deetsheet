import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SITE_PAGE_SECTIONS } from "@/lib/sitePages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Row {
  slug: string;
  title: string;
  content: string;
}

export default function AdminSitePages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("site_pages")
        .select("slug,title,content");
      if (error) {
        toast({ title: "Failed to load", description: error.message, variant: "destructive" });
      }
      const map: Record<string, Row> = {};
      SITE_PAGE_SECTIONS.forEach((s) => {
        const existing = (data ?? []).find((r) => r.slug === s.slug);
        map[s.slug] = {
          slug: s.slug,
          title: existing?.title ?? s.defaultTitle,
          content: existing?.content ?? s.defaultContent,
        };
      });
      setRows(map);
      setLoading(false);
    };
    load();
  }, [toast]);

  const update = (slug: string, patch: Partial<Row>) => {
    setRows((prev) => ({ ...prev, [slug]: { ...prev[slug], ...patch } }));
  };

  const save = async (slug: string) => {
    const row = rows[slug];
    if (!row) return;
    setSaving(slug);
    const { error } = await supabase.from("site_pages").upsert(
      {
        slug,
        title: row.title,
        content: row.content,
        updated_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    );
    setSaving(null);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Page content updated." });
    }
  };

  const reset = (slug: string) => {
    const def = SITE_PAGE_SECTIONS.find((s) => s.slug === slug);
    if (!def) return;
    update(slug, { title: def.defaultTitle, content: def.defaultContent });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Site Pages</h1>
        <p className="text-sm text-muted-foreground">
          Edit the content of static pages like About and Become an Investor.
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!loading &&
        SITE_PAGE_SECTIONS.map((section) => {
          const row = rows[section.slug];
          if (!row) return null;
          return (
            <div key={section.slug} className="rounded-lg border p-5 space-y-3 bg-card">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{section.label}</h2>
                <span className="text-xs text-muted-foreground font-mono">{section.slug}</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`title-${section.slug}`}>Title</Label>
                <Input
                  id={`title-${section.slug}`}
                  value={row.title}
                  onChange={(e) => update(section.slug, { title: e.target.value })}
                  maxLength={200}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`content-${section.slug}`}>Content</Label>
                <Textarea
                  id={`content-${section.slug}`}
                  value={row.content}
                  onChange={(e) => update(section.slug, { content: e.target.value })}
                  rows={10}
                />
                <p className="text-xs text-muted-foreground">
                  Plain text. Blank lines create paragraphs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={() => save(section.slug)} disabled={saving === section.slug}>
                  {saving === section.slug ? "Saving…" : "Save"}
                </Button>
                <Button variant="outline" onClick={() => reset(section.slug)}>
                  Reset to default
                </Button>
              </div>
            </div>
          );
        })}
    </div>
  );
}
