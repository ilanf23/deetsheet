import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Clock, Hash, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { slugifyPostTitle } from "@/lib/postSlug";

type SuggestionType = "topic" | "post";

type Suggestion = {
  id: string;
  type: SuggestionType;
  label: string;
  sublabel?: string;
  href: string;
};

type RecentEntry = Suggestion & { savedAt: number };

const RECENT_KEY = "deetsheet:recent-searches";
const RECENT_LIMIT = 6;

function loadRecent(): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r) => r && typeof r.href === "string").slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

function saveRecent(entry: Suggestion) {
  if (typeof window === "undefined") return;
  const existing = loadRecent().filter((r) => r.href !== entry.href);
  const next: RecentEntry[] = [{ ...entry, savedAt: Date.now() }, ...existing].slice(0, RECENT_LIMIT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

type Props = {
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  onNavigated?: () => void;
};

const SearchBar = ({ placeholder = "Search topics or posts...", autoFocus, className, onNavigated }: Props) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<RecentEntry[]>(() => loadRecent());
  const [topics, setTopics] = useState<Suggestion[]>([]);
  const [posts, setPosts] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 180);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const term = debounced;
    if (!term) {
      setTopics([]);
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const escaped = term.replace(/[%_]/g, (m) => `\\${m}`);
    const pattern = `%${escaped}%`;
    (async () => {
      const [topicRes, postRes] = await Promise.all([
        supabase
          .from("topics")
          .select("id, name, category_name")
          .ilike("name", pattern)
          .order("post_count", { ascending: false })
          .limit(5),
        supabase
          .from("posts")
          .select("id, title, topics!inner(name)")
          .ilike("title", pattern)
          .order("score", { ascending: false })
          .limit(5),
      ]);
      if (cancelled) return;
      const topicSugs: Suggestion[] = (topicRes.data ?? []).map((t) => ({
        id: t.id,
        type: "topic",
        label: t.name,
        sublabel: t.category_name,
        href: `/topic/${encodeURIComponent(t.name)}`,
      }));
      type PostRow = { id: string; title: string; topics: { name: string } | { name: string }[] | null };
      const postSugs: Suggestion[] = ((postRes.data ?? []) as PostRow[]).map((p) => {
        const topicRel = Array.isArray(p.topics) ? p.topics[0] : p.topics;
        const topicName: string = topicRel?.name ?? "";
        const slug = slugifyPostTitle(p.title) || p.id;
        return {
          id: p.id,
          type: "post",
          label: p.title,
          sublabel: topicName ? `in ${topicName}` : undefined,
          href: `/topic/${encodeURIComponent(topicName)}/post/${slug}`,
        };
      });
      setTopics(topicSugs);
      setPosts(postSugs);
      setLoading(false);
      setActiveIndex(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const liveSuggestions = useMemo(() => [...topics, ...posts], [topics, posts]);
  const showingRecents = open && query.trim() === "" && recent.length > 0;
  const showingLive = open && query.trim() !== "";
  const flatList: Suggestion[] = showingRecents ? recent : showingLive ? liveSuggestions : [];

  const select = (s: Suggestion) => {
    saveRecent(s);
    setRecent(loadRecent());
    setOpen(false);
    setQuery("");
    navigate(s.href);
    onNavigated?.();
  };

  const removeRecent = (e: React.MouseEvent, href: string) => {
    e.stopPropagation();
    const next = recent.filter((r) => r.href !== href);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const clearAllRecent = () => {
    setRecent([]);
    localStorage.removeItem(RECENT_KEY);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (flatList[activeIndex]) {
        e.preventDefault();
        select(flatList[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className ?? ""}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        className="pl-10 bg-muted border-0 focus-visible:ring-primary"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {open && (showingRecents || showingLive) && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-md border bg-popover shadow-md overflow-hidden">
          {showingRecents && (
            <div>
              <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
                <span>Recent</span>
                <button
                  type="button"
                  onClick={clearAllRecent}
                  className="text-primary hover:underline"
                >
                  Clear all
                </button>
              </div>
              <ul className="max-h-80 overflow-y-auto py-1">
                {recent.map((r, idx) => (
                  <li key={r.href}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => select(r)}
                      className={`group flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
                        idx === activeIndex ? "bg-accent" : "hover:bg-accent"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-primary">{r.label}</div>
                        {r.sublabel && (
                          <div className="truncate text-xs text-muted-foreground">{r.sublabel}</div>
                        )}
                      </div>
                      <span
                        role="button"
                        tabIndex={-1}
                        onClick={(e) => removeRecent(e, r.href)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                        aria-label="Remove from recent"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showingLive && (
            <div>
              {loading && liveSuggestions.length === 0 && (
                <div className="px-3 py-4 text-sm text-muted-foreground">Searching…</div>
              )}
              {!loading && liveSuggestions.length === 0 && (
                <div className="px-3 py-4 text-sm text-muted-foreground">No matches for “{query}”</div>
              )}
              {topics.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs text-muted-foreground">Topics</div>
                  <ul className="py-1">
                    {topics.map((t, idx) => {
                      const flatIdx = idx;
                      return (
                        <li key={t.href}>
                          <button
                            type="button"
                            onMouseEnter={() => setActiveIndex(flatIdx)}
                            onClick={() => select(t)}
                            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
                              flatIdx === activeIndex ? "bg-accent" : "hover:bg-accent"
                            }`}
                          >
                            <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-primary">{t.label}</div>
                              {t.sublabel && (
                                <div className="truncate text-xs text-muted-foreground">{t.sublabel}</div>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {posts.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs text-muted-foreground border-t">Posts</div>
                  <ul className="py-1">
                    {posts.map((p, idx) => {
                      const flatIdx = topics.length + idx;
                      return (
                        <li key={p.href}>
                          <button
                            type="button"
                            onMouseEnter={() => setActiveIndex(flatIdx)}
                            onClick={() => select(p)}
                            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
                              flatIdx === activeIndex ? "bg-accent" : "hover:bg-accent"
                            }`}
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-primary">{p.label}</div>
                              {p.sublabel && (
                                <div className="truncate text-xs text-muted-foreground">{p.sublabel}</div>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
