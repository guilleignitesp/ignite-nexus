'use server'

import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'
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
}): Promise<{ sessionId: string }> {
  await assertTeacherOwnsGroup(input.groupId)

  const today = new Date().toISOString().slice(0, 10)
  const supabase = await createClient()

  // Upsert — no-op si ya existe (unique index planning_id + session_date)
  const { data: session, error: sErr } = await supabase
    .from('sessions')
    .upsert(
      {
        planning_id: input.planningId,
        project_id: input.projectId,
        session_date: today,
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
}): Promise<void> {
  await assertTeacherOwnsGroup(input.groupId)

  const supabase = await createClient()

  // Actualizar comentario del profesor
  const { error: sErr } = await supabase
    .from('sessions')
    .update({ teacher_comment: input.teacherComment || null })
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
  const workerId = await assertTeacherOwnsGroup(input.groupId)
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

  // 3. Si el proyecto se ha completado y se eligió el siguiente, crear log entry
  if (input.projectCompleted && input.nextProjectId) {
    const { error: lErr } = await supabase
      .from('planning_project_log')
      .insert({
        planning_id: input.planningId,
        project_id: input.nextProjectId,
        assigned_by: workerId,
        status: 'pending',
      })
    if (lErr) throw new Error(lErr.message)
  }
}

// ─── getSessionAttendances (carga lazy para historial) ─────────────────────

export async function getSessionAttendances(
  sessionId: string,
  groupId: string
): Promise<{ studentId: string; firstName: string; lastName: string; attended: boolean }[]> {
  await assertTeacherOwnsGroup(groupId)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('session_attendances')
    .select('student_id, attended, students(id, first_name, last_name)')
    .eq('session_id', sessionId)

  if (error) throw new Error(error.message)

  return ((data ?? []) as unknown as {
    student_id: string
    attended: boolean
    students: { id: string; first_name: string; last_name: string } | null
  }[])
    .filter((r) => r.students)
    .map((r) => ({
      studentId: r.student_id,
      firstName: r.students!.first_name,
      lastName: r.students!.last_name,
      attended: r.attended,
    }))
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
}
