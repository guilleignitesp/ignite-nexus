# IGNITE NEXUS — Server Actions Reference

All actions live in `src/lib/actions/`. Every action is a `'use server'` file. Auth is handled via `getUserProfile()` from `src/lib/auth.ts`.

---

## Auth Guards Used

| Guard | Function | What it checks |
|-------|---------|---------------|
| Worker only | `getUserProfile()?.workerId` | Authenticated worker exists |
| Teacher-group | `assertTeacherOwnsGroup(groupId)` | **STUB** — only checks workerId, does NOT verify group assignment |
| Dashboard access | `assertDashboardAccess()` | `isSuperAdmin \|\| adminModules.includes('sessions_dashboard')` |
| Schools access | `assertSchoolsAccess()` | `isSuperAdmin \|\| adminModules.includes('schools')` |
| Teachers access | `assertTeachersAccess()` | `isSuperAdmin \|\| adminModules.includes('teachers')` |
| Students access | `assertStudentsAccess()` | `isSuperAdmin \|\| adminModules.includes('students')` |
| Validation access | `assertValidationAccess()` | `isSuperAdmin \|\| adminModules.includes('validation')` |

**Critical**: `assertTeacherOwnsGroup` is a stub. It grants any active worker access to any group's data.

---

## `actions/teacher-sessions.ts`

Teacher-facing session management.

| Function | Auth | Description |
|---------|------|-------------|
| `finalizeSession` | worker + group | Mark session completed, inherit project to next pending |
| `saveSession` | worker + group | Update session project, traffic light, comment, attendances (no lock) |
| `submitProjectEvaluation` | worker + group | Upsert evaluations + skills + award XP to all students |
| `updateProjectEvaluation` | worker + group | Edit existing evaluation (recalculates XP delta) |
| `getProjectDetails` | worker + group | Read project details + skills for evaluation form |
| `getSessionEvaluation` | worker + group | Read existing evaluation for a session |
| `getProjectSkillsForEvaluation` | worker (no group check) | Read skills for a project/planning pair |
| `getSessionAttendances` | worker + group | Read attendance list for a session |
| `markSessionExcused` | worker + group | Mark session excused with reason, consolidate |
| `recordAttitudeAction` | worker (no student ownership check) | Award attitude XP to a student |

**Known security gaps**:
- `assertTeacherOwnsGroup` does not verify group membership
- `recordAttitudeAction` accepts any studentId — no verification student is in teacher's group
- `getProjectSkillsForEvaluation` has no group ownership check

---

## `actions/sessions-dashboard.ts`

Admin sessions dashboard mutations. Input key type: `SlotRef = { groupId, slotDate, startTime, endTime }` — used instead of sessionId for all staffing mutations.

**Data layer (not actions):** `getWeekStaffing(weekStart, weekEnd)` lives in `src/lib/data/schools.ts`. Returns `StaffingSlot[]` built from `group_schedule` + `group_assignments` + STAs. Sessions optional.

