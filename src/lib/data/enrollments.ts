import { createClient } from '@/lib/supabase-server'
import { unstable_cache } from 'next/cache'
import { createClient as createPublicClient } from '@supabase/supabase-js'

export const ACTIVITY_LIMIT = 50

export interface EnrollmentStats {
  totalActive: number
  recentEnrollments30d: number
  recentLeaves30d: number
  bySchool: Array<{
    schoolId: string
    schoolName: string
    activeStudents: number
  }>
}

export interface EnrollmentEvent {
  id: string
  date: string
  student_first: string
  student_last: string
  group_name: string
  school_name: string
}

export interface ActiveGroupItem {
  id: string
  name: string
  school_id: string
  school_name: string
}

export async function getEnrollmentStats(): Promise<EnrollmentStats> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_enrollment_stats')
  if (error) throw new Error(error.message)

  const raw = data as {
    total_active: number
    recent_enrollments: number
    recent_leaves: number
    by_school: Array<{ school_id: string; school_name: string; active_students: number }>
  }

  return {
    totalActive: raw.total_active,
    recentEnrollments30d: raw.recent_enrollments,
    recentLeaves30d: raw.recent_leaves,
    bySchool: (raw.by_school ?? []).map((s) => ({
      schoolId: s.school_id,
      schoolName: s.school_name,
      activeStudents: s.active_students,
    })),
  }
}

export async function getRecentEnrollments(limit: number): Promise<EnrollmentEvent[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('group_enrollments')
    .select('id, enrolled_at, students(first_name, last_name), groups(name, schools(name))')
    .order('enrolled_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []).map((r: any) => ({
    id: r.id,
    date: r.enrolled_at,
    student_first: r.students?.first_name ?? '',
    student_last: r.students?.last_name ?? '',
    group_name: r.groups?.name ?? '',
    school_name: r.groups?.schools?.name ?? '',
  }))
}

export async function getRecentLeaves(limit: number): Promise<EnrollmentEvent[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('group_enrollments')
    .select('id, left_at, students(first_name, last_name), groups(name, schools(name))')
    .eq('is_active', false)
    .not('left_at', 'is', null)
    .order('left_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []).map((r: any) => ({
    id: r.id,
    date: r.left_at ?? '',
    student_first: r.students?.first_name ?? '',
    student_last: r.students?.last_name ?? '',
    group_name: r.groups?.name ?? '',
    school_name: r.groups?.schools?.name ?? '',
  }))
}

export const getActiveGroups = unstable_cache(
  async (): Promise<ActiveGroupItem[]> => {
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, school_id, schools(name)')
      .eq('is_active', true)
      .order('name')

    if (error) throw new Error(error.message)
    return (data ?? []).map((g: any) => ({
      id: g.id,
      name: g.name,
      school_id: g.school_id,
      school_name: g.schools?.name ?? '',
    }))
  },
  ['active-groups-list'],
  { tags: ['schools'], revalidate: false }
)
