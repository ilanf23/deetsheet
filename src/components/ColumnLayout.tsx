import PopularTopicSection from "@/components/PopularTopicSection";
import SubjectsSidebar from "@/components/SubjectsSidebar";
import RecentlyAddedSidebar from "@/components/RecentlyAddedSidebar";
import { topics } from "@/data/seedData";
import { useInfiniteList } from "@/hooks/useInfiniteList";

const PRIORITY_TOPICS = ["Parent", "Waiter", "Chicago", "Cancer", "College", "Love", "Doctor", "1980s", "New York City", "iPhone", "Married", "20s", "McDonald's"];

const ColumnLayout = () => {
  // Show priority topics first, then progressively reveal the rest of the
  // catalog so the middle column scrolls "endlessly" Reddit-style.
  const priority = PRIORITY_TOPICS
    .map((name) => topics.find((t) => t.name === name))
    .filter((t): t is typeof topics[number] => Boolean(t));
  const rest = topics.filter((t) => !PRIORITY_TOPICS.includes(t.name));
  const popularTopics = [...priority, ...rest];
  const { visible, sentinelRef, hasMore } = useInfiniteList(popularTopics, 6, 6);

  return (
    <div className="mx-auto mt-5 px-6 lg:px-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[300px_1fr_240px] gap-5">
        {/* Left — Recently Added */}
        <RecentlyAddedSidebar />

        {/* Middle — Most Popular */}
        <div className="min-w-0 pt-4">
          <div className="flex items-center justify-between h-8 mb-4 px-1 pb-2 border-b border-border">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Most Popular</h2>
            <select className="text-xs border rounded px-2 py-1 bg-background text-muted-foreground">
              <option>This Year</option>
              <option>All Time</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="space-y-4">
            {visible.map((topic) => (
              <PopularTopicSection key={topic.id} topic={topic} />
            ))}
            {hasMore && (
              <div ref={sentinelRef} className="h-10 flex items-center justify-center text-xs text-muted-foreground">
                Loading more topics…
              </div>
            )}
          </div>
        </div>

        {/* Right — Subjects */}
        <div className="hidden lg:block lg:border-l lg:border-border lg:pl-5 pt-4">
          <SubjectsSidebar />
        </div>
      </div>
    </div>
  );
};

export default ColumnLayout;
