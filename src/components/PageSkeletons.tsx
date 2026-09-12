import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the layout of `PostCard` while the Recent Posts feed loads. */
export const PostCardSkeleton = ({ withImage = true }: { withImage?: boolean }) => (
  <div className="py-4 border-b border-border last:border-b-0" aria-hidden>
    {/* Topic title */}
    <Skeleton className="mb-3 h-8 w-2/5" />
    {/* Post text (two lines) */}
    <Skeleton className="mb-2 h-4 w-full" />
    <Skeleton className="mb-3.5 h-4 w-3/4" />
    {withImage && <Skeleton className="mb-3.5 aspect-square w-full rounded-none" />}
    {/* Author row */}
    <div className="mb-2 flex items-center gap-2">
      <Skeleton className="h-5 w-5 rounded-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
    </div>
    {/* Actions row */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-14" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  </div>
);

/** Mirrors the layout of `PopularTopicSection` while the Most Popular column loads. */
export const PopularTopicSkeleton = () => (
  <div className="border rounded-xl bg-card px-5 py-4" aria-hidden>
    {/* Title + subtitle */}
    <div className="mb-2">
      <Skeleton className="mb-2 h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="flex gap-5 items-stretch">
      {/* Image */}
      <div className="w-32 sm:w-36 shrink-0 flex flex-col">
        <div className="h-[11px] mb-2" />
        <Skeleton className="flex-1 w-full min-h-[10rem] rounded" />
      </div>
      {/* Numbered list + ratings */}
      <ol className="flex-1 min-w-0 space-y-2">
        <li className="flex items-center gap-3">
          <span className="w-5 shrink-0" />
          <span className="flex-1" />
          <Skeleton className="h-3 w-20" />
        </li>
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-5 shrink-0" />
            <Skeleton className="h-4 flex-1" style={{ maxWidth: `${85 - i * 9}%` }} />
            <span className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </span>
          </li>
        ))}
      </ol>
    </div>
  </div>
);

/** Mirrors the layout of `TopicPostListItem` rows in the topic page's ranked list. */
const TopicPostRowSkeleton = ({ index }: { index: number }) => (
  <div className="flex items-center gap-3 px-3 py-3.5">
    <Skeleton className="h-5 w-6 shrink-0" />
    <Skeleton className="h-5 flex-1" style={{ maxWidth: `${80 - (index % 4) * 12}%` }} />
    <Skeleton className="h-5 w-10 ml-4 shrink-0" />
    <Skeleton className="h-5 w-6 shrink-0 rounded-full" />
  </div>
);

/** Full-page skeleton for `TopicPage` while the topic + its posts resolve. */
export const TopicPageSkeleton = () => (
  <div className="mx-auto mt-5 px-6 lg:px-10 mb-20 lg:mb-0" aria-hidden>
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 lg:gap-x-3">
      {/* Left — Recently Added */}
      <div className="hidden lg:block pt-4 lg:pr-2">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center h-8 mb-3 px-1 pb-2 border-b border-border">
            <Skeleton className="h-3 w-24" />
          </div>
          <PostCardSkeleton />
          <PostCardSkeleton withImage={false} />
        </div>
      </div>
      <div className="lg:pr-2">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5">
          {/* Middle — topic header + ranked posts */}
          <div className="min-w-0 pt-4">
            <div className="min-w-0 bg-card rounded-md border border-border p-4">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="min-w-0 pl-1.5 flex-1">
                  <Skeleton className="h-9 w-48 mb-2" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <div className="hidden md:flex items-start gap-4">
                  <Skeleton className="h-9 w-24 rounded-full" />
                  <Skeleton className="hidden xl:block h-[7.7rem] w-[17.6rem] rounded-lg" />
                </div>
              </div>
              <div className="flex items-baseline gap-3 px-3 -mx-3 pb-2">
                <span className="w-6 shrink-0" />
                <span className="flex-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="divide-y divide-border border-y border-border rounded-t-md -mx-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <TopicPostRowSkeleton key={i} index={i} />
                ))}
              </div>
            </div>
          </div>
          {/* Right — Related Topics */}
          <aside className="hidden lg:block lg:border-l lg:border-border lg:pl-5 pt-4">
            <Skeleton className="h-3 w-28 mb-4 mx-1" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-[var(--radius)] border bg-background overflow-hidden">
                  <div className="p-3">
                    <Skeleton className="h-5 w-28 mb-1.5" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-28 w-full rounded-none" />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  </div>
);

/** One row of a profile tab list (posts / comments / rankings / topics). */
export const ProfileListCardSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-2" aria-hidden>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5" style={{ width: `${60 - (i % 3) * 12}%` }} />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
        </div>
      </div>
    ))}
  </div>
);

/** Header block of `ProfileView` (avatar, name, meta, follow counts). */
export const ProfileHeaderSkeleton = () => (
  <div className="flex-1 min-w-0" aria-hidden>
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
    <Skeleton className="mt-1.5 h-4 w-52" />
    <div className="flex items-center gap-4 mt-3">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-20" />
    </div>
  </div>
);

/**
 * Whole-page fallback for the lazy-loaded profile chunk. Mirrors the
 * `ProfileView` layout: header, about, sidebar card, tabs, list cards.
 */
export const ProfilePageSkeleton = () => (
  <div className="flex-1 py-8 px-4" aria-hidden>
    <div className="container mx-auto max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-8 gap-y-6">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="flex items-start gap-5 mb-6">
            <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
            <ProfileHeaderSkeleton />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="border-b border-border mb-6" />
          <div className="space-y-2 mb-6">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
        <aside className="hidden lg:block space-y-6 lg:col-start-2 lg:row-start-1">
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <Skeleton className="h-3 w-20" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 rounded-full" style={{ width: `${48 + (i % 3) * 16}px` }} />
              ))}
            </div>
          </div>
        </aside>
        <div className="mt-8 min-w-0 lg:col-span-2 lg:row-start-2">
          <div className="flex gap-0 border-b">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-2.5">
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-4 h-10 w-full sm:max-w-sm" />
          <div className="mt-4">
            <ProfileListCardSkeleton />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/** Row-list skeleton for the inbox / admin thread lists. */
export const ThreadListSkeleton = ({ count = 5 }: { count?: number }) => (
  <ul className="divide-y" aria-hidden>
    {Array.from({ length: count }).map((_, i) => (
      <li key={i} className="flex items-center justify-between gap-4 px-4 py-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4" style={{ width: `${55 - (i % 3) * 10}%` }} />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
      </li>
    ))}
  </ul>
);

/**
 * Generic admin page skeleton: page title, toolbar (search + sort), then a
 * table with `rows` rows of `cols` cells. Used by every admin list page.
 */
export const AdminPageSkeleton = ({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) => (
  <div className="space-y-6" aria-hidden>
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-10 w-36 rounded-lg" />
    </div>
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 flex-1 max-w-md rounded-lg" />
      <Skeleton className="h-10 w-40 rounded-lg" />
    </div>
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex gap-5 px-5 h-11 items-center bg-slate-50 border-b">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-5 px-5 py-4 items-center border-b last:border-b-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-4"
              style={{ width: c === 0 ? "22%" : `${10 + ((r + c) % 3) * 4}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);
