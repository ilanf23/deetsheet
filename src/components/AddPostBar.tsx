import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import CreatePostDialog from "./CreatePostDialog";
import { addPost } from "@/data/seedData";

interface AddPostBarProps {
  topicName: string;
  categoryName: string;
  onPostAdded: () => void;
}

const AddPostBar = ({ topicName, categoryName, onPostAdded }: AddPostBarProps) => {
  const [open, setOpen] = useState(false);

  const handleSubmit = (detail: string, category: string) => {
    addPost(topicName, category, detail, "anonymous");
    onPostAdded();
    setOpen(false);
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