| Function | Auth | Description |
|---------|------|-------------|
| `getWorkerAvailability(slot)` | dashboardAccess | Returns workers classified P1–P5. Reads `group_schedule.min_teachers_required` as canonical threshold. Merges session-scoped and slot-scoped absent STAs for effectiveCount. |
| `addSubstitute(slot, workerId)` | dashboardAccess | Creates slot-scoped STA (`session_id=null`). Auto-absences surplus workers in overlapping groups — writes STAs with both `session_id` (if exists) and slot fields. Skips auto-absence for critical groups (P3). Logs to `dashboard_change_log` with `auto_absence_ids[]` in `new_state`. |
| `removeSubstitute(staId)` | dashboardAccess | Deactivates substitute STA + logs change |
| `markAbsent(slot, workerId)` | dashboardAccess | Creates slot-scoped STA (`type='absent'`). Writes both `session_id` and slot fields. |
| `unmarkAbsent(staId)` | dashboardAccess | Deactivates absent STA. Works for both session-scoped and slot-scoped. |
| `updateSlotMinTeachers(slot, n)` | dashboardAccess | Writes `n` to `group_schedule.min_teachers_required` (canonical). Also updates `sessions.min_teachers_required` if session exists for that date/time. Logs `min_teachers_update` to `dashboard_change_log` (not reversible). |
| `addPermanentAssignment` | dashboardAccess | Create group_assignment (permanent) + log change |
| `removePermanentAssignment` | dashboardAccess | End-date group_assignment + log change |
| `revertChange(changeId)` | dashboardAccess | Reverts a logged change. For `substitute_add`: deactivates substitute STA + all STAs in `new_state.auto_absence_ids[]`. countQuery uses `session_id` if present, else `group_id`, else no-match. |
| `getAuditLog()` | dashboardAccess | Read dashboard_change_log entries. Returns `ChangeLogEntry[]` with `autoAbsenceIds`, `newState`, `isSessionChange`. |
| `getGroupAuditLog(groupId)` | dashboardAccess | Audit log filtered by group |
| `getGroupProjects` | dashboardAccess | Read projects for a group's planning, flagging already-completed |
| `getGroupPermanentAssignments` | dashboardAccess | Read permanent assignments for a group |
| `getSessionTeam` | dashboardAccess | Read current team (permanent + changes) for a session |
| `searchWorkersForAssignment` | dashboardAccess | Search workers for assignment to a group |
| `generateGroupSessions` | dashboardAccess | Manually generate sessions for a group |
| `updateSessionStatus` | dashboardAccess | Update status + excused_reason. Used by admin group detail, not staffing UI. |
| `updateSessionMinTeachers` | dashboardAccess | Set `sessions.min_teachers_required`. Used by admin group detail, not staffing UI (use `updateSlotMinTeachers` for staffing). |
| `updateSessionProject` | dashboardAccess | Assign project to a session. Used by admin group detail, not staffing UI. |

---

## `actions/schools.ts`

Admin school and group management.

| Function | Auth | Description |
|---------|------|-------------|
| `createSchool` | schoolsAccess | Insert new school |
| `createGroup` | schoolsAccess | Insert group + schedule + generate sessions |
| `generateSessions` | schoolsAccess | Generate sessions for a group across a date range |
| `deleteGroup` | schoolsAccess | Cascade delete group and all child records |
| `adminUpdateSession` | schoolsAccess | Update session status, project, traffic light, comment |
| `enrollStudentInGroup` | schoolsAccess | Add student enrollment to a group |
| `deactivateEnrollment` | schoolsAccess | End student enrollment |
| `getSessionEvaluationForAdmin` | schoolsAccess | Read evaluation + attendances for a session |
| `getSessionAttendancesForAdmin` | schoolsAccess | Read attendance records |
| `deleteProjectEvaluation` | schoolsAccess | Delete evaluation + skill_evaluations + revert XP |

**Known gap**: Admin with `schools` module can access ANY school's sessions, not just the ones they manage.

---

## `actions/teachers.ts`

Worker/admin management. Uses admin Supabase client for auth operations.

| Function | Auth | Description |
|---------|------|-------------|
| `createWorker` | teachersAccess | Create auth user + workers row |
| `toggleWorkerStatus` | teachersAccess | Ban/unban auth user + update worker.status + end assignments |
| `updateWorkerInfo` | teachersAccess | Update name + auth email |
| `changeWorkerPassword` | teachersAccess | Reset auth password |
| `getWorkerEmail` | teachersAccess | Read auth.users.email |
| `grantPermission` | superAdmin | Create admin_permissions row |
| `revokePermission` | superAdmin | Delete admin_permissions row |
| `assignToTeam` | teachersAccess | Create worker_teams row |
| `removeFromTeam` | teachersAccess | Delete worker_teams row |

---

## `actions/students.ts`

Admin student management.

| Function | Auth | Description |
|---------|------|-------------|
| `createStudent` | studentsAccess | Insert student |
| `editStudent` | studentsAccess | Update student info |
| `updateXPMultiplier` | studentsAccess | Set xp_multiplier_pct (clamped 20–200) |
| `toggleStudentStatus` | studentsAccess | Set student active/inactive |

