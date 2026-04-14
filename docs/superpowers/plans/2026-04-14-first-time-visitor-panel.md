# First-Time Visitor Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hero-slot onboarding panel for unauthenticated first-time visitors that captures a topic + location selection, persists to localStorage, and personalizes the homepage columns.

**Architecture:** Replace `HeroBanner` with a new `FirstTimePanel` when the visitor is unauthenticated and has no stored onboarding record. On selection, store `{ topicId, locationId }` in localStorage, swap back to `HeroBanner`, render a slim `PersonalizedStrip` above `ColumnLayout`, and filter `ColumnLayout`'s two data columns by the selected chips. On "Skip for now", store `{ dismissed: true }` and never show the panel again. All chip options come from a new constants file; no Supabase changes.

**Tech Stack:** React 18 + TypeScript, Vite, Tailwind, Vitest + React Testing Library, localStorage.

**Spec:** `docs/superpowers/specs/2026-04-14-first-time-visitor-panel-design.md`

---

## File Structure

**Create:**
- `src/lib/onboardingChips.ts` — chip constants (`TOPIC_CHIPS`, `LOCATION_CHIPS`) and filter helpers
- `src/lib/__tests__/onboardingChips.test.ts` — unit tests for filter helpers
- `src/hooks/useOnboarding.ts` — localStorage hook with `{ state, isFirstTime, select, skip, reset }`
- `src/hooks/__tests__/useOnboarding.test.tsx` — hook tests with mocked `useAuth`
- `src/components/FirstTimePanel.tsx` — hero-slot panel with chips
- `src/components/__tests__/FirstTimePanel.test.tsx` — component tests
- `src/components/PersonalizedStrip.tsx` — slim strip above `ColumnLayout`
- `src/components/__tests__/PersonalizedStrip.test.tsx` — component tests

**Modify:**
- `src/components/ColumnLayout.tsx` — accept `topicId`/`locationId` props, filter Most Popular and propagate to `RecentlyAddedSidebar`
- `src/components/RecentlyAddedSidebar.tsx` — accept optional `locationId` prop, filter recent posts
- `src/pages/Index.tsx` — conditionally render `FirstTimePanel` vs `HeroBanner`, render `PersonalizedStrip`, pass selections to `ColumnLayout`

---

## Task 1: Chip constants + filter helpers

