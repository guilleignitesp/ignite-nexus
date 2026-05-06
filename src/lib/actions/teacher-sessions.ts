'use server'

import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'
import { calcXP } from '@/lib/data/projects'
import type { TrafficLight } from '@/types'

// ─── Guard de autorización ─────────────────────────────────────────────────

async function assertTeacherOwnsGroup(groupId: string): Promise<string> {
  const profile = await getUserProfile()
  if (!profile?.workerId) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { data } = await supabase
    .from('group_assignments')
    .select('worker_id')
    .eq('worker_id', profile.workerId)
    .eq('group_id', groupId)
    .is('end_date', null)
    .maybeSingle()

  if (!data) throw new Error('Unauthorized')
  return profile.workerId
}

// ─── createTodaySession ────────────────────────────────────────────────────

export async function createTodaySession(input: {
  groupId: string
  planningId: string
  projectId: string | null
  startTime: string
  endTime: string
  studentIds: string[]
  sessionDate?: string
}): Promise<{ sessionId: string }> {
  await assertTeacherOwnsGroup(input.groupId)

  const sessionDate = input.sessionDate ?? new Date().toISOString().slice(0, 10)
  const supabase = await createClient()

  let resolvedProjectId = input.projectId
  if (!resolvedProjectId) {
    const { data: lastSession } = await supabase
      .from('sessions')
      .select('project_id')
      .eq('planning_id', input.planningId)
      .eq('status', 'completed')
      .not('project_id', 'is', null)
      .order('session_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    resolvedProjectId = (lastSession as { project_id: string } | null)?.project_id ?? null
  }

  // Upsert — no-op si ya existe (unique index planning_id + session_date)
  const { data: session, error: sErr } = await supabase
    .from('sessions')
    .upsert(
      {
        planning_id: input.planningId,
        project_id: resolvedProjectId,
        session_date: sessionDate,
        start_time: input.startTime,
        end_time: input.endTime,
        status: 'pending',
      },
      { onConflict: 'planning_id,session_date', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (sErr || !session) throw new Error(sErr?.message ?? 'Error creating session')

  // Crear registros de asistencia para todos los alumnos matriculados (default: presente)
  if (input.studentIds.length > 0) {
    const attendances = input.studentIds.map((sid) => ({
      session_id: session.id,
      student_id: sid,
      attended: true,
    }))
    const { error: aErr } = await supabase
      .from('session_attendances')
      .upsert(attendances, { onConflict: 'session_id,student_id', ignoreDuplicates: true })
    if (aErr) throw new Error(aErr.message)
  }

  return { sessionId: session.id }
}

// ─── saveSession ───────────────────────────────────────────────────────────

export async function saveSession(input: {
  sessionId: string
  groupId: string
  teacherComment: string | null
  attendances: { studentId: string; attended: boolean }[]
  trafficLight?: TrafficLight
}): Promise<void> {
  await assertTeacherOwnsGroup(input.groupId)

  const supabase = await createClient()

  // Actualizar sesión (comentario + semáforo opcional)
  const { error: sErr } = await supabase
    .from('sessions')
    .update({
      teacher_comment: input.teacherComment || null,
      ...(input.trafficLight !== undefined && { traffic_light: input.trafficLight }),
    })
    .eq('id', input.sessionId)

  if (sErr) throw new Error(sErr.message)

  // Upsert asistencias
  if (input.attendances.length > 0) {
    const rows = input.attendances.map((a) => ({
      session_id: input.sessionId,
      student_id: a.studentId,
      attended: a.attended,
    }))
    const { error: aErr } = await supabase
      .from('session_attendances')
      .upsert(rows, { onConflict: 'session_id,student_id' })
    if (aErr) throw new Error(aErr.message)
  }
}

// ─── finalizeSession ───────────────────────────────────────────────────────

export async function finalizeSession(input: {
  sessionId: string
  groupId: string
  planningId: string
  trafficLight: TrafficLight
  teacherComment: string | null
  attendances: { studentId: string; attended: boolean }[]
  projectCompleted: boolean
  nextProjectId: string | null
}): Promise<void> {
  await assertTeacherOwnsGroup(input.groupId)
  const supabase = await createClient()

  // 1. Actualizar la sesión: completada + semáforo + comentario + consolidación
  const { error: sErr } = await supabase
    .from('sessions')
    .update({
      status: 'completed',
      traffic_light: input.trafficLight,
      teacher_comment: input.teacherComment || null,
      is_consolidated: true,
      consolidated_at: new Date().toISOString(),
    })
    .eq('id', input.sessionId)

  if (sErr) throw new Error(sErr.message)

  // 2. Guardar asistencias definitivas
  if (input.attendances.length > 0) {
    const rows = input.attendances.map((a) => ({
      session_id: input.sessionId,
      student_id: a.studentId,
      attended: a.attended,
    }))
    const { error: aErr } = await supabase
      .from('session_attendances')
      .upsert(rows, { onConflict: 'session_id,student_id' })
    if (aErr) throw new Error(aErr.message)
  }
  // planning_project_log is now created by submitProjectEvaluation
}

// ─── getProjectSkillsForEvaluation ────────────────────────────────────────

export async function getProjectSkillsForEvaluation(
  projectId: string,
  planningId: string
): Promise<{
  skills: { skillId: string; name_es: string; branch_color: string; rank: number; baseXp: number }[]
  students: { studentId: string; firstName: string; lastName: string }[]
}> {
  const supabase = await createClient()

  const [skillsResult, sessionsResult] = await Promise.all([
    supabase
      .from('project_skills')
      .select('skill_id, rank, skills(name_es, branches(color))')
      .eq('project_id', projectId),
    supabase
      .from('sessions')
      .select('id')
      .eq('planning_id', planningId)
      .eq('project_id', projectId),
  ])

  if (skillsResult.error) throw new Error(skillsResult.error.message)

  type RawProjectSkill = {
    skill_id: string
    rank: number | null
    skills: { name_es: string; branches: { color: string } | null } | null
  }

  const skills = ((skillsResult.data ?? []) as unknown as RawProjectSkill[]).map((ps) => {
    const rank = ps.rank ?? 1
    return {
      skillId: ps.skill_id,
      name_es: ps.skills?.name_es ?? '',
      branch_color: ps.skills?.branches?.color ?? '#000000',
      rank,
      baseXp: calcXP(rank),
    }
  })

  const sessionIds = ((sessionsResult.data ?? []) as { id: string }[]).map((s) => s.id)

  if (sessionIds.length === 0) return { skills, students: [] }

  const { data: attendancesData, error: attErr } = await supabase
    .from('session_attendances')
    .select('student_id, students(id, first_name, last_name)')
    .eq('attended', true)
    .in('session_id', sessionIds)

  if (attErr) throw new Error(attErr.message)

  type RawAttendance = {
    student_id: string
    students: { id: string; first_name: string; last_name: string } | null
  }

  const seen = new Set<string>()
  const students: { studentId: string; firstName: string; lastName: string }[] = []
  for (const row of (attendancesData ?? []) as unknown as RawAttendance[]) {
    if (!row.students || seen.has(row.student_id)) continue
    seen.add(row.student_id)
    students.push({
      studentId: row.student_id,
      firstName: row.students.first_name,
      lastName: row.students.last_name,
    })
  }
  students.sort((a, b) => a.lastName.localeCompare(b.lastName))

  return { skills, students }
}

// ─── submitProjectEvaluation ──────────────────────────────────────────────

export async function submitProjectEvaluation(input: {
  planningId: string
  projectId: string
  groupId: string
  sessionId: string
  nextProjectId: string | null
  evaluations: {
    studentId: string
    skills: { skillId: string; xpAwarded: number }[]
  }[]
}): Promise<void> {
  const workerId = await assertTeacherOwnsGroup(input.groupId)
  const supabase = await createClient()

  // Find the planning_project_log for the current project in this planning
  const { data: logRow } = await supabase
    .from('planning_project_log')
    .select('id')
    .eq('planning_id', input.planningId)
    .eq('project_id', input.projectId)
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const logId = logRow ? (logRow as { id: string }).id : null

  // Batch-fetch existing student_xp for all students
  const allStudentIds = input.evaluations.map((e) => e.studentId)
  const { data: existingXp } = await supabase
    .from('student_xp')
    .select('student_id, skill_id, academic_xp, attitude_xp')
    .in('student_id', allStudentIds)

  type XpRow = { student_id: string; skill_id: string; academic_xp: number; attitude_xp: number }
  const xpMap = new Map<string, XpRow>()
  for (const row of (existingXp ?? []) as XpRow[]) {
    xpMap.set(`${row.student_id}:${row.skill_id}`, row)
  }

  const xpUpserts: { student_id: string; skill_id: string; academic_xp: number; attitude_xp: number; total_xp: number }[] = []

  for (const ev of input.evaluations) {
    if (logId) {
      const { data: evalRow, error: evalErr } = await supabase
        .from('project_evaluations')
        .upsert(
          {
            planning_project_log_id: logId,
            student_id: ev.studentId,
            project_id: input.projectId,
            worker_id: workerId,
            xp_multiplier_pct: 100,
          },
          { onConflict: 'planning_project_log_id,student_id' }
        )
        .select('id')
        .single()
      if (evalErr) throw new Error(evalErr.message)

      const evaluationId = (evalRow as { id: string }).id
      await supabase.from('skill_evaluations').delete().eq('evaluation_id', evaluationId)

      if (ev.skills.length > 0) {
        const { error: seErr } = await supabase.from('skill_evaluations').insert(
          ev.skills.map((sk) => ({
            evaluation_id: evaluationId,
            skill_id: sk.skillId,
            xp_awarded: sk.xpAwarded,
          }))
        )
        if (seErr) throw new Error(seErr.message)
      }
    }

    for (const sk of ev.skills) {
      const key = `${ev.studentId}:${sk.skillId}`
      const existing = xpMap.get(key)
      const prevAcademic = existing?.academic_xp ?? 0
      const prevAttitude = existing?.attitude_xp ?? 0
      const newAcademic = prevAcademic + sk.xpAwarded
      xpUpserts.push({
        student_id: ev.studentId,
        skill_id: sk.skillId,
        academic_xp: newAcademic,
        attitude_xp: prevAttitude,
        total_xp: newAcademic + prevAttitude,
      })
    }
  }

  if (xpUpserts.length > 0) {
    const { error: xpErr } = await supabase
      .from('student_xp')
      .upsert(xpUpserts, { onConflict: 'student_id,skill_id' })
    if (xpErr) throw new Error(xpErr.message)
  }

  if (input.nextProjectId) {
    const { error: lErr } = await supabase.from('planning_project_log').insert({
      planning_id: input.planningId,
      project_id: input.nextProjectId,
      assigned_by: workerId,
      status: 'pending',
    })
    if (lErr) throw new Error(lErr.message)
  }
}

// ─── markSessionUnknown ───────────────────────────────────────────────────

export async function markSessionUnknown(
  sessionId: string,
  groupId: string
): Promise<void> {
  await assertTeacherOwnsGroup(groupId)
  const supabase = await createClient()
  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'unknown',
      is_consolidated: true,
      consolidated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
  if (error) throw new Error(error.message)
}

// ─── markSessionExcused ───────────────────────────────────────────────────

export async function markSessionExcused(
  sessionId: string,
  groupId: string
): Promise<void> {
  await assertTeacherOwnsGroup(groupId)
  const supabase = await createClient()
  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'excused',
      is_consolidated: true,
      consolidated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
  if (error) throw new Error(error.message)
}

// ─── getProjectDetails (carga lazy de info del proyecto activo) ───────────

function parseTimeToHours(t: string): number {
  const [h, m, s] = t.split(':').map(Number)
  return h + m / 60 + (s || 0) / 3600
}

export async function getProjectDetails(
  projectId: string,
  planningId: string
): Promise<{
  description: string | null
  resources: { title: string; url: string; type: string }[]
  recommendedHours: number | null
  sessionNumber: number
  hoursLogged: number
} | null> {
  const supabase = await createClient()

  const [projectResult, sessionsResult] = await Promise.all([
    supabase
      .from('projects')
      .select('recommended_hours, description, project_resources(title, url, type)')
      .eq('id', projectId)
      .maybeSingle(),
    supabase
      .from('sessions')
      .select('start_time, end_time')
      .eq('planning_id', planningId)
      .eq('project_id', projectId)
      .eq('status', 'completed'),
  ])

  if (projectResult.error || !projectResult.data) return null

  const raw = projectResult.data as unknown as {
    recommended_hours: string | number | null
    description: string | null
    project_resources: { title: string; url: string; type: string }[]
  }

  const completedSessions = (sessionsResult.data ?? []) as unknown as {
    start_time: string
    end_time: string
  }[]

  const hoursLogged = completedSessions.reduce((sum, s) => {
    return sum + Math.max(0, parseTimeToHours(s.end_time) - parseTimeToHours(s.start_time))
  }, 0)

  return {
    description: raw.description,
    resources: raw.project_resources ?? [],
    recommendedHours: raw.recommended_hours != null ? Number(raw.recommended_hours) : null,
    sessionNumber: completedSessions.length + 1,
    hoursLogged,
  }
}

// ─── getSessionEvaluation ─────────────────────────────────────────────────

export async function getSessionEvaluation(
  sessionId: string,
  groupId: string
): Promise<{
  projectId: string
  planningId: string
  hasEvaluation: boolean
  existingEvals: { studentId: string; skills: { skillId: string; xpAwarded: number }[] }[]
}> {
  await assertTeacherOwnsGroup(groupId)
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

// ─── updateProjectEvaluation ──────────────────────────────────────────────

export async function updateProjectEvaluation(input: {
  planningId: string
  projectId: string
  groupId: string
  sessionId: string
  evaluations: { studentId: string; skills: { skillId: string; xpAwarded: number }[] }[]
}): Promise<void> {
  await assertTeacherOwnsGroup(input.groupId)
  const supabase = await createClient()

  const { data: logRow } = await supabase
    .from('planning_project_log')
    .select('id')
    .eq('planning_id', input.planningId)
    .eq('project_id', input.projectId)
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!logRow) return

  const logId = (logRow as { id: string }).id

  for (const ev of input.evaluations) {
    const { data: evalRow } = await supabase
      .from('project_evaluations')
      .select('id')
      .eq('planning_project_log_id', logId)
      .eq('student_id', ev.studentId)
      .maybeSingle()

    if (!evalRow) continue

    const evaluationId = (evalRow as { id: string }).id

    const { data: existingSEs } = await supabase
      .from('skill_evaluations')
      .select('skill_id, xp_awarded')
      .eq('evaluation_id', evaluationId)

    type ExistingSE = { skill_id: string; xp_awarded: number }
    const oldXpMap = new Map<string, number>()
    for (const se of (existingSEs ?? []) as ExistingSE[]) {
      oldXpMap.set(se.skill_id, se.xp_awarded)
    }

    for (const sk of ev.skills) {
      const diff = sk.xpAwarded - (oldXpMap.get(sk.skillId) ?? 0)
      if (diff === 0) continue

      const { data: xpRow } = await supabase
        .from('student_xp')
        .select('academic_xp, attitude_xp')
        .eq('student_id', ev.studentId)
        .eq('skill_id', sk.skillId)
        .maybeSingle()

      type XpRow = { academic_xp: number; attitude_xp: number }
      const existing = xpRow as XpRow | null
      const newAcademic = (existing?.academic_xp ?? 0) + diff
      const newTotal = newAcademic + (existing?.attitude_xp ?? 0)

      await supabase
        .from('student_xp')
        .upsert(
          { student_id: ev.studentId, skill_id: sk.skillId, academic_xp: newAcademic, total_xp: newTotal },
          { onConflict: 'student_id,skill_id' }
        )
    }

    await supabase.from('skill_evaluations').delete().eq('evaluation_id', evaluationId)

    if (ev.skills.length > 0) {
      await supabase.from('skill_evaluations').insert(
        ev.skills.map((sk) => ({
          evaluation_id: evaluationId,
          skill_id: sk.skillId,
          xp_awarded: sk.xpAwarded,
        }))
      )
    }
  }
}

// ─── getSessionAttendances (carga lazy para historial) ─────────────────────

export async function getSessionAttendances(
  sessionId: string,
  groupId: string
): Promise<{ studentId: string; firstName: string; lastName: string; attended: boolean }[]> {
  await assertTeacherOwnsGroup(groupId)

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
  const resolvedGroupId = (sessInfo as unknown as SessInfo)?.plannings?.group_id ?? groupId

  const [attendanceResult, enrollmentResult] = await Promise.all([
    supabase
      .from('session_attendances')
      .select('student_id, attended')
      .eq('session_id', sessionId),
    supabase
      .from('group_enrollments')
      .select('student_id, students(id, first_name, last_name)')
      .eq('group_id', resolvedGroupId)
      .lte('enrolled_at', `${sessionDate}T23:59:59`)
      .or(`left_at.is.null,left_at.gte.${sessionDate}`),
  ])

  console.log('[getSessionAttendances]', {
    sessionDate,
    resolvedGroupId,
    enrollmentRows: enrollmentResult.data?.length ?? 'ERROR',
    enrollmentError: enrollmentResult.error?.message,
    attendanceRows: attendanceResult.data?.length ?? 'ERROR',
  })

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
      attended: attendanceMap.get(r.student_id) ?? true,
    }))
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
}
