# IGNITE NEXUS — Session Status System

## Overview

Sessions use a 3-state model. This was simplified from a legacy 6-state model during the May 2026 migration.

## Valid Statuses

| Status | Meaning | is_consolidated | Teacher can edit? |
|--------|---------|----------------|-------------------|
| `pending` | Session scheduled but not yet held or reviewed | false | Yes |
| `completed` | Session held and finalized by teacher | true | No |
| `excused` | Session cancelled for a documented reason | true | No |

## Excused Reasons

When `status = 'excused'`, the `excused_reason` column stores one of:

| Code | Label (ES) |
|------|-----------|
| `holiday` | Día festivo |
| `school_event` | Evento del colegio |
| `force_majeure` | Fuerza mayor |
| `vacation` | Vacaciones |
| `other` | Otro motivo |

Labels are centralized in `src/messages/es.json` under `sessionsDashboard.excusedReasons.*`. All components use `t('excusedReasons.${reason}')` via the `sessionsDashboard` namespace — no hardcoded label maps.

## How Status is Set

### By Teacher (teacher-sessions.ts)
- `finalizeSession` → sets `completed`, `is_consolidated = true`
- `markSessionExcused(reason)` → sets `excused`, `excused_reason = reason`, `is_consolidated = true`

### By Admin (sessions-dashboard.ts)
- `updateSessionStatus(id, status, reason?)` → updates status; sets/clears excused_reason atomically

### By Admin (schools.ts)
- `adminUpdateSession(input)` → can update status, project, traffic_light, teacher_comment, excused_reason in one call

## Lock Semantics

`is_consolidated = true` means:
- The session is locked in the teacher UI — teacher cannot re-open, re-save, or re-finalize it
- Status `completed` and `excused` are always consolidated
- Admin CAN still update a consolidated session (sessions dashboard bypasses the lock)

## Effect on Project Inheritance

When a session is finalized (`completed` or `excused`):
- The next `pending` session for the same planning inherits the current session's `project_id`
- This ensures the group's project context carries forward even if a session is excused

## Effect on XP

| Status | XP awarded? |
|--------|------------|
| `pending` | No |
| `completed` | Yes (via `submitProjectEvaluation`) |
| `excused` | No XP from session; project evaluation can still be submitted separately |

`submitProjectEvaluation` applies `Math.max(0, xpAwarded)` guards on both `skill_evaluations.xp_awarded` and the `student_xp` upsert delta — XP can never go negative.

## Legacy Statuses (Removed)

The following values existed in the DB schema before the May 2026 migration and may still be present in old session rows:

| Legacy value | Replacement |
|-------------|-------------|
| `suspended` | `excused` with appropriate reason |
| `holiday` | `excused` + `excused_reason = 'holiday'` |
| `cancelled` | `excused` + `excused_reason = 'other'` |
| `unknown` | `pending` or `excused` depending on context |

**Action required**: Run a migration to convert any remaining rows with these legacy statuses.

## TodaySessionSection Render Logic

`TodaySessionSection` is the teacher-facing component that surfaces the current session for a group. It uses a simplified two-branch model:

**Data source — `closestSession`:**
```ts
// src/lib/data/teacher.ts — fetchClosestSession
supabase
  .from('sessions')
  .select(SESSION_FIELDS)
  .eq('planning_id', planningId)
  .not('status', 'in', '(completed,excused)')
  .order('session_date', { ascending: true })
  .limit(1)
```
Returns the chronologically **oldest pending session** for the active planning. There is no "today" logic — `closestSession` is purely the earliest unfinished session, regardless of date.

**Component branches:**

| Condition | Renders |
|-----------|---------|
| `session === null` | Empty state: "No hay ninguna sesión pendiente." |
| `session !== null` | `ActiveSessionForm` for the pending session |

**Removed logic (June 2026):**
- `isClassToday` — checked if today matched the group schedule weekday
- `isFuturePending` — detected pending sessions in the future
- `todaySlot` — schedule slot for today's weekday
- "Iniciar sesión" button — created a new session via `createTodaySession` server action
- Overdue warning banner
- `createTodaySession` server action — deleted entirely from `teacher-sessions.ts`

The component now has zero awareness of dates or schedules — it simply shows the oldest pending session or an empty state.

## TypeScript Types

```ts
// src/types/index.ts — canonical source of truth
export type SessionStatus = 'pending' | 'completed' | 'excused'

// src/lib/data/sessions-dashboard.ts — WeekSession.status matches SessionStatus
```
