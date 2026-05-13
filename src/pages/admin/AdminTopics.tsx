import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { subjectCategories } from "@/data/seedData";
import AdminSortSelect from "@/components/admin/AdminSortSelect";

interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_name: string;
  created_at: string;
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
  const [categoryQuery, setCategoryQuery] = useState("");
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sort, setSort] = useState<SortKey>("name_asc");
  const { toast } = useToast();

  const sortedTopics = useMemo(() => {
    const cmpStr = (a: string, b: string) =>
      a.localeCompare(b, undefined, { sensitivity: "base" });
    const cmpDate = (a?: string | null, b?: string | null) =>
      new Date(a ?? 0).getTime() - new Date(b ?? 0).getTime();
    const arr = [...topics];
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
  }, [topics, postCounts, sort]);

  const fetchTopics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("topics")
      .select("id, name, slug, description, category_name, created_at")
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
    setCategoryQuery("");
    setDialogOpen(true);
  };

  const openEdit = (topic: Topic) => {
    setEditing(topic);
    setForm({ name: topic.name, category_name: topic.category_name || "" });
    setCategoryQuery(topic.category_name || "");
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

    setSaving(true);
    const slug = editing ? generateSlug(form.name) : generateSlug(form.name);

    if (editing) {
      const { error } = await supabase
        .from("topics")
        .update({ name: form.name, slug, category_name: form.category_name })
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
        .insert({ name: form.name, slug, category_name: form.category_name, description: null });

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

  const filteredCategories = subjectCategories.filter((c) =>
    c.toLowerCase().includes(categoryQuery.toLowerCase())
  );

  const filteredTopicNames = form.name.trim().length > 0
    ? topics
        .filter((t) => t.id !== editing?.id && t.name.toLowerCase().includes(form.name.toLowerCase()))
        .slice(0, 8)
    : [];

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Topics</h1>
        <div className="flex items-center gap-3">
          <AdminSortSelect
            variant="plain"
            value={sort}
            onChange={setSort}
            options={SORT_OPTIONS}
          />
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Topic
          </Button>
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTopics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No topics found.</TableCell>
              </TableRow>
            ) : (
              sortedTopics.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-sm">{t.name}</TableCell>
                  <TableCell className="text-sm">{t.category_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.slug}</TableCell>
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
            {/* Subject (Category) with autocomplete */}
            <div className="space-y-2 relative">
              <Label htmlFor="topic-category">Subject</Label>
              <Input
                id="topic-category"
                value={categoryQuery}
                onChange={(e) => {
                  setCategoryQuery(e.target.value);
                  setForm((p) => ({ ...p, category_name: e.target.value }));
                  setShowCategorySuggestions(true);
                }}
                onClick={() => setShowCategorySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 150)}
                placeholder="Select or type a subject..."
                autoComplete="off"
              />
              {showCategorySuggestions && filteredCategories.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 max-h-56 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                  {filteredCategories.map((c) => (
                    <li key={c}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setCategoryQuery(c);
                          setForm((p) => ({ ...p, category_name: c }));
                          setShowCategorySuggestions(false);
                        }}
                      >
                        {c}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Topic Name with autocomplete from existing topics */}
            <div className="space-y-2 relative">
              <Label htmlFor="topic-name">Name</Label>
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