**Files:**
- Create: `src/lib/onboardingChips.ts`
- Test: `src/lib/__tests__/onboardingChips.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/onboardingChips.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  TOPIC_CHIPS,
  LOCATION_CHIPS,
  findTopicChip,
  findLocationChip,
  topicMatchesChip,
  postMatchesLocationChip,
} from "@/lib/onboardingChips";
import type { Topic, Post } from "@/data/seedData";

describe("onboardingChips", () => {
  it("exposes at least 5 topic chips and 10 location chips", () => {
    expect(TOPIC_CHIPS.length).toBeGreaterThanOrEqual(5);
    expect(LOCATION_CHIPS.length).toBeGreaterThanOrEqual(10);
  });

  it("every chip has a unique id", () => {
    const topicIds = new Set(TOPIC_CHIPS.map((c) => c.id));
    const locationIds = new Set(LOCATION_CHIPS.map((c) => c.id));
    expect(topicIds.size).toBe(TOPIC_CHIPS.length);
    expect(locationIds.size).toBe(LOCATION_CHIPS.length);
  });

  it("findTopicChip returns the chip by id or undefined", () => {
    const first = TOPIC_CHIPS[0];
    expect(findTopicChip(first.id)).toEqual(first);
    expect(findTopicChip("bogus")).toBeUndefined();
    expect(findTopicChip(undefined)).toBeUndefined();
  });

  it("findLocationChip returns the chip by id or undefined", () => {
    const first = LOCATION_CHIPS[0];
    expect(findLocationChip(first.id)).toEqual(first);
    expect(findLocationChip("bogus")).toBeUndefined();
    expect(findLocationChip(undefined)).toBeUndefined();
  });

  it("topicMatchesChip returns true when topic name matches a keyword (case-insensitive)", () => {
    const chip = { id: "food", label: "Food & Drink", matchKeywords: ["Waiter", "McDonald's"] };
    const topic = { id: "1", name: "waiter", categoryName: "Jobs", postCount: 1, topPosts: [] } as Topic;
    expect(topicMatchesChip(topic, chip)).toBe(true);
  });

  it("topicMatchesChip returns true when topic categoryName matches", () => {
    const chip = { id: "hobbies", label: "Hobbies", matchKeywords: ["Hobbies"] };
    const topic = { id: "1", name: "Pickleball", categoryName: "Hobbies", postCount: 1, topPosts: [] } as Topic;
    expect(topicMatchesChip(topic, chip)).toBe(true);
  });

  it("topicMatchesChip returns false when nothing matches", () => {
    const chip = { id: "food", label: "Food", matchKeywords: ["Waiter"] };
    const topic = { id: "1", name: "Chicago", categoryName: "Cities", postCount: 1, topPosts: [] } as Topic;
    expect(topicMatchesChip(topic, chip)).toBe(false);
  });

  it("topicMatchesChip returns true for the 'other' chip with empty keywords (match everything)", () => {
    const chip = { id: "other", label: "Other", matchKeywords: [] };
    const topic = { id: "1", name: "Anything", categoryName: "Life", postCount: 1, topPosts: [] } as Topic;
    expect(topicMatchesChip(topic, chip)).toBe(true);
  });

  it("postMatchesLocationChip checks substring in topicName, title, and content", () => {
    const chip = { id: "chicago", label: "Chicago", matchKeywords: ["Chicago"] };
    const base = { id: "p", username: "u", ratingScore: 0, ratingCount: 0, commentCount: 0, createdAt: new Date() };
    const byTopic = { ...base, topicName: "Chicago", categoryName: "Cities", content: "" } as Post;
    const byContent = { ...base, topicName: "Love", categoryName: "Life", content: "Met in Chicago" } as Post;
    const byTitle = { ...base, topicName: "Love", categoryName: "Life", content: "", title: "Chicago vibes" } as Post;
    const nope = { ...base, topicName: "Love", categoryName: "Life", content: "New York story" } as Post;
    expect(postMatchesLocationChip(byTopic, chip)).toBe(true);
    expect(postMatchesLocationChip(byContent, chip)).toBe(true);
    expect(postMatchesLocationChip(byTitle, chip)).toBe(true);
    expect(postMatchesLocationChip(nope, chip)).toBe(false);
  });

  it("postMatchesLocationChip returns true for a chip with empty keywords", () => {
    const chip = { id: "other", label: "Somewhere else", matchKeywords: [] };
    const post = { id: "p", topicName: "Love", categoryName: "Life", content: "", username: "u", ratingScore: 0, ratingCount: 0, commentCount: 0, createdAt: new Date() } as Post;
    expect(postMatchesLocationChip(post, chip)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/onboardingChips.test.ts`
Expected: FAIL with "Cannot find module '@/lib/onboardingChips'".

- [ ] **Step 3: Implement the module**

Create `src/lib/onboardingChips.ts`:

