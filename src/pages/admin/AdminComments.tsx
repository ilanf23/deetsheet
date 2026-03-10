import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Comment {
  id: string;
  content: string;
  author_id: string;
  post_id: string;
  created_at: string;
  posts: { title: string } | null;
}

export default function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .select("*, posts(title)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading comments", description: error.message, variant: "destructive" });
    } else {
      setComments((data as Comment[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, []);

  const handleDelete = async (comment: Comment) => {
    const { error } = await supabase.from("comments").delete().eq("id", comment.id);
    if (error) {
      toast({ title: "Error deleting comment", description: error.message, variant: "destructive" });
      return;
    }

    // Decrement post's comment_count
    const { data: post } = await supabase.from("posts").select("comment_count").eq("id", comment.post_id).single();
    if (post) {
      await supabase.from("posts").update({ comment_count: Math.max(0, post.comment_count - 1) }).eq("id", comment.post_id);
    }

    toast({ title: "Comment deleted" });
    fetchComments();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Comments</h1>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>Post</TableHead>
              <TableHead>Author ID</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No comments found.</TableCell>
              </TableRow>
            ) : (
              comments.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-sm max-w-[300px] truncate">{c.content}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{c.posts?.title || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{c.author_id.slice(0, 8)}...</TableCell>
                  <TableCell className="text-sm">{format(parseISO(c.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete this comment.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(c)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
