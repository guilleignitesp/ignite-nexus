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

export async function searchStudentsForEnrollment(
  query: string,
  groupId: string
): Promise<{ id: string; firstName: string; lastName: string }[]> {
  await assertSchoolsAccess()
  const supabase = await createClient()

  const trimmed = query.trim()
  if (!trimmed) return []

  // Get currently enrolled student IDs for this group
  const { data: enrolled } = await supabase
    .from('group_enrollments')
    .select('student_id')
    .eq('group_id', groupId)
    .eq('is_active', true)

  const enrolledIds = (enrolled ?? []).map((e: { student_id: string }) => e.student_id)

  let q = supabase
    .from('students')
    .select('id, first_name, last_name')
    .eq('status', 'active')
    .or(`first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%`)
    .order('last_name')
    .limit(10)

  if (enrolledIds.length > 0) {
    q = q.not('id', 'in', `(${enrolledIds.join(',')})`)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)

  return (data ?? []).map((s: { id: string; first_name: string; last_name: string }) => ({
    id: s.id,
    firstName: s.first_name,
    lastName: s.last_name,
  }))
}

export async function enrollStudentInGroup(
  groupId: string,
  studentId: string
): Promise<void> {
  await assertSchoolsAccess()
  const supabase = await createClient()

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

  updateTag('schools')
}

export async function unenrollStudentFromGroup(enrollmentId: string): Promise<void> {
  await assertSchoolsAccess()
  const supabase = await createClient()

  const { error } = await supabase
    .from('group_enrollments')
    .update({ is_active: false, left_at: new Date().toISOString() })
    .eq('id', enrollmentId)
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
