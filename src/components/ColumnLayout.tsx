import { useState, useMemo } from "react";
import PostCard from "@/components/PostCard";
import PopularTopicSection from "@/components/PopularTopicSection";
import SubjectsSidebar from "@/components/SubjectsSidebar";
import { getRecentPosts, topics } from "@/data/seedData";

const recentFilters = [
  { label: "Today", hours: 24 },
  { label: "Yesterday", hours: 48 },
  { label: "2 days ago", hours: 72 },
  { label: "3 days ago", hours: 96 },
  { label: "Week ago", hours: 168 },
];

const ColumnLayout = () => {
  const [filterHours, setFilterHours] = useState(24);
  const recentPosts = getRecentPosts();
  const filteredPosts = useMemo(() => {
    const cutoff = new Date(Date.now() - filterHours * 3600000);
    return recentPosts.filter((p) => p.createdAt >= cutoff);
  }, [recentPosts, filterHours]);
  const popularTopics = topics.filter((t) =>
    ["Parent", "Waiter", "Chicago", "Cancer", "College", "Love", "Doctor", "1980s", "New York City", "iPhone", "Married", "20s", "McDonald's"].includes(t.name)
  );

  return (
    <div className="container mx-auto px-4 mt-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1.5fr_280px] gap-10">
        {/* Left — Recently Added */}
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

        {/* Middle — Most Popular */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Most Popular</h2>
            <select className="text-xs border rounded px-2 py-1 bg-background text-muted-foreground">
              <option>This Year</option>
              <option>All Time</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="space-y-4 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto scrollbar-thin lg:pr-2">
            {popularTopics.map((topic) => (
              <PopularTopicSection key={topic.id} topic={topic} />
            ))}
          </div>
        </div>

        {/* Right — Subjects */}
        <div className="hidden lg:block">
          <div className="lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto scrollbar-thin lg:pr-2">
            <SubjectsSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnLayout;
