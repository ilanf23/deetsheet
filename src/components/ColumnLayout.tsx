import PopularTopicSection from "@/components/PopularTopicSection";
import SubjectsSidebar from "@/components/SubjectsSidebar";
import RecentlyAddedSidebar from "@/components/RecentlyAddedSidebar";
import { topics } from "@/data/seedData";

const ColumnLayout = () => {
  const popularTopics = topics.filter((t) =>
    ["Parent", "Waiter", "Chicago", "Cancer", "College", "Love", "Doctor", "1980s", "New York City", "iPhone", "Married", "20s", "McDonald's"].includes(t.name)
  );

  return (
    <div className="max-w-[1600px] mx-auto mt-5 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1.5fr_280px] gap-5">
        {/* Left — Recently Added */}
        <RecentlyAddedSidebar />

        {/* Middle — Most Popular */}
        <div className="min-w-0">
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
