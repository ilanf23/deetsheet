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
