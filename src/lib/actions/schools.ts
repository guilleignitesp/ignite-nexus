'use server'

import { updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'

async function assertSchoolsAccess() {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!profile.isSuperAdmin && !profile.adminModules.includes('schools')) {
    throw new Error('Unauthorized')
  }
}

export async function createSchool(name: string): Promise<void> {
  await assertSchoolsAccess()
  const supabase = await createClient()
  const { error } = await supabase
    .from('schools')
    .insert({ name: name.trim(), is_active: true })
  if (error) throw new Error(error.message)
  updateTag('schools')
}

export async function updateSchoolTeam(
  schoolId: string,
  teamId: string | null
): Promise<void> {
  await assertSchoolsAccess()
  const supabase = await createClient()
  const { error } = await supabase
    .from('schools')
    .update({ team_id: teamId })
    .eq('id', schoolId)
  if (error) throw new Error(error.message)
  updateTag('schools')
}

export async function createGroup(input: {
  name: string
  ageRange?: string | null
  schoolId: string
  schoolYearId: string | null
  schedule: { weekday: number; start_time: string; end_time: string }[]
}): Promise<void> {
  await assertSchoolsAccess()
  const supabase = await createClient()

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: input.name.trim(),
      age_range: input.ageRange ?? null,
      school_id: input.schoolId,
      school_year_id: input.schoolYearId,
      is_active: true,
    })
    .select('id')
    .single()
  if (groupError) throw new Error(groupError.message)

  if (input.schedule.length > 0) {
    const { error: scheduleError } = await supabase.from('group_schedule').insert(
      input.schedule.map((s) => ({
        group_id: group.id,
        weekday: s.weekday,
        start_time: s.start_time,
        end_time: s.end_time,
      }))
    )
    if (scheduleError) throw new Error(scheduleError.message)
  }

  updateTag('schools')
}

