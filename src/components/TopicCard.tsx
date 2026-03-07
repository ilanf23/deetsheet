import { ChevronRight } from "lucide-react";
import { Topic } from "@/data/seedData";

interface TopicCardProps {
  topic: Topic;
}

const TopicCard = ({ topic }: TopicCardProps) => {
  return (
    <div className="group rounded-xl border bg-card p-4 hover:shadow-md transition-all duration-200 cursor-pointer animate-slide-in">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-card-foreground font-heading">{topic.name}</h3>
          <span className="text-xs text-muted-foreground">{topic.postCount} details · {topic.categoryName}</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
      </div>
      <ul className="space-y-1.5">
        {topic.topPosts.slice(0, 3).map((post, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="text-xs font-semibold text-primary mt-0.5">{i + 1}.</span>
            <span className="leading-snug">{post}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopicCard;
