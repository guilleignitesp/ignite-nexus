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

export async function createGroup(input: {
  name: string
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
