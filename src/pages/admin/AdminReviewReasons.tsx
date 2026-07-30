import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_EDIT_REASONS,
  DEFAULT_REJECT_REASONS,
  fetchReviewReasons,
  type ReviewReason,
  type ReviewReasonKind,
} from "@/lib/reviewReasons";

export default function AdminReviewReasons() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<ReviewReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<ReviewReasonKind>("edit");

  const load = async () => {
    setLoading(true);
    try {
      setRows(await fetchReviewReasons());
    } catch (e) {
      toast({ title: "Could not load reasons", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = useMemo(
    () => rows.filter((r) => r.kind === kind).sort((a, b) => a.sort_order - b.sort_order),
    [rows, kind],
  );

  const refresh = async () => {
    await load();
    void queryClient.invalidateQueries({ queryKey: ["review-reasons"] });
  };

  const addRow = async () => {
    const nextOrder = (list.at(-1)?.sort_order ?? 0) + 10;
    const { error } = await supabase
      .from("review_reasons")
      .insert({ kind, label: "New reason", detail: "", sort_order: nextOrder });
    if (error) return toast({ title: "Add failed", description: error.message, variant: "destructive" });
    void refresh();
  };

  const saveRow = async (row: ReviewReason) => {
    const { error } = await supabase
      .from("review_reasons")
      .update({ label: row.label, detail: row.detail })
      .eq("id", row.id);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Saved" });
    void refresh();
  };

  const removeRow = async (id: string) => {
    const { error } = await supabase.from("review_reasons").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    void refresh();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const a = list[index];
    const b = list[index + dir];
    if (!a || !b) return;
    await Promise.all([
      supabase.from("review_reasons").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("review_reasons").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    void refresh();
  };

  const seedDefaults = async () => {
    const defaults = kind === "edit" ? DEFAULT_EDIT_REASONS : DEFAULT_REJECT_REASONS;
    const { error } = await supabase.from("review_reasons").insert(defaults);
    if (error) return toast({ title: "Seed failed", description: error.message, variant: "destructive" });
    void refresh();
  };

  const update = (id: string, patch: Partial<ReviewReason>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--admin-fg))" }}>
          Review reasons
        </h1>
        <p className="text-sm" style={{ color: "hsl(var(--admin-fg-muted))" }}>
          These options populate the dropdowns in the Review queue's Suggest-edit and Reject dialogs.
        </p>
      </div>

      <Tabs value={kind} onValueChange={(v) => setKind(v as ReviewReasonKind)}>
        <TabsList>
          <TabsTrigger value="edit">Suggest / Adjust</TabsTrigger>
          <TabsTrigger value="reject">Reject / Deny</TabsTrigger>
        </TabsList>

        <TabsContent value={kind} className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" /> Add reason
            </Button>
            {!loading && list.length === 0 && (
              <Button size="sm" variant="outline" onClick={seedDefaults}>
                Load default list
              </Button>
            )}
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reasons yet — the review dialog falls back to the default list.
            </p>
          ) : (
            <ul className="space-y-3">
              {list.map((r, i) => (
                <li key={r.id} className="rounded-md border p-3 space-y-2 bg-card">
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Label (shown in the dropdown)</Label>
                      <Input value={r.label} onChange={(e) => update(r.id, { label: e.target.value })} />
                    </div>
                    <div className="flex flex-col justify-end gap-1">
                      <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => move(i, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={i === list.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Detail inserted into the message to the author</Label>
                    <Textarea
                      rows={2}
                      value={r.detail ?? ""}
                      onChange={(e) => update(r.id, { detail: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => removeRow(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => saveRow(r)}>
                      Save
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
