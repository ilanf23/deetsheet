import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PENDING_DEADLINE_SHORT } from "@/lib/reviewCopy";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

type Template = {
  id: string;
  title: string;
  subject: string;
  reason_default: string | null;
  suggestions_default: string | null;
  deadline_default: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ManageTemplatesDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editing, setEditing] = useState<Partial<Template> | null>(null);

  const load = async () => {
    const { data } = await supabase.from("message_templates").select("*").order("title");
    setTemplates((data ?? []) as Template[]);
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const save = async () => {
    if (!editing?.title || !editing?.subject) {
      toast({ title: "Title and subject required", variant: "destructive" });
      return;
    }
    const payload = {
      title: editing.title,
      subject: editing.subject,
      reason_default: editing.reason_default ?? null,
      suggestions_default: editing.suggestions_default ?? null,
      deadline_default: editing.deadline_default ?? null,
    };
    const { error } = editing.id
      ? await supabase.from("message_templates").update(payload).eq("id", editing.id)
      : await supabase.from("message_templates").insert({ ...payload, created_by: user?.id });
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("message_templates").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Form letters</DialogTitle>
        </DialogHeader>

        {editing ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title (internal)</Label>
              <Input
                value={editing.title ?? ""}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Subject</Label>
              <Input
                value={editing.subject ?? ""}
                onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Reason (default)</Label>
              <Textarea
                rows={2}
                value={editing.reason_default ?? ""}
                onChange={(e) => setEditing({ ...editing, reason_default: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Suggestions (default)</Label>
              <Textarea
                rows={2}
                value={editing.suggestions_default ?? ""}
                onChange={(e) => setEditing({ ...editing, suggestions_default: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Deadline text (default)</Label>
              <Input
                value={editing.deadline_default ?? ""}
                onChange={(e) => setEditing({ ...editing, deadline_default: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() =>
                  setEditing({
                    title: "",
                    subject: "",
                    reason_default: "",
                    suggestions_default: "",
                    deadline_default: PENDING_DEADLINE_SHORT,
                  })
                }
              >
                New form letter
              </Button>
            </div>
            {templates.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No form letters yet.
              </div>
            ) : (
              <ul className="divide-y border rounded-md">
                {templates.map((t) => (
                  <li key={t.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{t.subject}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(t)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
