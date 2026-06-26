@AGENTS.md

# IGNITE NEXUS — Claude Instructions

## Project overview

Full-stack platform for managing after-school tech education programs. Next.js 16.2.3 App Router, Supabase (PostgreSQL + Auth), three roles: admin / teacher / student.

## Documentation

All technical docs live in `docs/`:

| File | Contents |
|------|---------|
| [docs/arquitectura.md](docs/arquitectura.md) | Stack, folder structure, code patterns, auth model, i18n, cache strategy, all modules with routes and files |
| [docs/base-de-datos.md](docs/base-de-datos.md) | Every table with columns/types/constraints, SQL functions, all RLS policies (migrations 001–022), design decisions |
| [docs/actions.md](docs/actions.md) | Every server action file, every exported function, auth requirements, known security gaps |
| [docs/status-system.md](docs/status-system.md) | Session statuses, STA types (slot-scoped vs session-scoped), worker availability tiers P1–P5, staffing rules, auto-absence logic, XP system |
| [docs/ui-components.md](docs/ui-components.md) | All UI components by area, props, key patterns, design system |

**Start here when working on any module**: read the relevant section of `arquitectura.md` and the corresponding entries in `actions.md` and `base-de-datos.md`.

## Key commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Type-check + production build
npm run lint     # ESLint
```

## Critical constraints

- **Never modify `src/components/teacher/` or `src/components/student/` from admin code.** These are independent areas.
- **Next.js 16 breaking changes** (see `docs/arquitectura.md` § 1): `proxy.ts` not `middleware.ts`, `updateTag` not `revalidateTag`, `await params`, `render={}` not `asChild`.
- Sessions dashboard is **decoupled from sessions** — the staffing grid is built from `group_schedule`, not `sessions`. Use `SlotRef` (not `sessionId`) as input to all staffing mutations.
- `group_schedule.min_teachers_required` is the **canonical** minimum — not `sessions.min_teachers_required`.
- All session status values: `'pending' | 'completed' | 'excused'`. Legacy values (`suspended`, `holiday`, `cancelled`, `unknown`) exist only in old DB rows.
