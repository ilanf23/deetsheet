import { Badge } from "@/components/ui/badge";

export default function PostVisibilityBadge({ isAnonymous }: { isAnonymous: boolean }) {
  return (
    <Badge variant="outline" className="shrink-0 text-foreground font-normal">
      {isAnonymous ? "Anonymous" : "Public"}
    </Badge>
  );
}