function normName(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export async function searchStudentsForEnrollment(
  firstName: string,
  lastName: string,
  groupId: string
): Promise<{ id: string; firstName: string; lastName: string; status: 'active' | 'inactive'; alreadyEnrolled: boolean }[]> {
  await assertSchoolsAccess()
  const supabase = await createClient()

  const fn = firstName.trim()
  const ln = lastName.trim()
  if (!fn && !ln) return []

  // Parallel: school_id of target group + active enrollments in this specific group
  const [grpResult, enrolledResult] = await Promise.all([
    supabase.from('groups').select('school_id').eq('id', groupId).single(),
    supabase.from('group_enrollments').select('student_id').eq('group_id', groupId).eq('is_active', true),
  ])
  if (!grpResult.data) throw new Error('Group not found')

  const schoolId = (grpResult.data as unknown as { school_id: string }).school_id
  const enrolledIds = new Set(
    (enrolledResult.data ?? []).map((e: { student_id: string }) => e.student_id)
  )

  // All groups in this school
  const { data: schoolGroups } = await supabase
    .from('groups')
    .select('id')
    .eq('school_id', schoolId)
  const schoolGroupIds = (schoolGroups ?? []).map((g: { id: string }) => g.id)
  if (schoolGroupIds.length === 0) return []

  // All students ever enrolled in any school group (active or inactive), with student details
  const { data: rows, error } = await supabase
    .from('group_enrollments')
    .select('student_id, students!inner(id, first_name, last_name, status)')
    .in('group_id', schoolGroupIds)
  if (error) throw new Error(error.message)

  // Deduplicate by student id
  type RawRow = { student_id: string; students: { id: string; first_name: string; last_name: string; status: string } }
  const seen = new Set<string>()
  const candidates: { id: string; first_name: string; last_name: string; status: string }[] = []
  for (const row of (rows ?? []) as unknown as RawRow[]) {
    if (!row.students || seen.has(row.student_id)) continue
    seen.add(row.student_id)
    candidates.push(row.students)
  }

  // Accent-insensitive JS filter
  const normFn = fn ? normName(fn) : null
  const normLn = ln ? normName(ln) : null

  return candidates
    .filter((s) => {
      if (normFn && !normName(s.first_name).includes(normFn)) return false
      if (normLn && !normName(s.last_name).includes(normLn)) return false
      return true
    })
    .sort((a, b) => a.last_name.localeCompare(b.last_name))
    .map((s) => ({
      id: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      status: s.status as 'active' | 'inactive',
      alreadyEnrolled: enrolledIds.has(s.id),
    }))
}

export async function enrollStudentInGroup(
  groupId: string,
  studentId: string
): Promise<void> {
  await assertSchoolsAccess()
  const supabase = await createClient()

  // Already actively enrolled → no-op
  const { data: active } = await supabase
    .from('group_enrollments')
    .select('id')
    .eq('group_id', groupId)
    .eq('student_id', studentId)
    .eq('is_active', true)
    .maybeSingle()
  if (active) return

  // Reactivate existing inactive enrollment if present
  const { data: existing } = await supabase
    .from('group_enrollments')
    .select('id')
    .eq('group_id', groupId)
    .eq('student_id', studentId)
    .eq('is_active', false)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('group_enrollments')
      .update({ is_active: true, left_at: null, enrolled_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('group_enrollments').insert({
      group_id: groupId,
      student_id: studentId,
      is_active: true,
      enrolled_at: new Date().toISOString(),
    })
    if (error) throw new Error(error.message)
  }

  // Always ensure student is active after enrollment
  await supabase.from('students').update({ status: 'active' }).eq('id', studentId)

  updateTag('schools')
}

export async function unenrollStudentFromGroup(enrollmentId: string): Promise<void> {
  await assertSchoolsAccess()
  const supabase = await createClient()

  // Fetch student_id before deactivating
  const { data: enrollment, error: fetchErr } = await supabase
    .from('group_enrollments')
    .select('student_id')
    .eq('id', enrollmentId)
    .single()
  if (fetchErr || !enrollment) throw new Error(fetchErr?.message ?? 'Not found')

  // Deactivate enrollment
  const { error } = await supabase
    .from('group_enrollments')
    .update({ is_active: false, left_at: new Date().toISOString() })
    .eq('id', enrollmentId)
  if (error) throw new Error(error.message)

  // If no other active enrollments remain, mark student as inactive
  const { data: others } = await supabase
    .from('group_enrollments')
    .select('id')
    .eq('student_id', enrollment.student_id)
    .eq('is_active', true)
    .limit(1)
  if (!others || others.length === 0) {
    await supabase
      .from('students')
      .update({ status: 'inactive' })
      .eq('id', enrollment.student_id)
  }

  updateTag('schools')
}

export async function createAndEnrollStudent(input: {
  firstName: string
  lastName: string
  groupId: string
}): Promise<{ studentId: string }> {
  await assertSchoolsAccess()
  const supabase = await createClient()

  const { data: student, error: studentErr } = await supabase
    .from('students')
    .insert({
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      status: 'active',
    })
    .select('id')
    .single()
  if (studentErr || !student) throw new Error(studentErr?.message ?? 'Error creating student')

  const { error: enrollErr } = await supabase.from('group_enrollments').insert({
    group_id: input.groupId,
    student_id: student.id,
    is_active: true,
    enrolled_at: new Date().toISOString(),
  })
  if (enrollErr) throw new Error(enrollErr.message)

  updateTag('schools')
  return { studentId: student.id }
}

export async function adminUpdateSession(input: {
  sessionId: string
  status: string
  projectId: string | null
  trafficLight: string | null
  teacherComment: string | null
  excusedReason?: string | null
  attendances: { studentId: string; attended: boolean }[]
}): Promise<void> {
  await assertSchoolsAccess()
  const supabase = await createClient()

  const { error: updateErr } = await supabase
    .from('sessions')
    .update({
      status: input.status,
      project_id: input.projectId,
      traffic_light: input.trafficLight,
      teacher_comment: input.teacherComment,
      excused_reason: input.status === 'excused' ? (input.excusedReason ?? null) : null,
    })
    .eq('id', input.sessionId)
  if (updateErr) throw new Error(updateErr.message)

  if (input.attendances.length > 0) {
    const { error: attErr } = await supabase.from('session_attendances').upsert(
      input.attendances.map((a) => ({
        session_id: input.sessionId,
        student_id: a.studentId,
        attended: a.attended,
      })),
      { onConflict: 'session_id,student_id' }
    )
    if (attErr) throw new Error(attErr.message)
  }

  updateTag('schools')
}

export async function deleteSession(sessionId: string): Promise<void> {
  await assertSchoolsAccess()
  const supabase = await createClient()
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId)
  if (error) throw new Error(error.message)
  updateTag('schools')
}

export async function createGroupPlanning(
  groupId: string,
  projectMapId: string
): Promise<void> {
  await assertSchoolsAccess()
  const supabase = await createClient()

  // Deactivate any existing active planning
  await supabase
    .from('plannings')
    .update({ is_active: false })
    .eq('group_id', groupId)
    .eq('is_active', true)

  const { error } = await supabase.from('plannings').insert({
    group_id: groupId,
    project_map_id: projectMapId,
    is_active: true,
  })
  if (error) throw new Error(error.message)

  updateTag('schools')
}

export async function getSessionEvaluationForAdmin(
  sessionId: string,
): Promise<{
  projectId: string
  planningId: string
  hasEvaluation: boolean
  existingEvals: { studentId: string; skills: { skillId: string; xpAwarded: number }[] }[]
}> {
  await assertSchoolsAccess()
  const supabase = await createClient()

  const { data: sessionRow, error: sessErr } = await supabase
    .from('sessions')
    .select('project_id, planning_id')
    .eq('id', sessionId)
    .single()

  if (sessErr || !sessionRow) throw new Error(sessErr?.message ?? 'Session not found')

  type SessionInfo = { project_id: string | null; planning_id: string }
  const { project_id: projectId, planning_id: planningId } = sessionRow as unknown as SessionInfo

  if (!projectId) return { projectId: '', planningId, hasEvaluation: false, existingEvals: [] }

  const { data: logRow } = await supabase
    .from('planning_project_log')
    .select('id')
    .eq('planning_id', planningId)
    .eq('project_id', projectId)
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!logRow) return { projectId, planningId, hasEvaluation: false, existingEvals: [] }

  const logId = (logRow as { id: string }).id

  const { data: evalsData } = await supabase
    .from('project_evaluations')
    .select('student_id, skill_evaluations(skill_id, xp_awarded)')
    .eq('planning_project_log_id', logId)

  type EvalRow = { student_id: string; skill_evaluations: { skill_id: string; xp_awarded: number }[] }
  const evals = (evalsData ?? []) as unknown as EvalRow[]

  if (evals.length === 0) return { projectId, planningId, hasEvaluation: false, existingEvals: [] }

  return {
    projectId,
    planningId,
    hasEvaluation: true,
    existingEvals: evals.map((e) => ({
      studentId: e.student_id,
      skills: (e.skill_evaluations ?? []).map((se) => ({
        skillId: se.skill_id,
        xpAwarded: se.xp_awarded,
      })),
    })),
  }
}