---

## `actions/validation.ts`

Admin project validation workflow.

| Function | Auth | Description |
|---------|------|-------------|
| `validateAssignment` | validationAccess | Mark planning_project_log as validated |
| `rejectAssignment` | validationAccess | Mark planning_project_log as rejected |
| `getValidationQueue` | validationAccess | Read pending validation items |

---

## `actions/absences.ts`

Teacher absence requests and admin approval.

| Function | Auth | Description |
|---------|------|-------------|
| `requestAbsence` | worker | Create absence request |
| `cancelAbsence` | worker | Cancel own pending request |
| `approveAbsence` | **any admin** | Approve request (should require 'absences' module) |
| `rejectAbsence` | **any admin** | Reject request (should require 'absences' module) |

**Known gap**: `approveAbsence`/`rejectAbsence` check `hasAdminAccess` instead of a specific module.

---

## `actions/timesheets.ts` / `actions/admin-timesheets.ts`

| Function | Auth | Description |
|---------|------|-------------|
| `clockIn` | worker | Create 'in' timesheet entry |
| `clockOut` | worker | Create 'out' timesheet entry |
| `deleteTimesheetEntry` | superAdmin | Delete any timesheet entry |

---

## `actions/projects.ts`

| Function | Auth | Description |
|---------|------|-------------|
| `createProject` | projectsAccess | Insert project + skills + resources |
| `updateProject` | projectsAccess | Update project + replace skills/resources |
| `deleteProject` | projectsAccess | Delete project and all references |

---

## `actions/project-maps.ts`

| Function | Auth | Description |
|---------|------|-------------|
| `createMap` | mapsAccess | Create new project map |
| `saveMap` | mapsAccess | Upsert nodes + edges for a map |
| `deleteMap` | mapsAccess | Delete map and all nodes/edges |
| `getProjectFullDetails` | worker | Read project details for a project map node |

---

## `actions/enrollments.ts`

| Function | Auth | Description |
|---------|------|-------------|
| `bulkEnroll` | studentsAccess | CSV-style bulk insert of student+group enrollments |
| `bulkDeactivate` | studentsAccess | Deactivate enrollments for a list of groupIds |

**Known gap**: No per-row validation of groupIds ownership.

---

## `actions/settings.ts`

| Function | Auth | Description |
|---------|------|-------------|
| `createSchoolYear` | superAdmin | Insert school_year |
| `activateSchoolYear` | superAdmin | Set is_active on school_year |
| `closeCourse` | superAdmin | Archive current course data |
| `updatePlatformName` | superAdmin | Update platform_settings.platform_name |

---

## `actions/attitudes.ts`

| Function | Auth | Description |
|---------|------|-------------|
| `createAttitudeAction` | attitudesAccess | Insert attitude_action |
| `updateAttitudeAction` | attitudesAccess | Update attitude_action |
| `deleteAttitudeAction` | attitudesAccess | Delete attitude_action |

---

## `actions/skills.ts`

| Function | Auth | Description |
|---------|------|-------------|
| `createBranch` | skillsAccess | Insert skill_branch |
| `createSkill` | skillsAccess | Insert skill |
| `updateSkill` | skillsAccess | Update skill |
| `deleteSkill` | skillsAccess | Delete skill |

---

## `actions/stock.ts`

| Function | Auth | Description |
|---------|------|-------------|
| `createItem` | stockAccess | Insert stock_item |
| `moveItem` | stockAccess | Insert stock_movement |
| `adjustStock` | stockAccess | Update item quantity |
| `deleteItem` | stockAccess | Delete stock_item |

---

## `actions/global-resources.ts`

| Function | Auth | Description |
|---------|------|-------------|
| `createResource` | resourcesAccess | Insert global_resource |
| `updateResource` | resourcesAccess | Update global_resource |
| `deleteResource` | resourcesAccess | Delete global_resource |
