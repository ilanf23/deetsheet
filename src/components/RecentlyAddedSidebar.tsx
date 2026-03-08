import { useState, useMemo } from "react";
import PostCard from "@/components/PostCard";
import { getRecentPosts } from "@/data/seedData";

const recentFilters = [
  { label: "Today", hours: 24 },
  { label: "Yesterday", hours: 48 },
  { label: "2 days ago", hours: 72 },
  { label: "3 days ago", hours: 96 },
  { label: "Week ago", hours: 168 },
];

const RecentlyAddedSidebar = () => {
  const [filterHours, setFilterHours] = useState(24);
  const recentPosts = getRecentPosts();
  const filteredPosts = useMemo(() => {
    const cutoff = new Date(Date.now() - filterHours * 3600000);
    return recentPosts.filter((p) => p.createdAt >= cutoff);
  }, [recentPosts, filterHours]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recently Added</h2>
        <select
          className="text-xs border rounded px-2 py-1 bg-background text-muted-foreground"
          value={filterHours}
          onChange={(e) => setFilterHours(Number(e.target.value))}
        >
          {recentFilters.map((f) => (
            <option key={f.hours} value={f.hours}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-3 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto scrollbar-thin lg:pr-2">
        {filteredPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default RecentlyAddedSidebar;
