import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import CreatePostDialog from "./CreatePostDialog";
import { useCreatePost } from "@/hooks/useCreatePost";
import { useToast } from "@/hooks/use-toast";
import type { Post } from "@/data/seedData";

interface AddPostBarProps {
  topicId: string;
  topicName: string;
  categoryName: string;
  existingPosts?: Post[];
  onPostAdded: () => void;
}

const AddPostBar = ({ topicId, topicName, categoryName, existingPosts, onPostAdded }: AddPostBarProps) => {
  const [open, setOpen] = useState(false);
  const createPost = useCreatePost();
  const { toast } = useToast();

  const handleSubmit = async (detail: string, story: string, image: File | null, isAnonymous: boolean) => {
    try {
      await createPost.mutateAsync({
        topicId,
        topicName,
        title: detail,
        content: detail,
        story: story || null,
        image,
        isAnonymous,
      });
      toast({
        title: "Pending admin approval",
        description:
          "Your post is not visible to others yet. It will appear in this topic once an admin approves it.",
      });
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
        <button
          type="button"
          className="w-full flex items-center gap-3 px-4 py-3 border rounded-xl bg-background hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-secondary-foreground shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-primary">
            Add your own advice or perspective!
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        <CreatePostDialog
          topicName={topicName}
          categoryName={categoryName}
          existingPosts={existingPosts}
          onSubmit={handleSubmit}
          onDismiss={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddPostBar;
