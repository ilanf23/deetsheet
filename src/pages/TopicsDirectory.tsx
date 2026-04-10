import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { Separator } from "@/components/ui/separator";
import { categories, categoryRows } from "@/data/seedData";
import { useTopics, type TopicRow } from "@/hooks/useSupabaseTopics";

type SortMode = "alphabetical" | "popular";

const TopicsDirectory = () => {
  const navigate = useNavigate();
  const [sortMode, setSortMode] = useState<SortMode>("alphabetical");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const MAX_VISIBLE = 10;

  const { data: topics, isLoading } = useTopics();

  const toggleExpanded = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) next.delete(categoryName);
      else next.add(categoryName);
      return next;
    });
  };

  const topicsByCategory = useMemo(() => {
    const map = new Map<string, TopicRow[]>();
    const all = topics ?? [];
    for (const cat of categories) {
      const catTopics = all.filter((t) => t.categoryName === cat.name);
      if (sortMode === "alphabetical") {
        catTopics.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        catTopics.sort((a, b) => b.postCount - a.postCount);
      }
      map.set(cat.name, catTopics);
    }
    return map;
  }, [sortMode, topics]);

  const sortedRows = useMemo(() => {
    if (sortMode === "alphabetical") {
      return categoryRows;
    }
    // For popular mode, flatten, sort by total posts, then re-chunk into rows of 7
    const allCatNames = categoryRows.flat();
    const sorted = [...allCatNames].sort((a, b) => {
      const aTotal = (topicsByCategory.get(a) || []).reduce((sum, t) => sum + t.postCount, 0);
      const bTotal = (topicsByCategory.get(b) || []).reduce((sum, t) => sum + t.postCount, 0);
      return bTotal - aTotal;
    });
    const rows: string[][] = [];
    for (let i = 0; i < sorted.length; i += 7) {
      rows.push(sorted.slice(i, i + 7));
    }
    return rows;
  }, [sortMode, topicsByCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 mt-8 mb-20">
          {/* Toggle bar */}
          <div className="flex items-center gap-2 mb-8">
            <span className="text-sm font-medium text-muted-foreground mr-1">List:</span>
            <button
              onClick={() => setSortMode("alphabetical")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                sortMode === "alphabetical"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Alphabetical
            </button>
            <button
              onClick={() => setSortMode("popular")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                sortMode === "popular"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Most Popular
            </button>
          </div>

          {isLoading && (
            <p className="text-sm text-muted-foreground mb-6">Loading topics…</p>
          )}

          {/* Category grid grouped by rows */}
          {sortedRows.map((row, rowIdx) => (
            <div key={rowIdx}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-x-8 gap-y-8">
                {row.map((catName) => {
                  const catTopics = topicsByCategory.get(catName) || [];
                  const isExpanded = expandedCategories.has(catName);
                  const visible = isExpanded ? catTopics : catTopics.slice(0, MAX_VISIBLE);
                  const hasMore = catTopics.length > MAX_VISIBLE;

                  return (
                    <div key={catName}>
                      <h3 className="font-bold text-sm mb-2 text-foreground">{catName}</h3>
                      <ul className="space-y-1">
                        {visible.map((topic) => (
                          <li key={topic.id}>
                            <button
                              onClick={() => navigate(`/topic/${encodeURIComponent(topic.name)}`)}
                              className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors text-left"
                            >
                              {topic.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                      {hasMore && (
                        <button
                          onClick={() => toggleExpanded(catName)}
                          className="text-xs text-primary hover:underline mt-1"
                        >
                          {isExpanded ? "less..." : "more..."}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {rowIdx < sortedRows.length - 1 && <Separator className="my-8" />}
            </div>
          ))}
        </div>
      </main>
      <DeetFooter />
    </div>
  );
};

export default TopicsDirectory;
