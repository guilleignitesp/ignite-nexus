# IGNITE NEXUS

Platform for managing after-school tech education programs. Covers session scheduling, project-based learning progression, teacher management, student XP tracking, and administrative oversight.

## Stack

- **Framework**: Next.js 16.2.3 (App Router, React Server Components, Server Actions)
- **Database / Auth**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **i18n**: next-intl (es / en / ca)
- **Visualization**: @xyflow/react (project maps)

## User Roles

| Role | Access |
|------|--------|
| Worker (teacher) | `/teacher/*` — session management, project evaluation, attendance |
| Admin | `/admin/*` — school/group management, sessions dashboard, student profiles (module-gated) |
| Super Admin | All admin modules + settings, school year management |

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server only, never exposed to client) |

Copy `.env.local.example` to `.env.local` and fill in values from your Supabase project settings.

## Build

```bash
npm run build   # type-check + build
npm run lint    # ESLint
```

## Key Docs

- [Architecture](docs/arquitectura.md) — stack, routing, code patterns, auth model, all modules
- [Database](docs/base-de-datos.md) — all tables, columns, relationships, RLS policies, migrations
- [Actions](docs/actions.md) — all server actions, auth requirements
- [Status System](docs/status-system.md) — session statuses, staffing tiers, XP rules
- [UI Components](docs/ui-components.md) — component tree by area, props, design patterns

## Project Structure

```
src/
├── app/[locale]/           Next.js routes (admin, teacher, student)
├── components/
│   ├── admin/              Admin-only components
│   ├── teacher/            Teacher-facing components
│   └── ui/                 shadcn base components
├── lib/
│   ├── actions/            Server actions (mutations)
│   ├── data/               Data fetch functions (reads)
│   ├── auth.ts             getUserProfile, requireAuth guards
│   ├── supabase-server.ts  Authenticated server client
│   └── supabase-admin.ts   Service role client (auth user ops only)
├── messages/               i18n JSON files (es, en, ca)
└── types/index.ts          Shared TypeScript types
```

## Development Notes

- Server actions call `getUserProfile()` at the top for auth — do not skip this
- Use `createClient()` from `supabase-server.ts` for all mutations, not the browser client
- `createAdminClient()` is only for `auth.admin.*` operations (create user, ban, reset password)
- All session status values must be: `'pending' | 'completed' | 'excused'` — legacy values (`suspended`, `holiday`, `cancelled`) exist only in old DB rows pending migration
