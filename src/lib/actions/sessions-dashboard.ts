'use server'

import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'

// ─── Availability types ───────────────────────────────────────

export interface WorkerLayerItem {
  id: string
  firstName: string
  lastName: string
  currentGroupName?: string
  differentSchool?: boolean
}

export interface AvailabilityResult {
  p1Surplus: WorkerLayerItem[]
  p2Free: WorkerLayerItem[]
  p3Critical: WorkerLayerItem[]
  p4Unavailable: WorkerLayerItem[]
  p5Inactive: WorkerLayerItem[]
}

export interface ChangeLogEntry {
  id: string
  sessionDate: string
  groupName: string
  schoolName: string
  workerName: string
  changedByName: string
  changeType: string
  changedAt: string
  isReverted: boolean
  isSessionChange: boolean
}

// ─── Helpers ──────────────────────────────────────────────────

function subtractDay(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

// ─── Auth helper ──────────────────────────────────────────────

async function assertDashboardAccess(): Promise<string> {
  const profile = await getUserProfile()
  if (
    !profile?.workerId ||
    (!profile.isSuperAdmin && !profile.adminModules.includes('sessions_dashboard'))
  ) {
    throw new Error('Unauthorized')
  }
  return profile.workerId
}

// ─── getWorkerAvailability ─────────────────────────────────────

export async function getWorkerAvailability(
  sessionId: string
): Promise<AvailabilityResult> {
  await assertDashboardAccess()
  const supabase = await createClient()

  // Step 1: Get session details
  const { data: sessionRaw, error: sessionError } = await supabase
    .from('sessions')
    .select(
      'id, session_date, start_time, end_time, min_teachers_required, plannings(group_id, groups(school_id, schools(team_id)))'
    )
    .eq('id', sessionId)
    .single()

  if (sessionError || !sessionRaw) throw new Error(sessionError?.message ?? 'Session not found')

  type SessionRaw = {
    id: string
    session_date: string
    start_time: string
    end_time: string
    min_teachers_required: number
    plannings: {
      group_id: string
      groups: { school_id: string; schools: { team_id: string | null } | null } | null
    } | null
  }
  const session = sessionRaw as unknown as SessionRaw
  const ourSchoolId = session.plannings?.groups?.school_id ?? null
  const ourGroupId = session.plannings?.group_id ?? null
  const schoolTeamId = session.plannings?.groups?.schools?.team_id ?? null

  // Step 2: Get all workers
  const { data: workersData, error: workersError } = await supabase
    .from('workers')
    .select('id, first_name, last_name, status')

  if (workersError) throw new Error(workersError.message)
  const allWorkers = (workersData ?? []) as {
    id: string
    first_name: string
    last_name: string
    status: string
  }[]

  // Step 2.5: Team filtering — if school has a team, exclude workers assigned to other teams
  let eligibleWorkerIds: Set<string> | null = null
  if (schoolTeamId !== null) {
    const { data: wtData } = await supabase.from('worker_teams').select('worker_id, team_id')
    const wtAll = (wtData ?? []) as { worker_id: string; team_id: string }[]
    const workersWithTeam = new Set(wtAll.map((wt) => wt.worker_id))
    const workersInSchoolTeam = new Set(
      wtAll.filter((wt) => wt.team_id === schoolTeamId).map((wt) => wt.worker_id)
    )
    eligibleWorkerIds = new Set<string>()
    for (const w of allWorkers) {
      if (!workersWithTeam.has(w.id) || workersInSchoolTeam.has(w.id)) {
        eligibleWorkerIds.add(w.id)
      }
    }
  }

  // Step 3: Get permanent group_assignments active on the session date
  const { data: assignmentsData, error: assignmentsError } = await supabase
    .from('group_assignments')
    .select('id, group_id, worker_id, groups(school_id)')
    .eq('type', 'permanent')
    .lte('start_date', session.session_date)
    .or(`end_date.is.null,end_date.gte.${session.session_date}`)

  if (assignmentsError) throw new Error(assignmentsError.message)

  type AssignmentWithGroup = {
    id: string
    group_id: string
    worker_id: string
    groups: { school_id: string } | null
  }
  const permanentAssignments = (assignmentsData ?? []) as unknown as AssignmentWithGroup[]

  // Build map: workerId → ALL permanent groups (a worker can be in multiple groups)
  const workerPermanentGroups = new Map<string, { groupId: string; schoolId: string }[]>()
  for (const a of permanentAssignments) {
    if (a.groups) {
      const arr = workerPermanentGroups.get(a.worker_id) ?? []
      arr.push({ groupId: a.group_id, schoolId: a.groups.school_id })
      workerPermanentGroups.set(a.worker_id, arr)
    }
  }

  // Step 4: Get all overlapping sessions on the same date
  const { data: overlapData, error: overlapError } = await supabase
    .from('sessions')
    .select(
      'id, start_time, end_time, min_teachers_required, plannings(group_id), session_teacher_assignments(id, worker_id, type, is_active)'
    )
    .eq('session_date', session.session_date)
    .neq('id', sessionId)
    .lt('start_time', session.end_time)
    .gt('end_time', session.start_time)

  if (overlapError) throw new Error(overlapError.message)

  type OverlapSession = {
    id: string
    start_time: string
    end_time: string
    min_teachers_required: number
    plannings: { group_id: string } | null
    session_teacher_assignments: {
      id: string
      worker_id: string
      type: string
      is_active: boolean
    }[]
  }
  const overlapSessions = (overlapData ?? []) as unknown as OverlapSession[]

  // Build worker → overlapping sessions map
  const workerOverlapSessions = new Map<string, OverlapSession[]>()

  // Also index sessions by their group
  const sessionsByGroup = new Map<string, OverlapSession[]>()
  for (const os of overlapSessions) {
    const gid = os.plannings?.group_id
    if (gid) {
      const arr = sessionsByGroup.get(gid) ?? []
      arr.push(os)
      sessionsByGroup.set(gid, arr)
    }
  }

  // For substitutes: directly in session_teacher_assignments with type='substitute'
  for (const os of overlapSessions) {
    for (const sta of os.session_teacher_assignments ?? []) {
      if (sta.is_active && sta.type === 'substitute') {
        const arr = workerOverlapSessions.get(sta.worker_id) ?? []
        arr.push(os)
        workerOverlapSessions.set(sta.worker_id, arr)
      }
    }
  }

  const result: AvailabilityResult = {
    p1Surplus: [],
    p2Free: [],
    p3Critical: [],
    p4Unavailable: [],
    p5Inactive: [],
  }

  for (const worker of allWorkers) {
    if (eligibleWorkerIds !== null && !eligibleWorkerIds.has(worker.id)) continue

    // P5: inactive
    if (worker.status !== 'active') {
      result.p5Inactive.push({
        id: worker.id,
        firstName: worker.first_name,
        lastName: worker.last_name,
      })
      continue
    }

    // P4: has substitute STA on any overlapping session
    if (workerOverlapSessions.has(worker.id)) {
      result.p4Unavailable.push({
        id: worker.id,
        firstName: worker.first_name,
        lastName: worker.last_name,
      })
      continue
    }

    // Check all permanent groups for this worker
    const permGroups = workerPermanentGroups.get(worker.id) ?? []
    let isCritical = false
    let isAbsentFromAllOverlapping = true
    let hasAnyOverlap = false
    let surplusSchoolId: string | null = null

    for (const permGroup of permGroups) {
      const permGroupSessions = sessionsByGroup.get(permGroup.groupId) ?? []
      if (permGroupSessions.length === 0) continue

      hasAnyOverlap = true

      for (const os of permGroupSessions) {
        const absentSTA = (os.session_teacher_assignments ?? []).find(
          (sta) => sta.worker_id === worker.id && sta.type === 'absent' && sta.is_active
        )

        const permanentForGroup = permanentAssignments.filter(
          (a) => a.group_id === permGroup.groupId
        )
        const absentWorkerIds = new Set(
          (os.session_teacher_assignments ?? [])
            .filter((sta) => sta.type === 'absent' && sta.is_active)
            .map((sta) => sta.worker_id)
        )
        const effectiveCount = permanentForGroup.filter(
          (a) => !absentWorkerIds.has(a.worker_id)
        ).length
        const minRequired = os.min_teachers_required ?? 1

        if (absentSTA) {
          // Worker already absent — their absence is included in effectiveCount, no action needed
        } else {
          // Worker is present in this session
          isAbsentFromAllOverlapping = false
          if (effectiveCount <= minRequired) {
            isCritical = true
          } else if (surplusSchoolId === null) {
            surplusSchoolId = permGroup.schoolId
          }
        }
      }
    }

    if (hasAnyOverlap) {
      if (isCritical) {
        result.p3Critical.push({ id: worker.id, firstName: worker.first_name, lastName: worker.last_name })
        continue
      }
      if (isAbsentFromAllOverlapping) {
        result.p2Free.push({ id: worker.id, firstName: worker.first_name, lastName: worker.last_name })
        continue
      }
      // Surplus in at least one group
      const differentSchool = surplusSchoolId !== null && surplusSchoolId !== ourSchoolId
      result.p1Surplus.push({ id: worker.id, firstName: worker.first_name, lastName: worker.last_name, differentSchool })
      continue
    }

    // P2: free — no permanent group has an overlapping session
    result.p2Free.push({ id: worker.id, firstName: worker.first_name, lastName: worker.last_name })
  }

  return result
}

// ─── addSubstitute ────────────────────────────────────────────

export async function addSubstitute(
  sessionId: string,
  workerId: string
): Promise<void> {
  const changedBy = await assertDashboardAccess()
  const supabase = await createClient()

  // Get session details
  const { data: sessionRaw, error: sessionError } = await supabase
    .from('sessions')
    .select('id, session_date, start_time, end_time, plannings(group_id, groups(schools(team_id)))')
    .eq('id', sessionId)
    .single()

  if (sessionError || !sessionRaw) throw new Error(sessionError?.message ?? 'Session not found')

  type SessionInfo = {
    id: string
    session_date: string
    start_time: string
    end_time: string
    plannings: { group_id: string; groups: { schools: { team_id: string | null } | null } | null } | null
  }
  const sess = sessionRaw as unknown as SessionInfo
  const schoolTeamId = sess.plannings?.groups?.schools?.team_id ?? null

  // Team guard — worker must have no teams or share the school's team
  if (schoolTeamId !== null) {
    const { data: wtData } = await supabase
      .from('worker_teams')
      .select('team_id')
      .eq('worker_id', workerId)
    const workerTeamIds = new Set(((wtData ?? []) as { team_id: string }[]).map((wt) => wt.team_id))
    if (workerTeamIds.size > 0 && !workerTeamIds.has(schoolTeamId)) {
      throw new Error('TEAM_MISMATCH')
    }
  }

  // Anti-double: find overlapping sessions where worker is permanent (not absent) or substitute
  const { data: overlapData } = await supabase
    .from('sessions')
    .select(
      'id, session_teacher_assignments(worker_id, type, is_active)'
    )
    .eq('session_date', sess.session_date)
    .lt('start_time', sess.end_time)
    .gt('end_time', sess.start_time)

  const overlapSessions = (overlapData ?? []) as unknown as {
    id: string
    session_teacher_assignments: { worker_id: string; type: string; is_active: boolean }[]
  }[]

  for (const os of overlapSessions) {
    for (const sta of os.session_teacher_assignments ?? []) {
      if (sta.worker_id === workerId && sta.is_active && sta.type === 'substitute') {
        throw new Error('CONFLICT: already assigned to session at this time')
      }
    }
  }

  // Check permanent assignments active on the session date (Fix 2: date-range filter)
  const { data: permanentConflict } = await supabase
    .from('group_assignments')
    .select('id, group_id')
    .eq('worker_id', workerId)
    .eq('type', 'permanent')
    .lte('start_date', sess.session_date)
    .or(`end_date.is.null,end_date.gte.${sess.session_date}`)

  const permGroupIds = (permanentConflict ?? []).map(
    (a: { id: string; group_id: string }) => a.group_id
  )

  // Sessions to auto-absent the worker from (Fix 3: surplus → auto-absent)
  const surplusSessionIds: string[] = []

  if (permGroupIds.length > 0) {
    const { data: permSessions } = await supabase
      .from('sessions')
      .select(
        'id, min_teachers_required, plannings(group_id), session_teacher_assignments(worker_id, type, is_active)'
      )
      .eq('session_date', sess.session_date)
      .lt('start_time', sess.end_time)
      .gt('end_time', sess.start_time)
      .neq('id', sessionId)

    type PermSession = {
      id: string
      min_teachers_required: number
      plannings: { group_id: string } | null
      session_teacher_assignments: { worker_id: string; type: string; is_active: boolean }[]
    }
    const permSessionsList = (permSessions ?? []) as unknown as PermSession[]

    for (const ps of permSessionsList) {
      const gid = ps.plannings?.group_id
      if (!gid || !permGroupIds.includes(gid)) continue

      const isAbsent = (ps.session_teacher_assignments ?? []).some(
        (sta) => sta.worker_id === workerId && sta.type === 'absent' && sta.is_active
      )
      if (isAbsent) continue  // already absent — no conflict

      // Worker is present — check if their group is surplus or critical
      const { data: permForGroup } = await supabase
        .from('group_assignments')
        .select('worker_id')
        .eq('group_id', gid)
        .eq('type', 'permanent')
        .lte('start_date', sess.session_date)
        .or(`end_date.is.null,end_date.gte.${sess.session_date}`)

      const allPermIds = ((permForGroup ?? []) as { worker_id: string }[]).map((a) => a.worker_id)
      const absentIds = new Set(
        (ps.session_teacher_assignments ?? [])
          .filter((sta) => sta.type === 'absent' && sta.is_active)
          .map((sta) => sta.worker_id)
      )
      const effectiveCount = allPermIds.filter((id) => !absentIds.has(id)).length
      const minRequired = ps.min_teachers_required ?? 1

      if (effectiveCount <= minRequired) {
        throw new Error('CONFLICT: already assigned to session at this time')
      }

      // Surplus — schedule auto-absent
      surplusSessionIds.push(ps.id)
    }
  }

  // Insert substitute STA
  const { data: insertedSTA, error: insertError } = await supabase
    .from('session_teacher_assignments')
    .insert({
      session_id: sessionId,
      worker_id: workerId,
      type: 'substitute',
      valid_from: sess.session_date,
      valid_until: sess.session_date,
      is_active: true,
    })
    .select('id')
    .single()

  if (insertError) throw new Error(insertError.message)

  // Auto-absent worker from surplus sessions and collect their ids
  const autoAbsenceIds: string[] = []
  for (const surplusSessionId of surplusSessionIds) {
    const { data: absentSTA, error: absentError } = await supabase
      .from('session_teacher_assignments')
      .insert({
        session_id: surplusSessionId,
        worker_id: workerId,
        type: 'absent',
        valid_from: sess.session_date,
        valid_until: sess.session_date,
        is_active: true,
      })
      .select('id')
      .single()

    if (absentError) throw new Error(absentError.message)

    const absenceId = (absentSTA as { id: string }).id
    autoAbsenceIds.push(absenceId)

    await supabase.from('dashboard_change_log').insert({
      session_id: surplusSessionId,
      worker_id: workerId,
      changed_by: changedBy,
      change_type: 'absent_mark',
      previous_state: null,
      new_state: { assignment_id: absenceId },
    })
  }

  // Log substitute — include auto_absence_ids so removeSubstitute can undo them
  const { error: logError } = await supabase.from('dashboard_change_log').insert({
    session_id: sessionId,
    worker_id: workerId,
    changed_by: changedBy,
    change_type: 'substitute_add',
    previous_state: null,
    new_state: {
      assignment_id: (insertedSTA as { id: string }).id,
      auto_absence_ids: autoAbsenceIds,
    },
  })

  if (logError) throw new Error(logError.message)
}

// ─── removeSubstitute ─────────────────────────────────────────

export async function removeSubstitute(
  substituteAssignmentId: string
): Promise<void> {
  const changedBy = await assertDashboardAccess()
  const supabase = await createClient()

  // Get the assignment
  const { data: sta, error: fetchError } = await supabase
    .from('session_teacher_assignments')
    .select('id, session_id, worker_id')
    .eq('id', substituteAssignmentId)
    .single()

  if (fetchError || !sta) throw new Error(fetchError?.message ?? 'Assignment not found')

  const { session_id, worker_id } = sta as { id: string; session_id: string; worker_id: string }

  // Deactivate substitute STA
  const { error: updateError } = await supabase
    .from('session_teacher_assignments')
    .update({ is_active: false })
    .eq('id', substituteAssignmentId)

  if (updateError) throw new Error(updateError.message)

  // Look up the original add-log to find auto-created absence STAs
  const { data: logEntry } = await supabase
    .from('dashboard_change_log')
    .select('new_state')
    .eq('change_type', 'substitute_add')
    .eq('worker_id', worker_id)
    .eq('session_id', session_id)
    .eq('is_reverted', false)
    .order('changed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  type SubstituteLogState = { assignment_id: string; auto_absence_ids?: string[] }
  const logState = (logEntry as { new_state: SubstituteLogState } | null)?.new_state

  const autoAbsenceIds: string[] =
    logState?.assignment_id === substituteAssignmentId
      ? (logState.auto_absence_ids ?? [])
      : []

  // Undo auto-absences created when this substitute was added
  for (const absenceId of autoAbsenceIds) {
    const { error: absenceUpdateError } = await supabase
      .from('session_teacher_assignments')
      .update({ is_active: false })
      .eq('id', absenceId)

    if (absenceUpdateError) throw new Error(absenceUpdateError.message)

    // Find the session_id for this absence STA so we can log it properly
    const { data: absenceSTA } = await supabase
      .from('session_teacher_assignments')
      .select('session_id')
      .eq('id', absenceId)
      .single()

    await supabase.from('dashboard_change_log').insert({
      session_id: (absenceSTA as { session_id: string } | null)?.session_id ?? null,
      worker_id,
      changed_by: changedBy,
      change_type: 'absent_unmark',
      previous_state: { assignment_id: absenceId },
      new_state: null,
    })
  }

  // Log substitute removal
  const { error: logError } = await supabase.from('dashboard_change_log').insert({
    session_id,
    worker_id,
    changed_by: changedBy,
    change_type: 'substitute_remove',
    previous_state: { assignment_id: substituteAssignmentId },
    new_state: null,
  })

  if (logError) throw new Error(logError.message)
}

// ─── markAbsent ──────────────────────────────────────────────

export async function markAbsent(
  sessionId: string,
  workerId: string
): Promise<void> {
  const changedBy = await assertDashboardAccess()
  const supabase = await createClient()

  // Get session date
  const { data: sessRaw, error: sessError } = await supabase
    .from('sessions')
    .select('id, session_date')
    .eq('id', sessionId)
    .single()

  if (sessError || !sessRaw) throw new Error(sessError?.message ?? 'Session not found')
  const { session_date } = sessRaw as { id: string; session_date: string }

  // Insert absence STA
  const { data: insertedSTA, error: insertError } = await supabase
    .from('session_teacher_assignments')
    .insert({
      session_id: sessionId,
      worker_id: workerId,
      type: 'absent',
      valid_from: session_date,
      valid_until: session_date,
      is_active: true,
    })
    .select('id')
    .single()

  if (insertError) throw new Error(insertError.message)

  // Log
  const { error: logError } = await supabase.from('dashboard_change_log').insert({
    session_id: sessionId,
    worker_id: workerId,
    changed_by: changedBy,
    change_type: 'absent_mark',
    previous_state: null,
    new_state: { assignment_id: (insertedSTA as { id: string }).id },
  })

  if (logError) throw new Error(logError.message)
}

// ─── unmarkAbsent ─────────────────────────────────────────────

export async function unmarkAbsent(
  absenceAssignmentId: string
): Promise<void> {
  const changedBy = await assertDashboardAccess()
  const supabase = await createClient()

  // Get the STA
  const { data: sta, error: fetchError } = await supabase
    .from('session_teacher_assignments')
    .select('id, session_id, worker_id')
    .eq('id', absenceAssignmentId)
    .single()

  if (fetchError || !sta) throw new Error(fetchError?.message ?? 'Assignment not found')
  const { session_id, worker_id } = sta as { id: string; session_id: string; worker_id: string }

  // Deactivate
  const { error: updateError } = await supabase
    .from('session_teacher_assignments')
    .update({ is_active: false })
    .eq('id', absenceAssignmentId)

  if (updateError) throw new Error(updateError.message)

  // Log
  const { error: logError } = await supabase.from('dashboard_change_log').insert({
    session_id,
    worker_id,
    changed_by: changedBy,
    change_type: 'absent_unmark',
    previous_state: { assignment_id: absenceAssignmentId },
    new_state: null,
  })

  if (logError) throw new Error(logError.message)
}

// ─── generateGroupSessions ────────────────────────────────────

export async function generateGroupSessions(
  groupId: string,
  startDate: string,
  endDate: string
): Promise<{ created: number }> {
  await assertDashboardAccess()
  const supabase = await createClient()

  const { data: planningData } = await supabase
    .from('plannings')
    .select('id')
    .eq('group_id', groupId)
    .eq('is_active', true)
    .maybeSingle()

  if (!planningData) throw new Error('NO_PLANNING')
  const planningId = (planningData as { id: string }).id

  const { data: scheduleData } = await supabase
    .from('group_schedule')
    .select('weekday, start_time, end_time')
    .eq('group_id', groupId)

  const schedule = (scheduleData ?? []) as {
    weekday: number
    start_time: string
    end_time: string
  }[]

  if (schedule.length === 0) throw new Error('NO_SCHEDULE')

  type DateSlot = { date: string; startTime: string; endTime: string }
  const sessionDates: DateSlot[] = []
  const start = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate}T12:00:00`)

  for (const slot of schedule) {
    // DB weekday: 1=Mon…5=Fri; JS getDay(): 0=Sun, 1=Mon…6=Sat
    const jsWeekday = slot.weekday === 7 ? 0 : slot.weekday
    const cursor = new Date(start)
    while (cursor <= end) {
      if (cursor.getDay() === jsWeekday) {
        sessionDates.push({
          date: cursor.toISOString().slice(0, 10),
          startTime: slot.start_time,
          endTime: slot.end_time,
        })
      }
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  if (sessionDates.length === 0) return { created: 0 }

  const { data: existing } = await supabase
    .from('sessions')
    .select('session_date')
    .eq('planning_id', planningId)
    .gte('session_date', startDate)
    .lte('session_date', endDate)

  const existingDates = new Set(
    ((existing ?? []) as { session_date: string }[]).map((s) => s.session_date)
  )

  const toInsert = sessionDates.filter((s) => !existingDates.has(s.date))
  if (toInsert.length === 0) return { created: 0 }

  const { error } = await supabase.from('sessions').insert(
    toInsert.map((s) => ({
      planning_id: planningId,
      session_date: s.date,
      start_time: s.startTime,
      end_time: s.endTime,
      status: 'pending',
      is_consolidated: false,
      project_id: null,
    }))
  )

  if (error) throw new Error(error.message)
  return { created: toInsert.length }
}

// ─── updateSessionStatus ──────────────────────────────────────

export async function updateSessionStatus(
  sessionId: string,
  status: 'pending' | 'completed' | 'excused',
  excusedReason?: string
): Promise<void> {
  await assertDashboardAccess()
  const supabase = await createClient()

  const updatePayload: Record<string, unknown> = { status }
  if (status === 'excused' && excusedReason) {
    updatePayload.excused_reason = excusedReason
  } else if (status !== 'excused') {
    updatePayload.excused_reason = null
  }

  const { error } = await supabase
    .from('sessions')
    .update(updatePayload)
    .eq('id', sessionId)

  if (error) throw new Error(error.message)
}

// ─── updateSessionMinTeachers ─────────────────────────────────

export async function updateSessionMinTeachers(
  sessionId: string,
  minTeachersRequired: number
): Promise<void> {
  await assertDashboardAccess()
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({ min_teachers_required: minTeachersRequired })
    .eq('id', sessionId)

  if (error) throw new Error(error.message)
}

// ─── updateSessionProject ─────────────────────────────────────

export async function updateSessionProject(
  sessionId: string,
  projectId: string | null
): Promise<void> {
  await assertDashboardAccess()
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({ project_id: projectId })
    .eq('id', sessionId)

  if (error) throw new Error(error.message)
}

// ─── getGroupProjects ─────────────────────────────────────────

export async function getGroupProjects(
  groupId: string
): Promise<{ id: string; name: string; alreadyCompleted: boolean }[]> {
  await assertDashboardAccess()
  const supabase = await createClient()

  const { data: planningData } = await supabase
    .from('plannings')
    .select('id, project_map_id')
    .eq('group_id', groupId)
    .eq('is_active', true)
    .maybeSingle()

  if (!planningData) return []
  const { id: planningId, project_map_id } = planningData as { id: string; project_map_id: string | null }
  if (!project_map_id) return []

  const [nodesResult, logsResult] = await Promise.all([
    supabase
      .from('project_map_nodes')
      .select('projects(id, name)')
      .eq('map_id', project_map_id),
    supabase
      .from('planning_project_log')
      .select('project_id, project_evaluations(id)')
      .eq('planning_id', planningId),
  ])

  if (nodesResult.error) throw new Error(nodesResult.error.message)

  type LogWithEval = { project_id: string; project_evaluations: { id: string }[] }
  const completedProjectIds = new Set<string>(
    ((logsResult.data ?? []) as unknown as LogWithEval[])
      .filter((l) => (l.project_evaluations?.length ?? 0) > 0)
      .map((l) => l.project_id)
  )

  type RawNode = { projects: { id: string; name: string } | null }
  return ((nodesResult.data ?? []) as unknown as RawNode[])
    .filter((n) => n.projects !== null)
    .map((n) => ({
      id: n.projects!.id,
      name: n.projects!.name,
      alreadyCompleted: completedProjectIds.has(n.projects!.id),
    }))
}

// ─── getGroupPermanentAssignments ─────────────────────────────

export async function getGroupPermanentAssignments(
  groupId: string,
  asOfDate?: string
): Promise<{ id: string; workerId: string; firstName: string; lastName: string }[]> {
  const supabase = await createClient()

  const base = supabase
    .from('group_assignments')
    .select('id, worker_id, workers(id, first_name, last_name)')
    .eq('group_id', groupId)
    .eq('type', 'permanent')

  const { data, error } = asOfDate
    ? await base
        .lte('start_date', asOfDate)
        .or(`end_date.is.null,end_date.gte.${asOfDate}`)
    : await base
        .is('end_date', null)
        .eq('is_active', true)

  if (error) throw new Error(error.message)

  type RawGA = {
    id: string
    worker_id: string
    workers: { id: string; first_name: string; last_name: string } | null
  }

  return ((data ?? []) as unknown as RawGA[])
    .filter((a) => a.workers !== null)
    .map((a) => ({
      id: a.id,
      workerId: a.worker_id,
      firstName: a.workers!.first_name,
      lastName: a.workers!.last_name,
    }))
}

// ─── getSessionTeam ───────────────────────────────────────────

export async function getSessionTeam(
  sessionId: string
): Promise<{ id: string; workerId: string; firstName: string; lastName: string }[]> {
  await assertDashboardAccess()
  const supabase = await createClient()

  const { data: sessRaw, error: sessError } = await supabase
    .from('sessions')
    .select('session_date, plannings(group_id)')
    .eq('id', sessionId)
    .single()

  if (sessError || !sessRaw) throw new Error(sessError?.message ?? 'Session not found')

  type SessInfo = { session_date: string; plannings: { group_id: string } | null }
  const sess = sessRaw as unknown as SessInfo
  const groupId = sess.plannings?.group_id
  if (!groupId) throw new Error('Session has no group')

  return getGroupPermanentAssignments(groupId, sess.session_date)
}

// ─── addPermanentAssignment ───────────────────────────────────

export async function addPermanentAssignment(
  groupId: string,
  workerId: string,
  force: boolean,
  effectiveFromDate?: string
): Promise<{ manualConflicts: number }> {
  const changedBy = await assertDashboardAccess()
  const supabase = await createClient()

  const today = new Date().toISOString().slice(0, 10)
  const effectiveDate = effectiveFromDate ?? today

  // Check if already assigned on effectiveDate
  const existingCheck = effectiveFromDate
    ? await supabase
        .from('group_assignments')
        .select('id')
        .eq('group_id', groupId)
        .eq('worker_id', workerId)
        .eq('type', 'permanent')
        .lte('start_date', effectiveDate)
        .or(`end_date.is.null,end_date.gte.${effectiveDate}`)
        .maybeSingle()
    : await supabase
        .from('group_assignments')
        .select('id')
        .eq('group_id', groupId)
        .eq('worker_id', workerId)
        .is('end_date', null)
        .eq('type', 'permanent')
        .eq('is_active', true)
        .maybeSingle()

  if (existingCheck.data) return { manualConflicts: 0 }

  // When effectiveFromDate is provided, close any open-ended assignment
  if (effectiveFromDate) {
    const { data: openAssignment } = await supabase
      .from('group_assignments')
      .select('id')
      .eq('group_id', groupId)
      .eq('worker_id', workerId)
      .eq('type', 'permanent')
      .is('end_date', null)
      .eq('is_active', true)
      .maybeSingle()

    if (openAssignment) {
      const { error: closeError } = await supabase
        .from('group_assignments')
        .update({ end_date: subtractDay(effectiveFromDate) })
        .eq('id', (openAssignment as { id: string }).id)
      if (closeError) throw new Error(closeError.message)
    }
  }

  // Get plannings for this group
  const { data: planningRows } = await supabase
    .from('plannings')
    .select('id')
    .eq('group_id', groupId)
    .eq('is_active', true)

  const planningIds = ((planningRows ?? []) as { id: string }[]).map((p) => p.id)

  let conflictSTAIds: string[] = []
  let manualConflicts = 0

  if (planningIds.length > 0) {
    const { data: groupSessions } = await supabase
      .from('sessions')
      .select(
        'id, planning_id, session_teacher_assignments(id, worker_id, type, is_active)'
      )
      .in('planning_id', planningIds)
      .gte('session_date', effectiveDate)
      .eq('is_consolidated', false)

    type GroupSession = {
      id: string
      planning_id: string
      session_teacher_assignments: { id: string; worker_id: string; type: string; is_active: boolean }[]
    }

    const groupSessionsList = (groupSessions ?? []) as unknown as GroupSession[]

    for (const gs of groupSessionsList) {
      const workerSTAs = (gs.session_teacher_assignments ?? []).filter(
        (sta) => sta.worker_id === workerId && sta.is_active
      )
      if (workerSTAs.length > 0) {
        manualConflicts++
        conflictSTAIds.push(...workerSTAs.map((s) => s.id))
      }
    }
  }

  if (manualConflicts > 0 && !force) {
    return { manualConflicts }
  }

  // If force: deactivate conflicting STAs
  if (force && conflictSTAIds.length > 0) {
    const { error: deactivateError } = await supabase
      .from('session_teacher_assignments')
      .update({ is_active: false })
      .in('id', conflictSTAIds)

    if (deactivateError) throw new Error(deactivateError.message)
  }

  // Insert group assignment
  const { data: insertedGA, error: insertError } = await supabase
    .from('group_assignments')
    .insert({
      worker_id: workerId,
      group_id: groupId,
      start_date: effectiveDate,
      end_date: null,
      type: 'permanent',
      is_active: true,
    })
    .select('id')
    .single()

  if (insertError) throw new Error(insertError.message)

  // Log
  await supabase.from('dashboard_change_log').insert({
    session_id: null,
    group_id: groupId,
    worker_id: workerId,
    changed_by: changedBy,
    change_type: 'permanent_add',
    new_state: { assignment_id: (insertedGA as { id: string }).id },
  })

  return { manualConflicts: 0 }
}

// ─── removePermanentAssignment ────────────────────────────────

export async function removePermanentAssignment(
  assignmentId: string,
  effectiveFromDate?: string
): Promise<void> {
  const changedBy = await assertDashboardAccess()
  const supabase = await createClient()

  const today = new Date().toISOString().slice(0, 10)
  const endDate = effectiveFromDate ? subtractDay(effectiveFromDate) : today

  // Fetch assignment details needed for logging
  const { data, error: fetchError } = await supabase
    .from('group_assignments')
    .select('id, group_id, worker_id')
    .eq('id', assignmentId)
    .single()

  if (fetchError || !data) throw new Error(fetchError?.message ?? 'Assignment not found')

  const { group_id, worker_id } = data as { id: string; group_id: string; worker_id: string }

  const updatePayload = effectiveFromDate
    ? { end_date: endDate }
    : { end_date: endDate, is_active: false }

  const { error: updateError } = await supabase
    .from('group_assignments')
    .update(updatePayload)
    .eq('id', assignmentId)

  if (updateError) throw new Error(updateError.message)

  // Log
  await supabase.from('dashboard_change_log').insert({
    session_id: null,
    group_id,
    worker_id,
    changed_by: changedBy,
    change_type: 'permanent_remove',
    previous_state: { assignment_id: assignmentId },
  })
}

// ─── searchWorkersForAssignment ──────────────────────────────

export async function searchWorkersForAssignment(
  query: string,
  groupId: string,
  asOfDate?: string
): Promise<{ id: string; firstName: string; lastName: string; conflict: boolean }[]> {
  const supabase = await createClient()

  // Run in parallel: group schedule + assigned workers + all active workers + group's school team
  const [scheduleResult, assignedResult, workersResult, groupSchoolResult] = await Promise.all([
    supabase
      .from('group_schedule')
      .select('weekday, start_time, end_time')
      .eq('group_id', groupId),
    asOfDate
      ? supabase
          .from('group_assignments')
          .select('worker_id')
          .eq('group_id', groupId)
          .eq('type', 'permanent')
          .lte('start_date', asOfDate)
          .or(`end_date.is.null,end_date.gte.${asOfDate}`)
      : supabase
          .from('group_assignments')
          .select('worker_id')
          .eq('group_id', groupId)
          .is('end_date', null)
          .eq('type', 'permanent')
          .eq('is_active', true),
    (() => {
      let q = supabase
        .from('workers')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('last_name')
      if (query.trim()) {
        q = q.or(`first_name.ilike.%${query.trim()}%,last_name.ilike.%${query.trim()}%`)
      }
      return q
    })(),
    supabase.from('groups').select('schools(team_id)').eq('id', groupId).maybeSingle(),
  ])

  if (workersResult.error) throw new Error(workersResult.error.message)

  type ScheduleSlot = { weekday: number; startTime: string; endTime: string }

  const targetSchedule: ScheduleSlot[] = (
    (scheduleResult.data ?? []) as { weekday: number; start_time: string; end_time: string }[]
  ).map((s) => ({ weekday: s.weekday, startTime: s.start_time, endTime: s.end_time }))

  const assignedIds = new Set(
    ((assignedResult.data ?? []) as { worker_id: string }[]).map((a) => a.worker_id)
  )

  type GroupSchoolRow = { schools: { team_id: string | null } | null }
  const schoolTeamId = (groupSchoolResult.data as unknown as GroupSchoolRow | null)?.schools?.team_id ?? null

  let workers = ((workersResult.data ?? []) as { id: string; first_name: string; last_name: string }[])
    .filter((w) => !assignedIds.has(w.id))

  // Team filtering — exclude workers assigned to other teams
  if (schoolTeamId !== null && workers.length > 0) {
    const { data: wtData } = await supabase
      .from('worker_teams')
      .select('worker_id, team_id')
      .in('worker_id', workers.map((w) => w.id))
    const wtAll = (wtData ?? []) as { worker_id: string; team_id: string }[]
    const workersWithTeam = new Set(wtAll.map((wt) => wt.worker_id))
    const workersInSchoolTeam = new Set(
      wtAll.filter((wt) => wt.team_id === schoolTeamId).map((wt) => wt.worker_id)
    )
    workers = workers.filter((w) => !workersWithTeam.has(w.id) || workersInSchoolTeam.has(w.id))
  }

  if (workers.length === 0 || targetSchedule.length === 0) {
    return workers.map((w) => ({
      id: w.id,
      firstName: w.first_name,
      lastName: w.last_name,
      conflict: false,
    }))
  }

  // Get all permanent assignments these workers have to OTHER groups
  const workerIds = workers.map((w) => w.id)
  const { data: otherAssignments } = await supabase
    .from('group_assignments')
    .select('worker_id, group_id')
    .in('worker_id', workerIds)
    .neq('group_id', groupId)
    .is('end_date', null)
    .eq('type', 'permanent')
    .eq('is_active', true)

  const otherAssignmentsList = (otherAssignments ?? []) as { worker_id: string; group_id: string }[]
  const otherGroupIds = [...new Set(otherAssignmentsList.map((a) => a.group_id))]

  if (otherGroupIds.length === 0) {
    return workers.map((w) => ({
      id: w.id,
      firstName: w.first_name,
      lastName: w.last_name,
      conflict: false,
    }))
  }

  // Get schedule slots (with times) for those other groups
  const { data: otherSchedules } = await supabase
    .from('group_schedule')
    .select('group_id, weekday, start_time, end_time')
    .in('group_id', otherGroupIds)

  // Build map: group_id → ScheduleSlot[]
  const otherGroupSchedules = new Map<string, ScheduleSlot[]>()
  for (const s of ((otherSchedules ?? []) as { group_id: string; weekday: number; start_time: string; end_time: string }[])) {
    const arr = otherGroupSchedules.get(s.group_id) ?? []
    arr.push({ weekday: s.weekday, startTime: s.start_time, endTime: s.end_time })
    otherGroupSchedules.set(s.group_id, arr)
  }

  // Build map: worker_id → group_ids[]
  const workerOtherGroups = new Map<string, string[]>()
  for (const a of otherAssignmentsList) {
    const arr = workerOtherGroups.get(a.worker_id) ?? []
    arr.push(a.group_id)
    workerOtherGroups.set(a.worker_id, arr)
  }

  return workers.map((w) => {
    const otherGroups = workerOtherGroups.get(w.id) ?? []
    const conflict = otherGroups.some((gid) => {
      const otherSlots = otherGroupSchedules.get(gid) ?? []
      return targetSchedule.some((tSlot) =>
        otherSlots.some(
          (oSlot) =>
            oSlot.weekday === tSlot.weekday &&
            oSlot.startTime < tSlot.endTime &&
            oSlot.endTime > tSlot.startTime
        )
      )
    })
    return { id: w.id, firstName: w.first_name, lastName: w.last_name, conflict }
  })
}

// ─── getAuditLog ──────────────────────────────────────────────

export async function getAuditLog(): Promise<ChangeLogEntry[]> {
  await assertDashboardAccess()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dashboard_change_log')
    .select(
      `id, change_type, changed_at, is_reverted, previous_state, new_state,
       worker:worker_id(first_name, last_name),
       changer:changed_by(first_name, last_name),
       sessions(session_date, plannings(groups(name, schools(name)))),
       groups:group_id(name, schools(name))`
    )
    .order('changed_at', { ascending: false })
    .limit(200)

  if (error) throw new Error(error.message)

  type RawLogEntry = {
    id: string
    change_type: string
    changed_at: string
    is_reverted: boolean
    previous_state: unknown
    new_state: unknown
    worker: { first_name: string; last_name: string } | null
    changer: { first_name: string; last_name: string } | null
    sessions: {
      session_date: string
      plannings: {
        groups: { name: string; schools: { name: string } | null } | null
      } | null
    } | null
    groups: { name: string; schools: { name: string } | null } | null
  }

  return ((data ?? []) as unknown as RawLogEntry[]).map((entry) => {
    const sessionDate = entry.sessions?.session_date ?? ''
    const groupName =
      entry.sessions?.plannings?.groups?.name ?? entry.groups?.name ?? ''
    const schoolName =
      entry.sessions?.plannings?.groups?.schools?.name ??
      entry.groups?.schools?.name ??
      ''
    return {
      id: entry.id,
      sessionDate,
      groupName,
      schoolName,
      workerName: entry.worker
        ? `${entry.worker.first_name} ${entry.worker.last_name}`
        : '',
      changedByName: entry.changer
        ? `${entry.changer.first_name} ${entry.changer.last_name}`
        : '',
      changeType: entry.change_type,
      changedAt: entry.changed_at,
      isReverted: entry.is_reverted,
      isSessionChange: entry.sessions !== null,
    }
  })
}

// ─── getGroupAuditLog ─────────────────────────────────────────

export async function getGroupAuditLog(groupId: string): Promise<ChangeLogEntry[]> {
  await assertDashboardAccess()
  const supabase = await createClient()

  const { data: planningRows } = await supabase
    .from('plannings')
    .select('id')
    .eq('group_id', groupId)

  const planningIds = ((planningRows ?? []) as { id: string }[]).map((p) => p.id)

  let sessionIds: string[] = []
  if (planningIds.length > 0) {
    const { data: sessionRows } = await supabase
      .from('sessions')
      .select('id')
      .in('planning_id', planningIds)
    sessionIds = ((sessionRows ?? []) as { id: string }[]).map((s) => s.id)
  }

  const baseQuery = supabase
    .from('dashboard_change_log')
    .select(
      `id, change_type, changed_at, is_reverted, previous_state, new_state,
       worker:worker_id(first_name, last_name),
       changer:changed_by(first_name, last_name),
       sessions(session_date, plannings(groups(name, schools(name)))),
       groups:group_id(name, schools(name))`
    )
    .order('changed_at', { ascending: false })
    .limit(100)

  const { data, error } = sessionIds.length > 0
    ? await baseQuery.or(`session_id.in.(${sessionIds.join(',')}),group_id.eq.${groupId}`)
    : await baseQuery.eq('group_id', groupId)

  if (error) throw new Error(error.message)

  type RawLogEntry = {
    id: string
    change_type: string
    changed_at: string
    is_reverted: boolean
    previous_state: unknown
    new_state: unknown
    worker: { first_name: string; last_name: string } | null
    changer: { first_name: string; last_name: string } | null
    sessions: {
      session_date: string
      plannings: {
        groups: { name: string; schools: { name: string } | null } | null
      } | null
    } | null
    groups: { name: string; schools: { name: string } | null } | null
  }

  return ((data ?? []) as unknown as RawLogEntry[]).map((entry) => {
    const sessionDate = entry.sessions?.session_date ?? ''
    const groupName =
      entry.sessions?.plannings?.groups?.name ?? entry.groups?.name ?? ''
    const schoolName =
      entry.sessions?.plannings?.groups?.schools?.name ??
      entry.groups?.schools?.name ??
      ''
    return {
      id: entry.id,
      sessionDate,
      groupName,
      schoolName,
      workerName: entry.worker
        ? `${entry.worker.first_name} ${entry.worker.last_name}`
        : '',
      changedByName: entry.changer
        ? `${entry.changer.first_name} ${entry.changer.last_name}`
        : '',
      changeType: entry.change_type,
      changedAt: entry.changed_at,
      isReverted: entry.is_reverted,
      isSessionChange: entry.sessions !== null,
    }
  })
}

// ─── revertChange ─────────────────────────────────────────────

export async function revertChange(changeId: string): Promise<void> {
  const changedBy = await assertDashboardAccess()
  const supabase = await createClient()

  // Get change record
  const { data: changeRaw, error: fetchError } = await supabase
    .from('dashboard_change_log')
    .select(
      'id, session_id, worker_id, change_type, previous_state, new_state, is_reverted, changed_at'
    )
    .eq('id', changeId)
    .single()

  if (fetchError || !changeRaw) throw new Error(fetchError?.message ?? 'Change not found')

  type ChangeRecord = {
    id: string
    session_id: string | null
    worker_id: string | null
    change_type: string
    previous_state: { assignment_id: string } | null
    new_state: { assignment_id: string; auto_absence_ids?: string[] } | null
    is_reverted: boolean
    changed_at: string
  }
  const change = changeRaw as unknown as ChangeRecord

  if (change.is_reverted) throw new Error('ALREADY_REVERTED')

  // Count subsequent non-reverted changes
  let countQuery = supabase
    .from('dashboard_change_log')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', change.session_id)
    .gt('changed_at', change.changed_at)
    .eq('is_reverted', false)

  if (change.worker_id) {
    countQuery = countQuery.eq('worker_id', change.worker_id)
  }

  const { count, error: countError } = await countQuery

  if (countError) throw new Error(countError.message)
  if ((count ?? 0) > 0) throw new Error(`BLOCKED:${count}`)

  // Apply revert
  if (change.change_type === 'substitute_add' || change.change_type === 'absent_mark') {
    if (!change.new_state?.assignment_id) throw new Error('Invalid log entry: missing new_state')
    const { error } = await supabase
      .from('session_teacher_assignments')
      .update({ is_active: false })
      .eq('id', change.new_state.assignment_id)
    if (error) throw new Error(error.message)
  } else if (
    change.change_type === 'substitute_remove' ||
    change.change_type === 'absent_unmark'
  ) {
    if (!change.previous_state?.assignment_id)
      throw new Error('Invalid log entry: missing previous_state')
    const { error } = await supabase
      .from('session_teacher_assignments')
      .update({ is_active: true })
      .eq('id', change.previous_state.assignment_id)
    if (error) throw new Error(error.message)
  }

  // Mark as reverted
  const { error: markError } = await supabase
    .from('dashboard_change_log')
    .update({ is_reverted: true })
    .eq('id', changeId)

  if (markError) throw new Error(markError.message)
}
