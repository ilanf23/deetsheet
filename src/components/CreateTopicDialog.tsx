import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { subjectCategories } from "@/data/seedData";

interface CreateTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTopicCreated?: () => void;
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function CreateTopicDialog({ open, onOpenChange, onTopicCreated }: CreateTopicDialogProps) {
  const [name, setName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const resetForm = () => {
    setName("");
    setCategoryName("");
    setDescription("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: "Topic name is required", variant: "destructive" });
      return;
    }
    if (!categoryName) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Please provide a description", variant: "destructive" });
      return;
    }
    if (!user) return;

    setSubmitting(true);
    const slug = generateSlug(name.trim());

    const { error } = await supabase.from("topics").insert({
      name: name.trim(),
      slug,
      category_name: categoryName,
      description: description.trim(),
      created_by: user.id,
    });

    if (error) {
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        toast({ title: "A topic with this name already exists", variant: "destructive" });
      } else {
        toast({ title: "Error creating topic", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Topic created successfully!" });
      resetForm();
      onOpenChange(false);
      onTopicCreated?.();
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Topic</DialogTitle>
        </DialogHeader>
        {!user ? (
          <p className="text-sm text-muted-foreground py-4">
            You need to be logged in to create a topic. Please{" "}
            <a href="/login" className="text-primary underline">log in</a> first.
          </p>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="create-topic-name">Topic Name *</Label>
                <Input
                  id="create-topic-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Remote Work"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-topic-category">Category *</Label>
                <Select value={categoryName} onValueChange={setCategoryName}>
                  <SelectTrigger id="create-topic-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-topic-desc">Description *</Label>
                <Textarea
                  id="create-topic-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this topic about?"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Creating..." : "Create Topic"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
