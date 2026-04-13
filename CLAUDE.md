# DeetSheet

Community-driven topic discussion platform built with React + TypeScript + Supabase.

## Tech Stack

- **Framework**: React 18 + TypeScript (strict: false)
- **Build**: Vite (port 8080) with SWC
- **Styling**: Tailwind CSS 3 + shadcn/ui (Radix primitives) + Lucide icons
- **Backend**: Supabase (auth, database, storage)
- **Routing**: React Router v6
- **State**: React Context + TanStack React Query
- **Forms**: React Hook Form + Zod
- **Rich Text**: TipTap
- **Charts**: Recharts

## Commands

- `npm run dev` — Start dev server (port 8080)
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm test` — Run tests (Vitest)

## Project Structure

```
src/
├── components/        # Reusable components
│   ├── ui/            # shadcn/ui primitives (do not edit directly)
│   └── admin/         # Admin layout and route guard
├── pages/             # Route-level page components
│   └── admin/         # Admin pages (dashboard, users, posts, comments, topics)
├── contexts/          # AuthContext, AdminModeContext
├── hooks/             # useAuth, useAdminAuth, useAdminMode, useIsMobile, useToast
├── integrations/
│   └── supabase/      # Client singleton + auto-generated DB types
├── data/              # Seed/mock data
├── types/             # TypeScript type definitions
├── lib/               # Utilities (cn(), cropImage)
└── test/              # Vitest setup and tests
```

## Rules

- **No hardcoded data**: Never use hardcoded strings, numbers, or mock data in components or pages. All display data must come from Supabase or be defined in constants/config files. No inline placeholder content, fake users, sample posts, or static lists that should be dynamic.

- **Color-coded interactivity (strict, site-wide)**: Text color signals whether text is interactive. This is a semantic contract — never use color purely for decoration.
  - **Green (`text-primary`, primary HSL `157 60% 30%`)** = clickable / linkable content. Every green string must navigate, open a dialog, trigger an action, or behave as an `<a>` / `<button>` / router link. Hover state (e.g. `hover:underline`) is expected. Examples: topic titles, post titles, usernames, category names, tag pills, breadcrumbs, "See more" links.
  - **Black / dark foreground (`text-foreground`, `text-card-foreground`)** = static, non-interactive content. Never wrap in a link. Never apply hover-underline. Examples: post body text, descriptions, numeric stats, timestamps, plain labels.
  - **Muted gray (`text-muted-foreground`)** = supporting/secondary static text (subtitles, captions, metadata). Non-interactive, same rules as black.
  - **Coral/orange (`text-secondary`, secondary HSL `20 100% 60%`)** = rating values and rating icons only. Not interactive. Do not use for links or decorative accents.
  - When adding/editing any UI, audit each text node: if it's green it MUST be clickable; if it's black/gray it MUST NOT be clickable. If a string needs to be interactive but currently renders black, change it to green (and vice versa) — don't introduce a new hover affordance on black text.

## Conventions

- **Imports**: Use `@/` path alias (maps to `src/`). Group: React → libraries → local → ui.
- **Components**: PascalCase filenames. Pages use `DeetHeader` + content + `DeetFooter` layout.
- **Hooks/utils**: camelCase filenames.
- **Supabase**: Import client from `@/integrations/supabase/client`. Use `Tables<"name">` for types.
- **Styling**: Tailwind utility classes. Custom theme uses CSS variables (HSL). Font: Merriweather.
- **UI components**: Use shadcn/ui from `@/components/ui/`. Don't rebuild what shadcn provides.
- **State**: Local `useState` for UI state, contexts for shared state. No Redux/Zustand.
- **Auth**: `useAuth()` for user/session. Admin check via `useAdminAuth()` against `user_roles` table.
- **Notifications**: Use Sonner toasts via `useToast()`.

## Database Tables

profiles, posts, comments, topics, user_roles

## Key Patterns

- Data fetching: Direct Supabase queries in useEffect or event handlers
- Dialogs: Controlled via parent state, using Radix Dialog
- Admin routes: Protected by `AdminRouteGuard` component
- Rich text: TipTap editor in `RichTextEditor.tsx`
