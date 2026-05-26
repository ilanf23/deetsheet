import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Check, X, Image as ImageIcon, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { subjectCategories } from "@/data/seedData";
import AdminSortSelect from "@/components/admin/AdminSortSelect";

interface Topic {
  id: string;
  name: string;
  description: string | null;
  category_name: string;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  image_url: string | null;
  subtitle_override: string | null;
}

type SortKey =
  | "name_asc"
  | "name_desc"
  | "subject_asc"
  | "subject_desc"
  | "posts_desc"
  | "posts_asc"
  | "newest"
  | "oldest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name_asc", label: "Name — A to Z" },
  { value: "name_desc", label: "Name — Z to A" },
  { value: "subject_asc", label: "Subject — A to Z" },
  { value: "subject_desc", label: "Subject — Z to A" },
  { value: "posts_desc", label: "Posts — Most first" },
  { value: "posts_asc", label: "Posts — Fewest first" },
  { value: "newest", label: "Created — Newest" },
  { value: "oldest", label: "Created — Oldest" },
];

function generateSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function AdminTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Topic | null>(null);
  const [form, setForm] = useState({ name: "", category_name: "" });
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sort, setSort] = useState<SortKey>("name_asc");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const sortedTopics = useMemo(() => {
    const cmpStr = (a: string, b: string) =>
      a.localeCompare(b, undefined, { sensitivity: "base" });
    const cmpDate = (a?: string | null, b?: string | null) =>
      new Date(a ?? 0).getTime() - new Date(b ?? 0).getTime();
    const q = search.trim().toLowerCase();
    const arr = (q
      ? topics.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            (t.category_name ?? "").toLowerCase().includes(q),
        )
      : [...topics]);
    switch (sort) {
      case "name_asc":
        arr.sort((a, b) => cmpStr(a.name ?? "", b.name ?? ""));
        break;
      case "name_desc":
        arr.sort((a, b) => cmpStr(b.name ?? "", a.name ?? ""));
        break;
      case "subject_asc":
        arr.sort((a, b) => cmpStr(a.category_name ?? "", b.category_name ?? ""));
        break;
      case "subject_desc":
        arr.sort((a, b) => cmpStr(b.category_name ?? "", a.category_name ?? ""));
        break;
      case "posts_desc":
        arr.sort((a, b) => (postCounts[b.id] ?? 0) - (postCounts[a.id] ?? 0));
        break;
      case "posts_asc":
        arr.sort((a, b) => (postCounts[a.id] ?? 0) - (postCounts[b.id] ?? 0));
        break;
      case "newest":
        arr.sort((a, b) => cmpDate(b.created_at, a.created_at));
        break;
      case "oldest":
        arr.sort((a, b) => cmpDate(a.created_at, b.created_at));
        break;
    }
    return arr;
  }, [topics, postCounts, sort, search]);

  const fetchTopics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("topics")
      .select("id, name, description, category_name, created_at, status, image_url")
      .order("name");

    if (error) {
      toast({ title: "Error loading topics", description: error.message, variant: "destructive" });
    } else {
      setTopics((data as Topic[]) || []);
    }

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
    setForm({ name: "", category_name: "" });
    setDialogOpen(true);
  };

  const openEdit = (topic: Topic) => {
    setEditing(topic);
    setForm({ name: topic.name, category_name: topic.category_name || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (!form.category_name.trim()) {
      toast({ title: "Subject is required", variant: "destructive" });
      return;
    }
    if (!subjectCategories.includes(form.category_name)) {
      toast({
        title: "Pick a subject from the list",
        description: "Topics with custom subjects won't appear in the directory.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    if (editing) {
      const { error } = await supabase
        .from("topics")
        .update({ name: form.name, category_name: form.category_name })
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
        .insert({ name: form.name, slug: generateSlug(form.name), category_name: form.category_name, description: null, status: "approved" });

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

  const handleSetStatus = async (topicId: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("topics").update({ status }).eq("id", topicId);
    if (error) {
      toast({ title: `Error ${status === "approved" ? "approving" : "rejecting"} topic`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "approved" ? "Topic approved" : "Topic rejected" });
      fetchTopics();
    }
  };

  const handleReplaceImage = async (topic: Topic, file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Use JPEG, PNG, or WebP", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be 5MB or smaller", variant: "destructive" });
      return;
    }
    const ext = file.name.split(".").pop() || "jpg";
    const path = `admin/topics/${topic.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("post-images")
      .upload(path, file, { upsert: false });
    if (upErr) {
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      return;
    }
    const url = supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.from("topics").update({ image_url: url }).eq("id", topic.id);
    if (error) {
      toast({ title: "Couldn't update image", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Topic image updated" });
    fetchTopics();
  };

  const handleClearImage = async (topic: Topic) => {
    const { error } = await supabase.from("topics").update({ image_url: null }).eq("id", topic.id);
    if (error) {
      toast({ title: "Couldn't clear image", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Topic image cleared" });
    fetchTopics();
  };

  const filteredTopicNames = topics
    .filter((t) => t.id !== editing?.id)
    .filter((t) => !form.category_name || t.category_name === form.category_name)
    .filter((t) => !form.name.trim() || t.name.toLowerCase().includes(form.name.toLowerCase()))
    .slice(0, 8);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Topics</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics or subjects…"
              className="pl-9 w-72"
            />
          </div>
          <AdminSortSelect
            variant="plain"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={SORT_OPTIONS}
          />
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Topic
          </Button>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-xl shadow-sm"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid hsl(var(--admin-border))",
        }}
      >
        <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="h-11 px-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Name</TableHead>
              <TableHead className="h-11 px-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Subject</TableHead>
              <TableHead className="h-11 px-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</TableHead>
              <TableHead className="h-11 px-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Posts</TableHead>
              <TableHead className="h-11 px-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Created</TableHead>
              <TableHead className="h-11 w-[180px] px-5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTopics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No topics found.</TableCell>
              </TableRow>
            ) : (
              sortedTopics.map((t) => (
                <TableRow key={t.id} className="bg-white transition-colors hover:bg-slate-50/80">
                  <TableCell className="px-5 py-4 text-sm font-semibold text-slate-900">{t.name}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-slate-700">{t.category_name}</TableCell>
                  <TableCell className="px-5 py-4 text-sm">
                    <Badge
                      variant={
                        t.status === "approved" ? "default" : t.status === "rejected" ? "destructive" : "secondary"
                      }
                    >
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm font-medium text-slate-900">{postCounts[t.id] || 0}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-slate-700">{format(parseISO(t.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      {t.status !== "approved" && (
                        <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 bg-white" title="Approve" onClick={() => handleSetStatus(t.id, "approved")}>
                          <Check className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      {t.status !== "rejected" && (
                        <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 bg-white" title="Reject" onClick={() => handleSetStatus(t.id, "rejected")}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 bg-white" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-slate-200 bg-white"
                        title={t.image_url ? "Replace image" : "Upload image"}
                        onClick={() => {
                          const inp = document.createElement("input");
                          inp.type = "file";
                          inp.accept = "image/jpeg,image/png,image/webp";
                          inp.onchange = () => {
                            const f = inp.files?.[0];
                            if (f) void handleReplaceImage(t, f);
                          };
                          inp.click();
                        }}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      {t.image_url && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-slate-200 bg-white"
                          title="Clear image"
                          onClick={() => void handleClearImage(t)}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8 border-red-100 bg-white text-destructive hover:bg-red-50 hover:text-destructive">
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
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Topic" : "New Topic"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="topic-category">Subject</Label>
              <Select
                value={form.category_name}
                onValueChange={(v) => setForm((p) => ({ ...p, category_name: v }))}
              >
                <SelectTrigger id="topic-category">
                  <SelectValue placeholder="Select a subject..." />
                </SelectTrigger>
                <SelectContent>
                  {subjectCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Topic Name with autocomplete from existing topics */}
            <div className="space-y-2 relative">
              <Label htmlFor="topic-name">Topic</Label>
              <Input
                id="topic-name"
                value={form.name}
                onChange={(e) => {
                  setForm((p) => ({ ...p, name: e.target.value }));
                  setShowNameSuggestions(true);
                }}
                onClick={() => setShowNameSuggestions(true)}
                onBlur={() => setTimeout(() => setShowNameSuggestions(false), 150)}
                placeholder="e.g. Machine Learning"
                autoComplete="off"
              />
              {showNameSuggestions && filteredTopicNames.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 max-h-56 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                  {filteredTopicNames.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setForm((p) => ({ ...p, name: t.name }));
                          setShowNameSuggestions(false);
                        }}
                      >
                        <span>{t.name}</span>
                        <span className="text-xs text-muted-foreground">{t.category_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
