import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

export interface GroupScheduleItem {
  weekday: number
  start_time: string
  end_time: string
}

export interface GroupTeacher {
  id: string
  first_name: string
  last_name: string
}

export interface Group {
  id: string
  name: string
  school_id: string
  school_year_id: string | null
  school_year_name: string | null
  student_count: number
  schedule: GroupScheduleItem[]
  teachers: GroupTeacher[]
}

export interface School {
  id: string
  name: string
  student_count: number
  groups: Group[]
}

export interface Worker {
  id: string
  first_name: string
  last_name: string
}

type RawWorker = { id: string; first_name: string; last_name: string }
type RawAssignment = { end_date: string | null; workers: RawWorker | null }
type RawEnrollment = { student_id: string }
type RawScheduleRow = { weekday: number; start_time: string; end_time: string }
type RawSchoolYear = { name: string } | null
type RawGroup = {
  id: string
  name: string
  is_active: boolean
  school_year_id: string | null
  school_years: RawSchoolYear
  group_enrollments: RawEnrollment[]
  group_schedule: RawScheduleRow[]
  group_assignments: RawAssignment[]
}
type RawSchool = {
  id: string
  name: string
  groups: RawGroup[]
}

function transformSchools(raw: RawSchool[]): School[] {
  return raw.map((school) => {
    const activeGroups = (school.groups ?? []).filter((g) => g.is_active !== false)

    const uniqueStudents = new Set<string>()
    const groups: Group[] = activeGroups.map((g) => {
      const teachers: GroupTeacher[] = (g.group_assignments ?? [])
        .filter((a) => a.end_date === null && a.workers)
        .map((a) => a.workers as RawWorker)

      const enrollments = g.group_enrollments ?? []
      enrollments.forEach((e) => uniqueStudents.add(e.student_id))

      const schedule: GroupScheduleItem[] = [...(g.group_schedule ?? [])].sort(
        (a, b) => a.weekday - b.weekday
      )

      const schoolYear = g.school_years as RawSchoolYear

      return {
        id: g.id,
        name: g.name,
        school_id: school.id,
        school_year_id: g.school_year_id,
        school_year_name: schoolYear ? schoolYear.name : null,
        student_count: enrollments.length,
        schedule,
        teachers,
      }
    })

    return {
      id: school.id,
      name: school.name,
      student_count: uniqueStudents.size,
      groups,
    }
  })
}

export const getSchoolsWithGroups = unstable_cache(
  async (): Promise<School[]> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .from('schools')
      .select(
        'id, name, groups(id, name, is_active, school_year_id, school_years(name), group_enrollments(student_id), group_schedule(weekday, start_time, end_time), group_assignments(end_date, workers(id, first_name, last_name)))'
      )
      .eq('is_active', true)
      .order('name')
    if (error) throw new Error(error.message)
    return transformSchools((data ?? []) as unknown as RawSchool[])
  },
  ['schools'],
  { tags: ['schools'], revalidate: false }
)

export const getActiveWorkers = unstable_cache(
  async (): Promise<Worker[]> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .from('workers')
      .select('id, first_name, last_name')
      .eq('status', 'active')
      .order('last_name')
    if (error) throw new Error(error.message)
    return (data ?? []) as Worker[]
  },
  ['workers'],
  { tags: ['workers'], revalidate: false }
)
