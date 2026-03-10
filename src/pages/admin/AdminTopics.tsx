import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function AdminTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Topic | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchTopics = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("topics").select("*").order("name");

    if (error) {
      toast({ title: "Error loading topics", description: error.message, variant: "destructive" });
    } else {
      setTopics(data || []);
    }

    // Fetch post counts per topic
    const { data: posts } = await supabase.from("posts").select("topic_id");
    if (posts) {
      const counts: Record<string, number> = {};
      posts.forEach((p) => { counts[p.topic_id] = (counts[p.topic_id] || 0) + 1; });
      setPostCounts(counts);
    }

    setLoading(false);
  };

  useEffect(() => { fetchTopics(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (topic: Topic) => {
    setEditing(topic);
    setForm({ name: topic.name, slug: topic.slug, description: topic.description || "" });
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editing ? prev.slug : generateSlug(name),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: "Name and slug are required", variant: "destructive" });
      return;
    }

    setSaving(true);

    if (editing) {
      const { error } = await supabase
        .from("topics")
        .update({ name: form.name, slug: form.slug, description: form.description || null })
        .eq("id", editing.id);

      if (error) {
        toast({ title: "Error updating topic", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Topic updated" });
        setDialogOpen(false);
        fetchTopics();
      }
    } else {
      const { error } = await supabase
        .from("topics")
        .insert({ name: form.name, slug: form.slug, description: form.description || null });

      if (error) {
        toast({ title: "Error creating topic", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Topic created" });
        setDialogOpen(false);
        fetchTopics();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (topicId: string) => {
    const { error } = await supabase.from("topics").delete().eq("id", topicId);
    if (error) {
      toast({ title: "Error deleting topic", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Topic deleted" });
      fetchTopics();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Topics</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Topic
        </Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No topics found.</TableCell>
              </TableRow>
            ) : (
              topics.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-sm">{t.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.slug}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{t.description || "—"}</TableCell>
                  <TableCell className="text-sm">{postCounts[t.id] || 0}</TableCell>
                  <TableCell className="text-sm">{format(parseISO(t.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete topic?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will delete "{t.name}" and may cascade-delete all associated posts and comments. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Topic" : "New Topic"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="topic-name">Name</Label>
              <Input
                id="topic-name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Machine Learning"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-slug">Slug</Label>
              <Input
                id="topic-slug"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g. machine-learning"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-desc">Description</Label>
              <Textarea
                id="topic-desc"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
