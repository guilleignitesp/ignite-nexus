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

---

## Staffing — Session Teacher Assignments (STAs)

### Two forms of STAs

**Session-scoped (legacy)**: `session_id NOT NULL`. Created by earlier workflows. Still valid and read by `getWeekStaffing`.

**Slot-scoped (new)**: `session_id = NULL`, with `group_id + slot_date + start_time_local + end_time_local` set. All new substitute and absence records from the sessions dashboard use this format. A CHECK constraint enforces that every row has one of the two forms.

### STA types

| `type` value | Meaning |
|---|---|
| `absent` | Permanent worker marked absent for this slot |
| `substitute` | External worker added as substitute |
| `permanent_add` | Permanent team addition (via group_assignments) |
| `permanent_remove` | Permanent team removal |

### Worker availability tiers (P1–P5)

Calculated by `getWorkerAvailability(slot: SlotRef)`. Used to classify workers in `SubstitutePanel`.

| Tier | Condition | Add button |
|------|-----------|-----------|
| **P1 Surplus** | Permanent worker in an overlapping group that has more workers than `min_teachers_required` | Yes — triggers auto-absence |
| **P2 Available** | Worker with no active overlapping assignment | Yes |
| **P3 Critical** | Permanent worker in an overlapping group at exactly `min_teachers_required` | Yes ⚠ — warning shown, no auto-absence |
| **P4 Unavailable** | Worker has active substitute STA in another overlapping slot | No |
| **P5 Inactive** | `worker.is_active = false` | No |

**Canonical source of `min_teachers_required`**: `group_schedule.min_teachers_required`. Not `sessions.min_teachers_required`.

**effectiveCount** = permanent workers for a group minus absent workers (union of session-scoped absent STAs and slot-scoped absent STAs for that date).

### Auto-absence on substitute add

When a P1 worker is added as substitute:

1. A substitute STA is created slot-scoped in the target slot.
2. An absent STA is created for the worker's origin group. The STA is written with **both** `session_id` (if a session exists for that slot) **and** the slot fields (`group_id`, `slot_date`, `start_time_local`, `end_time_local`) — so it is findable by both query paths.
3. The `substitute_add` entry in `dashboard_change_log` stores `new_state.auto_absence_ids[]` with the IDs of all generated absent STAs.
4. `revertChange` on a `substitute_add` entry deactivates both the substitute STA and all STAs in `auto_absence_ids`.

**Critical groups (P3) are skipped**: no auto-absence is created when the worker's origin group is at minimum coverage. The substitute is still allowed.

### Asignaciones permanentes por slot

Un grupo con varias sesiones semanales puede tener profesores distintos en cada slot.
`group_assignments.weekday` controla esto:
- `weekday = NULL` → el profesor está asignado a TODOS los slots del grupo (comportamiento anterior)
- `weekday = N` + `slot_start_time` → el profesor solo aparece en el slot que coincide con ese día y hora

`PermanentAssignmentDialog` pasa siempre el `slotRef` del slot desde el que se abre, así que las asignaciones creadas desde el dashboard siempre son slot-específicas. La detección de idempotencia también incluye weekday+time para permitir al mismo profesor estar en distintos slots del mismo grupo.

### dashboard_change_log — reversibility

| `change_type` | Reversible | Notes |
|---|---|---|
| `substitute_add` | Yes | Also deactivates `auto_absence_ids[]` |
| `substitute_remove` | Yes | — |
| `absent_mark` | Yes | — |
| `absent_unmark` | Yes | — |
| `permanent_add` | Yes | — |
| `permanent_remove` | Yes | — |
| `min_teachers_update` | **No** | Informational only. `worker_id = null`. Shown in AuditPanel as sub-line with new value. No revert button. |

### Scope of change_log entries

- **Session-scoped**: `session_id NOT NULL`. `revertChange` uses `session_id` for countQuery.
- **Slot-scoped**: `session_id = NULL`, `group_id NOT NULL`. `revertChange` uses `group_id` for countQuery.
- Revert button in `AuditPanel` is shown for `substitute_add` and `absent_mark` regardless of `isSessionChange`.

---

## Student XP System

### XP sources

| Source | Table | Field |
|--------|-------|-------|
| Project evaluation | `skill_evaluations.xp_awarded` | academic_xp |
| Attitude action | `attitude_logs.xp_awarded` | — (summed at query time) |

`student_xp` stores `academic_xp` (accumulated from evaluations), `attitude_xp` (accumulated from attitude logs), and `total_xp = academic_xp + attitude_xp`.

XP is never negative: `submitProjectEvaluation` applies `Math.max(0, xpAwarded)` on every delta. `updateProjectEvaluation` computes a delta (new − old) and applies the same guard.

### XP multiplier

`students.xp_multiplier_pct` (20–200, default 100) scales the XP awarded on project evaluations. Configurable per student by admin.

`project_evaluations.xp_multiplier_pct` (30–150, default 100) is set by the teacher at evaluation time and applied on top of the student multiplier.

### Levels

Defined in `level_thresholds(scope, level, xp_required)`. Scopes: `global`, `branch`, `skill`. Levels 1–10 for global/branch, 1–5 for skill.

---

## Attitude Actions

Defined in `attitude_actions` (catalog). `xp_value` can be negative (penalty). Logged in `attitude_logs` with `session_id` (nullable — action can be recorded without an active session), `student_id`, `worker_id`, `action_id`, `xp_awarded` (copied from catalog at log time).

`recordAttitudeAction` calculates `previousTotalXp` by summing both `student_xp` and `attitude_logs` before applying the new action.