export async function getSessionAttendancesForAdmin(
  sessionId: string,
): Promise<{ studentId: string; firstName: string; lastName: string; attended: boolean }[]> {
  await assertSchoolsAccess()
  const supabase = await createClient()

  const { data: sessInfo } = await supabase
    .from('sessions')
    .select('session_date, plannings(group_id)')
    .eq('id', sessionId)
    .single()

  type SessInfo = { session_date: string; plannings: { group_id: string } | null }
  const rawSessionDate = (sessInfo as unknown as SessInfo)?.session_date
  const sessionDate = rawSessionDate ? rawSessionDate.slice(0, 10) : null
  if (!sessionDate) throw new Error('Session not found')
  const groupId = (sessInfo as unknown as SessInfo)?.plannings?.group_id
  if (!groupId) throw new Error('Group not found')

  const [attendanceResult, enrollmentResult] = await Promise.all([
    supabase
      .from('session_attendances')
      .select('student_id, attended')
      .eq('session_id', sessionId),
    supabase
      .from('group_enrollments')
      .select('student_id, students(id, first_name, last_name)')
      .eq('group_id', groupId)
      .lte('enrolled_at', `${sessionDate}T23:59:59`)
      .or(`left_at.is.null,left_at.gte.${sessionDate}`),
  ])

  const attendanceMap = new Map<string, boolean>(
    ((attendanceResult.data ?? []) as { student_id: string; attended: boolean }[]).map((a) => [
      a.student_id,
      a.attended,
    ])
  )

  return ((enrollmentResult.data ?? []) as unknown as {
    student_id: string
    students: { id: string; first_name: string; last_name: string } | null
  }[])
    .filter((r) => r.students)
    .map((r) => ({
      studentId: r.student_id,
      firstName: r.students!.first_name,
      lastName: r.students!.last_name,
      attended: attendanceMap.get(r.student_id) ?? false,
    }))
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
}

