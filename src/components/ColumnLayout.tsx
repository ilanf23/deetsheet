import PopularTopicSection from "@/components/PopularTopicSection";
import SubjectsSidebar from "@/components/SubjectsSidebar";
import RecentlyAddedSidebar from "@/components/RecentlyAddedSidebar";
import { topics } from "@/data/seedData";

const ColumnLayout = () => {
  const popularTopics = topics.filter((t) =>
    ["Parent", "Waiter", "Chicago", "Cancer", "College", "Love", "Doctor", "1980s", "New York City", "iPhone", "Married", "20s", "McDonald's"].includes(t.name)
  );

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
            {popularTopics.map((topic) => (
              <PopularTopicSection key={topic.id} topic={topic} />
            ))}
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