```ts
import type { Post, Topic } from "@/data/seedData";

export type OnboardingChip = {
  id: string;
  label: string;
  matchKeywords: string[];
};

export const TOPIC_CHIPS: OnboardingChip[] = [
  { id: "city",          label: "City & Town",  matchKeywords: ["Chicago", "New York City", "City"] },
  { id: "food",          label: "Food & Drink", matchKeywords: ["Waiter", "McDonald's", "Restaurant"] },
  { id: "relationships", label: "Love & Life",  matchKeywords: ["Love", "Married", "Parent"] },
  { id: "hobbies",       label: "Hobbies",      matchKeywords: ["iPhone", "1980s", "Hobbies"] },
  { id: "school",        label: "School",       matchKeywords: ["College", "Schools"] },
  { id: "health",        label: "Health",       matchKeywords: ["Cancer", "Doctor", "Health"] },
];

export const LOCATION_CHIPS: OnboardingChip[] = [
  { id: "nyc",       label: "New York",        matchKeywords: ["New York"] },
  { id: "chicago",   label: "Chicago",         matchKeywords: ["Chicago"] },
  { id: "la",        label: "Los Angeles",     matchKeywords: ["Los Angeles"] },
  { id: "boston",    label: "Boston",          matchKeywords: ["Boston"] },
  { id: "sf",        label: "San Francisco",   matchKeywords: ["San Francisco"] },
  { id: "austin",    label: "Austin",          matchKeywords: ["Austin"] },
  { id: "seattle",   label: "Seattle",         matchKeywords: ["Seattle"] },
  { id: "miami",     label: "Miami",           matchKeywords: ["Miami"] },
  { id: "portland",  label: "Portland",        matchKeywords: ["Portland"] },
  { id: "denver",    label: "Denver",          matchKeywords: ["Denver"] },
  { id: "nashville", label: "Nashville",       matchKeywords: ["Nashville"] },
  { id: "other",     label: "Somewhere else",  matchKeywords: [] },
];

export const findTopicChip = (id: string | undefined): OnboardingChip | undefined =>
  id ? TOPIC_CHIPS.find((c) => c.id === id) : undefined;

export const findLocationChip = (id: string | undefined): OnboardingChip | undefined =>
  id ? LOCATION_CHIPS.find((c) => c.id === id) : undefined;

const lower = (s: string) => s.toLowerCase();

export const topicMatchesChip = (topic: Topic, chip: OnboardingChip): boolean => {
  if (chip.matchKeywords.length === 0) return true;
  const name = lower(topic.name);
  const category = lower(topic.categoryName);
  return chip.matchKeywords.some((kw) => {
    const k = lower(kw);
    return name.includes(k) || category.includes(k);
  });
};

export const postMatchesLocationChip = (post: Post, chip: OnboardingChip): boolean => {
  if (chip.matchKeywords.length === 0) return true;
  const haystack = [post.topicName, post.title ?? "", post.content].map(lower).join(" ");
  return chip.matchKeywords.some((kw) => haystack.includes(lower(kw)));
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/onboardingChips.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/onboardingChips.ts src/lib/__tests__/onboardingChips.test.ts
git commit -m "feat: add onboarding chip constants and match helpers"
```

---

## Task 2: useOnboarding hook

**Files:**
- Create: `src/hooks/useOnboarding.ts`
- Test: `src/hooks/__tests__/useOnboarding.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/__tests__/useOnboarding.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnboarding, ONBOARDING_STORAGE_KEY } from "@/hooks/useOnboarding";

const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("useOnboarding", () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseAuth.mockReturnValue({ user: null });
  });

  it("isFirstTime is true for unauthenticated user with no storage", () => {
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.isFirstTime).toBe(true);
    expect(result.current.state).toEqual({});
  });

  it("isFirstTime is false for authenticated user even with no storage", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" } });
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.isFirstTime).toBe(false);
  });

  it("isFirstTime is false after dismissal", () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ dismissed: true }));
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.isFirstTime).toBe(false);
  });

  it("isFirstTime is false after selection", () => {
    localStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({ topicId: "food", locationId: "chicago" })
    );
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.isFirstTime).toBe(false);
    expect(result.current.state.topicId).toBe("food");
    expect(result.current.state.locationId).toBe("chicago");
  });

  it("select() writes topicId+locationId and flips isFirstTime", () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.select("food", "chicago"));
    expect(result.current.state).toEqual({ topicId: "food", locationId: "chicago" });
    expect(result.current.isFirstTime).toBe(false);
    const stored = JSON.parse(localStorage.getItem(ONBOARDING_STORAGE_KEY)!);
    expect(stored).toEqual({ topicId: "food", locationId: "chicago" });
  });

  it("skip() sets dismissed and flips isFirstTime", () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.skip());
    expect(result.current.state).toEqual({ dismissed: true });
    expect(result.current.isFirstTime).toBe(false);
  });

  it("reset() clears storage and flips isFirstTime back to true", () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.select("food", "chicago"));
    act(() => result.current.reset());
    expect(result.current.state).toEqual({});
    expect(result.current.isFirstTime).toBe(true);
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBeNull();
  });

  it("tolerates corrupt JSON in storage", () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "{not json");
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.state).toEqual({});
    expect(result.current.isFirstTime).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/__tests__/useOnboarding.test.tsx`