export async function deleteProjectEvaluation(sessionId: string): Promise<void> {
  await assertSchoolsAccess()
  const supabase = await createClient()

  // Step 1: session → project_id + planning_id
  const { data: sess, error: sessErr } = await supabase
    .from('sessions')
    .select('project_id, planning_id')
    .eq('id', sessionId)
    .single()
  if (sessErr || !sess) throw new Error(sessErr?.message ?? 'Session not found')

  type SessRow = { project_id: string | null; planning_id: string }
  const { project_id: projectId, planning_id: planningId } = sess as unknown as SessRow
  if (!projectId) throw new Error('Session has no project')

  // Step 2: find planning_project_log
  const { data: logRow } = await supabase
    .from('planning_project_log')
    .select('id')
    .eq('planning_id', planningId)
    .eq('project_id', projectId)
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!logRow) return
  const logId = (logRow as { id: string }).id

  // Step 3: fetch all project_evaluations with skill_evaluations
  const { data: evalsData, error: evalsErr } = await supabase
    .from('project_evaluations')
    .select('id, student_id, skill_evaluations(skill_id, xp_awarded)')
    .eq('planning_project_log_id', logId)
  if (evalsErr) throw new Error(evalsErr.message)

  type EvalWithSkills = {
    id: string
    student_id: string
    skill_evaluations: { skill_id: string; xp_awarded: number }[]
  }
  const evals = (evalsData ?? []) as unknown as EvalWithSkills[]

  // Step 4: reverse XP for each student/skill
  for (const ev of evals) {
    for (const se of ev.skill_evaluations ?? []) {
      const { data: xpRow } = await supabase
        .from('student_xp')
        .select('academic_xp')
        .eq('student_id', ev.student_id)
        .eq('skill_id', se.skill_id)
        .maybeSingle()

      const current = (xpRow as { academic_xp: number } | null)?.academic_xp ?? 0
      const newAcademic = Math.max(0, current - se.xp_awarded)
      await supabase
        .from('student_xp')
        .upsert(
          { student_id: ev.student_id, skill_id: se.skill_id, academic_xp: newAcademic, total_xp: newAcademic },
          { onConflict: 'student_id,skill_id' }
        )
    }
  }

  // Steps 5-6: delete project_evaluations — skill_evaluations cascade automatically
  // (skill_evaluations.evaluation_id FK has ON DELETE CASCADE)
  const { error: evalDelErr } = await supabase
    .from('project_evaluations')
    .delete()
    .eq('planning_project_log_id', logId)
  if (evalDelErr) throw new Error(evalDelErr.message)

  // Step 7: delete planning_project_log — no cascade from this FK, must delete after evaluations
  const { error: logDelErr } = await supabase
    .from('planning_project_log')
    .delete()
    .eq('id', logId)
  if (logDelErr) throw new Error(logDelErr.message)
}

export async function getGroupEnrollmentHistory(
  groupId: string,
): Promise<{ id: string; studentId: string; firstName: string; lastName: string; enrolledAt: string; leftAt: string | null; isActive: boolean }[]> {
  await assertSchoolsAccess()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('group_enrollments')
    .select('id, enrolled_at, left_at, is_active, students(id, first_name, last_name)')
    .eq('group_id', groupId)
    .order('enrolled_at', { ascending: false })

  if (error) throw new Error(error.message)

  type RawRow = {
    id: string
    enrolled_at: string
    left_at: string | null
    is_active: boolean
    students: { id: string; first_name: string; last_name: string } | null
  }

  return ((data ?? []) as unknown as RawRow[])
    .filter((r) => r.students)
    .map((r) => ({
      id: r.id,
      studentId: r.students!.id,
      firstName: r.students!.first_name,
      lastName: r.students!.last_name,
      enrolledAt: r.enrolled_at,
      leftAt: r.left_at,
      isActive: r.is_active,
    }))
}

export async function deactivateGroup(
  groupId: string
): Promise<{ deactivatedEnrollments: number; deactivatedAssignments: number }> {
  await assertSchoolsAccess()
  const supabase = await createClient()

  // Find last session date for this group via its plannings
  const { data: plannings } = await supabase
    .from('plannings')
    .select('id')
    .eq('group_id', groupId)
  const planningIds = (plannings ?? []).map((p: { id: string }) => p.id)
  let lastSessionDate: string
  if (planningIds.length > 0) {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('session_date')
      .in('planning_id', planningIds)
      .order('session_date', { ascending: false })
      .limit(1)
    lastSessionDate =
      (sessions?.[0] as unknown as { session_date: string } | undefined)?.session_date ??
      new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  } else {
    lastSessionDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  }

  // Deactivate all active enrollments
  const { data: activeEnrollments } = await supabase
    .from('group_enrollments')
    .select('id, student_id')
    .eq('group_id', groupId)
    .eq('is_active', true)
  const enrollments = (activeEnrollments ?? []) as { id: string; student_id: string }[]

  if (enrollments.length > 0) {
    await supabase
      .from('group_enrollments')
      .update({ is_active: false, left_at: new Date().toISOString() })
      .in('id', enrollments.map((e) => e.id))

    for (const e of enrollments) {
      const { data: others } = await supabase
        .from('group_enrollments')
        .select('id')
        .eq('student_id', e.student_id)
        .eq('is_active', true)
        .limit(1)
      if (!others || others.length === 0) {
        await supabase.from('students').update({ status: 'inactive' }).eq('id', e.student_id)
      }
    }
  }

  // Deactivate all active open-ended assignments
  const { data: activeAssignments } = await supabase
    .from('group_assignments')
    .select('id, worker_id')
    .eq('group_id', groupId)
    .eq('is_active', true)
    .is('end_date', null)
  const assignments = (activeAssignments ?? []) as { id: string; worker_id: string }[]

  if (assignments.length > 0) {
    const { data: authData } = await supabase.auth.getUser()
    const changedBy = authData?.user?.id ?? ''

    await supabase
      .from('group_assignments')
      .update({ end_date: lastSessionDate, is_active: false })
      .in('id', assignments.map((a) => a.id))

    for (const a of assignments) {
      await supabase.from('dashboard_change_log').insert({
        session_id: null,
        group_id: groupId,
        worker_id: a.worker_id,
        changed_by: changedBy,
        change_type: 'permanent_remove',
        previous_state: { assignment_id: a.id },
      })
    }
  }

  const { error } = await supabase.from('groups').update({ is_active: false }).eq('id', groupId)
  if (error) throw new Error(error.message)

  updateTag('schools')
  return { deactivatedEnrollments: enrollments.length, deactivatedAssignments: assignments.length }
}

