import { useEffect, useRef, useState } from "react";
import PopularTopicSection from "@/components/PopularTopicSection";
import SubjectsSidebar from "@/components/SubjectsSidebar";
import RecentlyAddedSidebar from "@/components/RecentlyAddedSidebar";
import { topics } from "@/data/seedData";
import { useInfiniteList } from "@/hooks/useInfiniteList";

type MobileTab = "popular" | "recent" | "subjects";

const PRIORITY_TOPICS = ["Parent", "Waiter", "Chicago", "Cancer", "College", "Love", "Doctor", "1980s", "New York City", "iPhone", "Married", "20s", "McDonald's"];

interface ColumnLayoutProps {
  onAtBottomChange?: (atBottom: boolean) => void;
}

const ColumnLayout = ({ onAtBottomChange }: ColumnLayoutProps) => {
  // Show priority topics first, then progressively reveal the rest of the
  // catalog so the middle column scrolls "endlessly" Reddit-style.
  const priority = PRIORITY_TOPICS
    .map((name) => topics.find((t) => t.name === name))
    .filter((t): t is typeof topics[number] => Boolean(t));
  const rest = topics.filter((t) => !PRIORITY_TOPICS.includes(t.name));
  const popularTopics = [...priority, ...rest];
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

  return (
    <div className="flex-1 lg:min-h-0 mx-auto w-full px-6 lg:px-10 mt-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[300px_1fr_240px] gap-5 lg:h-full">
        {/* Left — Recently Added */}
        <div ref={leftRef} className="lg:h-full lg:overflow-y-auto lg:pr-2">
          <RecentlyAddedSidebar />
        </div>

        {/* Middle — Most Popular */}
        <div ref={middleRef} className="min-w-0 pt-4 lg:h-full lg:overflow-y-auto lg:pr-2">
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
        <div ref={rightRef} className="hidden lg:block pt-4 lg:h-full lg:overflow-y-auto lg:pr-2">
          <SubjectsSidebar />
        </div>
      </div>
    </div>
  );
};

export default ColumnLayout;