Expected: FAIL with "Cannot find module '@/hooks/useOnboarding'".

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useOnboarding.ts`:

```ts
import { useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const ONBOARDING_STORAGE_KEY = "deetsheet:onboarding:v1";

export type OnboardingState = {
  dismissed?: boolean;
  topicId?: string;
  locationId?: string;
};

const readStorage = (): OnboardingState => {
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as OnboardingState;
    return {};
  } catch {
    return {};
  }
};

const writeStorage = (next: OnboardingState) => {
  localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(next));
};

export const useOnboarding = () => {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>(() => readStorage());

  const select = useCallback((topicId: string, locationId: string) => {
    const next: OnboardingState = { topicId, locationId };
    writeStorage(next);
    setState(next);
  }, []);

  const skip = useCallback(() => {
    const next: OnboardingState = { dismissed: true };
    writeStorage(next);
    setState(next);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setState({});
  }, []);

  const hasSelection = Boolean(state.topicId && state.locationId);
  const isFirstTime = !user && !state.dismissed && !hasSelection;

  return { state, isFirstTime, select, skip, reset };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/__tests__/useOnboarding.test.tsx`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useOnboarding.ts src/hooks/__tests__/useOnboarding.test.tsx
git commit -m "feat: add useOnboarding hook with localStorage persistence"
```

---

## Task 3: FirstTimePanel component

**Files:**
- Create: `src/components/FirstTimePanel.tsx`
- Test: `src/components/__tests__/FirstTimePanel.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/FirstTimePanel.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FirstTimePanel from "@/components/FirstTimePanel";

describe("FirstTimePanel", () => {
  it("renders the onboarding headline", () => {
    render(<FirstTimePanel onSelect={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/New here\?/i)).toBeInTheDocument();
    expect(screen.getByText(/where you're looking/i)).toBeInTheDocument();
  });

  it("renders topic chips and location chips", () => {
    render(<FirstTimePanel onSelect={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Food & Drink" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chicago" })).toBeInTheDocument();
  });

  it("CTA is hidden until both a topic and a location are selected", () => {
    render(<FirstTimePanel onSelect={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /See my view/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Food & Drink" }));
    expect(screen.queryByRole("button", { name: /See my view/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Chicago" }));
    expect(screen.getByRole("button", { name: /See my view/i })).toBeInTheDocument();
  });

  it("clicking See my view calls onSelect with ids", () => {
    const onSelect = vi.fn();
    render(<FirstTimePanel onSelect={onSelect} onSkip={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Food & Drink" }));
    fireEvent.click(screen.getByRole("button", { name: "Chicago" }));
    fireEvent.click(screen.getByRole("button", { name: /See my view/i }));
    expect(onSelect).toHaveBeenCalledWith("food", "chicago");
  });

  it("clicking Skip for now calls onSkip", () => {
    const onSkip = vi.fn();
    render(<FirstTimePanel onSelect={vi.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole("button", { name: /Skip for now/i }));
    expect(onSkip).toHaveBeenCalled();
  });

  it("selecting a second topic replaces the first (single-select)", () => {
    const onSelect = vi.fn();
    render(<FirstTimePanel onSelect={onSelect} onSkip={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Food & Drink" }));
    fireEvent.click(screen.getByRole("button", { name: "Hobbies" }));
    fireEvent.click(screen.getByRole("button", { name: "Chicago" }));
    fireEvent.click(screen.getByRole("button", { name: /See my view/i }));
    expect(onSelect).toHaveBeenCalledWith("hobbies", "chicago");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/__tests__/FirstTimePanel.test.tsx`
Expected: FAIL with "Cannot find module '@/components/FirstTimePanel'".

- [ ] **Step 3: Implement the component**

Create `src/components/FirstTimePanel.tsx`:

```tsx
import { useState } from "react";
import { TOPIC_CHIPS, LOCATION_CHIPS, OnboardingChip } from "@/lib/onboardingChips";

interface FirstTimePanelProps {
  onSelect: (topicId: string, locationId: string) => void;
  onSkip: () => void;
}

const chipClass = (selected: boolean) =>
  `rounded-full px-3 py-1 text-xs transition-colors border ${
    selected
      ? "bg-primary text-white border-primary"
      : "bg-white/10 text-white border-white/40 hover:bg-white/20"
  }`;

const ChipRow = ({
  label,
  chips,
  selectedId,
  onSelect,
}: {
  label: string;
  chips: OnboardingChip[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) => (
  <div className="flex flex-col items-center gap-1">
    <span className="text-[10px] uppercase tracking-wider text-white/70">{label}</span>
    <div className="flex flex-wrap justify-center gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          aria-pressed={selectedId === chip.id}
          onClick={() => onSelect(chip.id)}
          className={chipClass(selectedId === chip.id)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  </div>
);

const FirstTimePanel = ({ onSelect, onSkip }: FirstTimePanelProps) => {
  const [topicId, setTopicId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const ready = topicId && locationId;

  return (
    <div className="relative w-full min-h-[170px] md:min-h-[200px] overflow-hidden">
      <img
        src="/hero-city.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-3 gap-2">
        <h1 className="text-white font-extrabold text-base sm:text-lg md:text-xl leading-tight">
          New here? Tell us where you're looking and what matters to you.
        </h1>
        <ChipRow
          label="I'm interested in"
          chips={TOPIC_CHIPS}
          selectedId={topicId}
          onSelect={setTopicId}
        />
        <ChipRow
          label="I'm looking around"
          chips={LOCATION_CHIPS}
          selectedId={locationId}
          onSelect={setLocationId}
        />
        {ready && (
          <button
            type="button"
            onClick={() => onSelect(topicId!, locationId!)}
            className="mt-1 rounded-full bg-primary text-white text-xs font-semibold px-4 py-1.5 hover:bg-primary/90"
          >
            See my view
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="absolute bottom-2 right-3 z-10 text-xs text-white/80 underline hover:text-white"
      >
        Skip for now
      </button>
    </div>
  );
};

export default FirstTimePanel;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/__tests__/FirstTimePanel.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/FirstTimePanel.tsx src/components/__tests__/FirstTimePanel.test.tsx
git commit -m "feat: add FirstTimePanel onboarding hero component"
```

---

## Task 4: PersonalizedStrip component

**Files:**
- Create: `src/components/PersonalizedStrip.tsx`
- Test: `src/components/__tests__/PersonalizedStrip.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/PersonalizedStrip.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PersonalizedStrip from "@/components/PersonalizedStrip";

describe("PersonalizedStrip", () => {
  it("renders nothing when topicId or locationId missing", () => {
    const { container } = render(
      <PersonalizedStrip topicId={undefined} locationId="chicago" onChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the resolved labels when both are provided", () => {
    render(
      <PersonalizedStrip topicId="food" locationId="chicago" onChange={vi.fn()} />
    );
    expect(screen.getByText(/Showing:/i)).toBeInTheDocument();
    expect(screen.getByText("Chicago")).toBeInTheDocument();
    expect(screen.getByText("Food & Drink")).toBeInTheDocument();
  });

  it("clicking Change calls onChange", () => {
    const onChange = vi.fn();
    render(
      <PersonalizedStrip topicId="food" locationId="chicago" onChange={onChange} />
    );
    fireEvent.click(screen.getByRole("button", { name: /Change/i }));
    expect(onChange).toHaveBeenCalled();
  });

  it("renders nothing when ids resolve to unknown chips", () => {
    const { container } = render(
      <PersonalizedStrip topicId="bogus" locationId="also-bogus" onChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/__tests__/PersonalizedStrip.test.tsx`
Expected: FAIL with "Cannot find module '@/components/PersonalizedStrip'".

- [ ] **Step 3: Implement the component**

Create `src/components/PersonalizedStrip.tsx`:

```tsx
import { findLocationChip, findTopicChip } from "@/lib/onboardingChips";

interface PersonalizedStripProps {
  topicId: string | undefined;
  locationId: string | undefined;
  onChange: () => void;
}

const PersonalizedStrip = ({ topicId, locationId, onChange }: PersonalizedStripProps) => {
  const topic = findTopicChip(topicId);
  const location = findLocationChip(locationId);
  if (!topic || !location) return null;

  return (
    <div className="border-b border-border py-2 px-6 lg:px-10 text-xs flex items-center justify-between">
      <div>
        <span className="text-muted-foreground">Showing: </span>
        <span className="text-foreground font-medium">{location.label}</span>
        <span className="text-muted-foreground"> · </span>
        <span className="text-foreground font-medium">{topic.label}</span>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="text-primary hover:underline"
      >
        Change
      </button>
    </div>
  );
};

export default PersonalizedStrip;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/__tests__/PersonalizedStrip.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/PersonalizedStrip.tsx src/components/__tests__/PersonalizedStrip.test.tsx
git commit -m "feat: add PersonalizedStrip for post-onboarding confirmation"
```

---

## Task 5: RecentlyAddedSidebar accepts locationId

**Files:**
- Modify: `src/components/RecentlyAddedSidebar.tsx`

Context: Current implementation calls `getRecentPosts()` with no args and renders all results. We add an optional `locationId` prop that filters the list using `postMatchesLocationChip`. If filtering leaves fewer than 4 results, pad from the remaining recent posts so the sidebar is never sparse.

- [ ] **Step 1: Replace the component body**

Replace entire contents of `src/components/RecentlyAddedSidebar.tsx`:

```tsx
import PostCard from "@/components/PostCard";
import { getRecentPosts, type Post } from "@/data/seedData";
import { findLocationChip, postMatchesLocationChip } from "@/lib/onboardingChips";

const MIN_POSTS = 4;

interface RecentlyAddedSidebarProps {
  locationId?: string;
}

const selectPosts = (locationId: string | undefined): Post[] => {
  const all = getRecentPosts();
  const chip = findLocationChip(locationId);
  if (!chip || chip.matchKeywords.length === 0) return all;
  const matches = all.filter((p) => postMatchesLocationChip(p, chip));
  if (matches.length >= MIN_POSTS) return matches;
  const filler = all.filter((p) => !matches.includes(p));
  return [...matches, ...filler].slice(0, Math.max(MIN_POSTS, matches.length));
};

const RecentlyAddedSidebar = ({ locationId }: RecentlyAddedSidebarProps) => {
  const recentPosts = selectPosts(locationId);

  return (
    <div className="bg-background rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-1 px-1">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Posts
        </h2>
      </div>
      <div>
        {recentPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default RecentlyAddedSidebar;
```

- [ ] **Step 2: Build and type-check**

Run: `npm run build`
Expected: build succeeds with no TS errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/RecentlyAddedSidebar.tsx
git commit -m "feat: filter recent posts by onboarding location"
```

---

## Task 6: ColumnLayout accepts topicId and locationId

**Files:**
- Modify: `src/components/ColumnLayout.tsx`

Context: Currently `ColumnLayout` hardcodes a list of popular topic names. We add two optional props. When `topicId` is provided, filter `topics` using `topicMatchesChip`; pad to at least 4 entries from the existing hardcoded list so the column never collapses. When `locationId` is provided, pass it down to `RecentlyAddedSidebar`.

- [ ] **Step 1: Replace the component body**

Replace entire contents of `src/components/ColumnLayout.tsx`:

```tsx
import PopularTopicSection from "@/components/PopularTopicSection";
import SubjectsSidebar from "@/components/SubjectsSidebar";
import RecentlyAddedSidebar from "@/components/RecentlyAddedSidebar";
import { topics, type Topic } from "@/data/seedData";
import { findTopicChip, topicMatchesChip } from "@/lib/onboardingChips";

const DEFAULT_POPULAR_NAMES = [
  "Parent", "Waiter", "Chicago", "Cancer", "College", "Love", "Doctor",
  "1980s", "New York City", "iPhone", "Married", "20s", "McDonald's",
];

const MIN_TOPICS = 4;

interface ColumnLayoutProps {
  topicId?: string;
  locationId?: string;
}

const selectPopularTopics = (topicId: string | undefined): Topic[] => {
  const defaults = topics.filter((t) => DEFAULT_POPULAR_NAMES.includes(t.name));
  const chip = findTopicChip(topicId);
  if (!chip || chip.matchKeywords.length === 0) return defaults;
  const matches = topics.filter((t) => topicMatchesChip(t, chip));
  if (matches.length >= MIN_TOPICS) return matches;
  const filler = defaults.filter((d) => !matches.some((m) => m.id === d.id));
  return [...matches, ...filler].slice(0, Math.max(MIN_TOPICS, matches.length));
};

const ColumnLayout = ({ topicId, locationId }: ColumnLayoutProps) => {
  const popularTopics = selectPopularTopics(topicId);

  return (
    <div className="mx-auto mt-5 px-6 lg:px-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[300px_1fr_240px] gap-5">
        {/* Left — Recently Added */}
        <RecentlyAddedSidebar locationId={locationId} />

        {/* Middle — Most Popular */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-4 px-1">
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
        <div className="hidden lg:block lg:border-l lg:border-border lg:pl-5">
          <SubjectsSidebar />
        </div>
      </div>
    </div>
  );
};

export default ColumnLayout;
```

- [ ] **Step 2: Build and type-check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ColumnLayout.tsx
git commit -m "feat: filter popular topics by onboarding selection"
```

---

## Task 7: Wire everything into Index page

**Files:**
- Modify: `src/pages/Index.tsx`

Context: Conditionally render `FirstTimePanel` vs `HeroBanner` based on `isFirstTime`, always render `PersonalizedStrip` (it self-hides), and pass selections to `ColumnLayout`.

- [ ] **Step 1: Replace the page contents**

Replace entire contents of `src/pages/Index.tsx`:

```tsx
import DeetHeader from "@/components/DeetHeader";
import HeroBanner from "@/components/HeroBanner";
import FirstTimePanel from "@/components/FirstTimePanel";
import PersonalizedStrip from "@/components/PersonalizedStrip";
import ColumnLayout from "@/components/ColumnLayout";
import DeetFooter from "@/components/DeetFooter";
import { useOnboarding } from "@/hooks/useOnboarding";

const Index = () => {
  const { state, isFirstTime, select, skip, reset } = useOnboarding();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <DeetHeader />
      <main className="flex-1">
        {isFirstTime ? (
          <FirstTimePanel onSelect={select} onSkip={skip} />
        ) : (
          <HeroBanner />
        )}
        <PersonalizedStrip
          topicId={state.topicId}
          locationId={state.locationId}
          onChange={reset}
        />
        <ColumnLayout topicId={state.topicId} locationId={state.locationId} />
      </main>
      <DeetFooter />
    </div>
  );
};

export default Index;
```

- [ ] **Step 2: Build and type-check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: every test passes (including new ones from Tasks 1–4 plus pre-existing `example.test.ts`).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Index.tsx
git commit -m "feat: wire FirstTimePanel and PersonalizedStrip into homepage"
```

---

## Task 8: Manual browser verification

**Files:** none — verification only.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: server running on `http://localhost:8080`.

- [ ] **Step 2: Verify first-time state**

In the browser (signed-out, clear `localStorage`):

1. Open `http://localhost:8080/`.
2. Expect: the `FirstTimePanel` replaces the carousel. Headline "New here?…" is visible; topic and location chip rows visible; no "See my view" button yet; "Skip for now" link bottom-right.
3. Expect: no `PersonalizedStrip` above `ColumnLayout`. Columns show the default unfiltered content.

- [ ] **Step 3: Verify select flow**

1. Click a topic chip (e.g. "Food & Drink") → it should turn green (`bg-primary`).
2. Click another topic chip (e.g. "Hobbies") → the first deselects, the second becomes green (single-select).
3. Click a location chip (e.g. "Chicago") → green.
4. Expect: "See my view" CTA appears.
5. Click "See my view".
6. Expect: carousel returns in the hero slot; slim strip "Showing: Chicago · Hobbies [Change]" above the columns; Most Popular column reflects the topic filter; Recent Posts column reflects the location filter.
7. Refresh the page. Expect same state persists: carousel + strip + filtered columns, no panel.
8. Open DevTools → Application → localStorage → `deetsheet:onboarding:v1` should be `{"topicId":"hobbies","locationId":"chicago"}`.

- [ ] **Step 4: Verify Change flow**

1. Click "Change" on the strip.
2. Expect: panel returns, strip disappears, columns revert to unfiltered.
3. Expect: localStorage key is removed.

- [ ] **Step 5: Verify Skip flow**

1. With panel showing, click "Skip for now".
2. Expect: carousel returns, no strip, columns unfiltered.
3. Refresh. Expect same state — no panel.
4. localStorage key should be `{"dismissed":true}`.

- [ ] **Step 6: Verify authenticated state**

1. Clear localStorage, then sign in (use an existing test account or whatever flow is available).
2. Expect: carousel only — no panel regardless of localStorage.

- [ ] **Step 7: If all pass, no commit needed (verification task)**

Stop the dev server.

---

## Self-Review Notes

**Spec coverage check:**

- Visitor States table (spec §Visitor States) → Task 2 (hook) + Task 7 (wiring).
- Chip constants file (spec §`src/lib/onboardingChips.ts`) → Task 1.
- `useOnboarding` hook (spec §`src/hooks/useOnboarding.ts`) → Task 2.
- `FirstTimePanel` visual + behavior (spec §`FirstTimePanel`) → Task 3.
- `PersonalizedStrip` behavior (spec §`PersonalizedStrip`) → Task 4.
- `ColumnLayout` filtering (spec §`ColumnLayout`) → Task 6 (topics) + Task 5 (posts via sidebar).
- Index page integration (spec §`Index.tsx`) → Task 7.
- Transitions: Select / Skip / Change (spec §Transitions) → covered in Task 2 tests + Task 8 manual verification.
- Color contract compliance (spec §Color Contract) → baked into component styling in Tasks 3 and 4.
- Non-Goals (no Supabase, no analytics, no multi-select) → respected; not in any task.

**Placeholder scan:** No TBDs, no "add error handling" hand-waving. Every code step shows the actual code.

**Type consistency:** `OnboardingState`, `OnboardingChip`, `select(topicId, locationId)`, `skip()`, `reset()`, `isFirstTime`, prop names (`topicId`, `locationId`, `onSelect`, `onSkip`, `onChange`) used consistently across hook, components, and tests.

**No gaps identified.**