export async function activateGroup(groupId: string): Promise<void> {
  await assertSchoolsAccess()
  const supabase = await createClient()
  const { error } = await supabase.from('groups').update({ is_active: true }).eq('id', groupId)
  if (error) throw new Error(error.message)
  updateTag('schools')
}

export async function updateGroupInfo(
  groupId: string,
  data: { name?: string; ageRange?: string | null }
): Promise<void> {
  await assertSchoolsAccess()
  const supabase = await createClient()
  const updates: Record<string, unknown> = {}
  if (data.name !== undefined) updates.name = data.name.trim()
  if (data.ageRange !== undefined) updates.age_range = data.ageRange ?? null
  if (Object.keys(updates).length === 0) return
  const { error } = await supabase.from('groups').update(updates).eq('id', groupId)
  if (error) throw new Error(error.message)
  updateTag('schools')
}

export async function updateGroupSchedule(
  groupId: string,
  slots: { id?: string; weekday: number; startTime: string; endTime: string }[]
): Promise<{ assignmentsCleared: number; warning: boolean }> {
  await assertSchoolsAccess()
  const supabase = await createClient()

  // Compare existing vs incoming to determine deletes/updates/inserts
  const { data: existing } = await supabase
    .from('group_schedule')
    .select('id')
    .eq('group_id', groupId)
  const existingIds = new Set((existing ?? []).map((s: { id: string }) => s.id))
  const incomingIds = new Set(slots.filter((s) => s.id).map((s) => s.id!))

  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id))
  if (toDelete.length > 0) {
    await supabase.from('group_schedule').delete().in('id', toDelete)
  }

  for (const slot of slots.filter((s) => s.id && existingIds.has(s.id!))) {
    await supabase
      .from('group_schedule')
      .update({ weekday: slot.weekday, start_time: slot.startTime, end_time: slot.endTime })
      .eq('id', slot.id!)
  }

  const toInsert = slots.filter((s) => !s.id)
  if (toInsert.length > 0) {
    await supabase.from('group_schedule').insert(
      toInsert.map((s) => ({
        group_id: groupId,
        weekday: s.weekday,
        start_time: s.startTime,
        end_time: s.endTime,
      }))
    )
  }

  // Clear open-ended assignments when schedule changes
  const { data: activeAssignments } = await supabase
    .from('group_assignments')
    .select('id, worker_id')
    .eq('group_id', groupId)
    .eq('is_active', true)
    .is('end_date', null)
  const assignments = (activeAssignments ?? []) as { id: string; worker_id: string }[]
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  if (assignments.length > 0) {
    const { data: authData } = await supabase.auth.getUser()
    const changedBy = authData?.user?.id ?? ''

    await supabase
      .from('group_assignments')
      .update({ end_date: yesterday, is_active: false })
      .in('id', assignments.map((a) => a.id))

    for (const a of assignments) {
      await supabase.from('dashboard_change_log').insert({
        session_id: null,
        group_id: groupId,
        worker_id: a.worker_id,
        changed_by: changedBy,
        change_type: 'permanent_remove',
        previous_state: { assignment_id: a.id },
      })
    }
  }

  updateTag('schools')
  return { assignmentsCleared: assignments.length, warning: assignments.length > 0 }
}
