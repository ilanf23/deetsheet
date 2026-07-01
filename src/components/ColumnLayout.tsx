import { useEffect, useMemo, useRef, useState } from "react";
import PopularTopicSection from "@/components/PopularTopicSection";
import SubjectsSidebar from "@/components/SubjectsSidebar";
import RecentlyAddedSidebar from "@/components/RecentlyAddedSidebar";
import type { Topic } from "@/data/seedData";
import { useTopics } from "@/hooks/useSupabaseTopics";
import { useInfiniteList } from "@/hooks/useInfiniteList";

type MobileTab = "popular" | "recent" | "subjects";

// Curated priority order shown first on the homepage Most Popular column.
// Remaining topics auto-fill below, sorted by post count (desc) so the
// infinite scroll has a deterministic, traffic-driven order.
const PRIORITY_TOPICS = [
  "Parent", "Waiter", "Chicago", "Cancer", "College", "Love", "Doctor",
  "1980s", "New York City", "Married", "Wisconsin", "Poor", "Pet Peeves",
  "Man", "Working From Home", "Teacher", "Old", "Pregnant",
  "University of Wisconsin", "Gentleman", "Los Angeles", "Nurse",
  "Homeowner", "Baby", "Illinois", "Real Estate Agent",
];

interface ColumnLayoutProps {
  onAtBottomChange?: (atBottom: boolean) => void;
}

const ColumnLayout = ({ onAtBottomChange }: ColumnLayoutProps) => {
  // Pull live topics from the DB so the priority list isn't silently
  // truncated by missing seed-data entries.
  const { data: dbTopics } = useTopics();

  const popularTopics = useMemo<Topic[]>(() => {
    const all = dbTopics ?? [];
    const byNameLower = new Map(all.map((t) => [t.name.toLowerCase(), t]));
    const priority = PRIORITY_TOPICS
      .map((name) => byNameLower.get(name.toLowerCase()))
      .filter((t): t is NonNullable<typeof t> => Boolean(t));
    const priorityIds = new Set(priority.map((t) => t.id));
    const rest = all
      .filter((t) => !priorityIds.has(t.id))
      .sort((a, b) => b.postCount - a.postCount);

    if (typeof window !== "undefined" && all.length > 0) {
      const missing = PRIORITY_TOPICS.filter((n) => !byNameLower.has(n.toLowerCase()));
      if (missing.length > 0) {
        // eslint-disable-next-line no-console
        console.warn("[ColumnLayout] Priority topics missing from DB:", missing);
      }
    }

    return [...priority, ...rest].map((t) => ({
      id: t.id,
      name: t.name,
      categoryName: t.categoryName,
      postCount: t.postCount,
      topPosts: [],
      imageUrl: t.imageUrl ?? "",
    }));
  }, [dbTopics]);
  // Each column scrolls independently on lg+, so the IntersectionObserver
  // must observe the middle column itself rather than the viewport.
  const middleRef = useRef<HTMLDivElement | null>(null);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const { visible, sentinelRef, hasMore } = useInfiniteList(popularTopics, 4, 4, "0px", middleRef);

  useEffect(() => {
    if (!onAtBottomChange) return;
    const epsilon = 4;

    const check = () => {
      const cols = [leftRef.current, middleRef.current, rightRef.current];
      const columnAtBottom = cols.some(
        (c) =>
          c &&
          c.scrollHeight > c.clientHeight &&
          c.scrollTop + c.clientHeight >= c.scrollHeight - epsilon
      );
      const docHeight = document.documentElement.scrollHeight;
      const windowScrollable = docHeight > window.innerHeight + epsilon;
      const windowAtBottom =
        windowScrollable &&
        window.innerHeight + window.scrollY >= docHeight - epsilon;
      onAtBottomChange(columnAtBottom || windowAtBottom);
    };

    const cols = [leftRef.current, middleRef.current, rightRef.current];
    cols.forEach((c) => c?.addEventListener("scroll", check, { passive: true }));
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    check();

    return () => {
      cols.forEach((c) => c?.removeEventListener("scroll", check));
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [onAtBottomChange, visible.length]);

  const [mobileTab, setMobileTab] = useState<MobileTab>("recent");

  const tabs: { id: MobileTab; label: string }[] = [
    { id: "recent", label: "Recently Added" },
    { id: "popular", label: "Most Popular" },
    { id: "subjects", label: "Subjects/Topics" },
  ];

  return (
    <div className="flex-1 lg:min-h-0 mx-auto w-full px-4 lg:px-10 mt-3 lg:mt-5">
      {/* Mobile tab switcher */}
      <div className="lg:hidden mb-4 flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMobileTab(t.id)}
            className={`flex-1 px-2 py-2 text-xs font-semibold rounded-md transition-colors ${
              mobileTab === t.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_240px] gap-5 lg:h-full">
        {/* Left — Recently Added */}
        <div
          ref={leftRef}
          className={`${mobileTab === "recent" ? "block" : "hidden"} lg:block lg:h-full lg:overflow-y-auto lg:pr-2 lg:pb-24`}
        >
          <RecentlyAddedSidebar scrollRootRef={leftRef} />
        </div>

        {/* Middle — Most Popular */}
        <div
          ref={middleRef}
          className={`${mobileTab === "popular" ? "block" : "hidden"} lg:block min-w-0 pt-4 lg:h-full lg:overflow-y-auto lg:pr-2`}
        >
          <div className="flex items-center justify-between h-8 mb-4 px-1 pb-2 border-b border-border">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Most Popular</h2>
            <select className="text-xs border border-foreground/40 rounded px-2 py-1 bg-background text-muted-foreground">
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
        <div
          ref={rightRef}
          className={`${mobileTab === "subjects" ? "block" : "hidden"} lg:block lg:h-full lg:overflow-y-auto lg:pr-2`}
        >
          <SubjectsSidebar />
        </div>
      </div>
    </div>
  );
};

export default ColumnLayout;
