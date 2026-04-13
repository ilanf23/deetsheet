import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import CreatePostDialog from "./CreatePostDialog";
import { useCreatePost } from "@/hooks/useCreatePost";
import { useToast } from "@/hooks/use-toast";

interface AddPostBarProps {
  topicId: string;
  topicName: string;
  categoryName: string;
  onPostAdded: () => void;
}

const AddPostBar = ({ topicId, topicName, categoryName, onPostAdded }: AddPostBarProps) => {
  const [open, setOpen] = useState(false);
  const createPost = useCreatePost();
  const { toast } = useToast();

  const handleSubmit = async (detail: string, _category: string) => {
    try {
      await createPost.mutateAsync({
        topicId,
        topicName,
        title: detail,
        content: detail,
      });
      toast({ title: "Post created!", description: "Your post is now live." });
      onPostAdded();
      setOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create post";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center gap-3 px-4 py-3 border rounded-xl bg-card hover:bg-muted/50 transition-colors cursor-pointer mt-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-sm text-muted-foreground">Add your own advice or perspective!</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        <CreatePostDialog
          topicName={topicName}
          categoryName={categoryName}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddPostBar;
