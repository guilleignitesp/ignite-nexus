import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'

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
type RawEnrollment = { student_id: string; is_active: boolean }
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

      const enrollments = (g.group_enrollments ?? []).filter((e) => e.is_active)
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

export async function getSchoolsWithGroups(): Promise<School[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('schools')
    .select(
      'id, name, groups(id, name, is_active, school_year_id, school_years(name), group_enrollments(student_id, is_active), group_schedule(weekday, start_time, end_time), group_assignments(end_date, workers(id, first_name, last_name)))'
    )
    .eq('is_active', true)
    .order('name')
  if (error) throw new Error(error.message)
  return transformSchools((data ?? []) as unknown as RawSchool[])
}

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

// ─── Group admin detail (live, authenticated) ─────────────────

export interface GroupSession {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  projectName: string | null
  isConsolidated: boolean
}

export interface GroupAdminDetail {
  id: string
  name: string
  schoolId: string
  schoolName: string
  isActive: boolean
  schedule: { weekday: number; startTime: string; endTime: string }[]
  hasActivePlanning: boolean
  planningId: string | null
  planningProjectMapId: string | null
  planningProjectMapName: string | null
  teachers: { assignmentId: string; workerId: string; firstName: string; lastName: string }[]
  students: { enrollmentId: string; studentId: string; firstName: string; lastName: string }[]
  sessions: GroupSession[]
  projectMaps: { id: string; name: string }[]
}

type RawPlanning = {
  id: string
  is_active: boolean
  project_map_id: string | null
  project_maps: { id: string; name: string } | null
}

type RawGroupAssignment = {
  id: string
  end_date: string | null
  type: string
  is_active: boolean
  workers: { id: string; first_name: string; last_name: string } | null
}

type RawGroupEnrollment = {
  id: string
  is_active: boolean
  students: { id: string; first_name: string; last_name: string } | null
}

type RawGroupDetail = {
  id: string
  name: string
  is_active: boolean
  schools: { id: string; name: string } | null
  group_schedule: { weekday: number; start_time: string; end_time: string }[]
  plannings: RawPlanning[]
  group_assignments: RawGroupAssignment[]
  group_enrollments: RawGroupEnrollment[]
}

type RawGroupSession = {
  id: string
  session_date: string
  start_time: string
  end_time: string
  status: string
  is_consolidated: boolean
  projects: { name: string } | null
}

export async function getGroupAdminDetail(
  groupId: string
): Promise<GroupAdminDetail | null> {
  const supabase = await createServerClient()

  const [groupResult, mapsResult] = await Promise.all([
    supabase
      .from('groups')
      .select(
        `id, name, is_active,
        schools(id, name),
        group_schedule(weekday, start_time, end_time),
        plannings(id, is_active, project_map_id, project_maps(id, name)),
        group_assignments(id, end_date, type, is_active, workers(id, first_name, last_name)),
        group_enrollments(id, is_active, students(id, first_name, last_name))`
      )
      .eq('id', groupId)
      .maybeSingle(),
    supabase
      .from('project_maps')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
  ])

  if (groupResult.error) throw new Error(groupResult.error.message)
  if (!groupResult.data) return null

  const raw = groupResult.data as unknown as RawGroupDetail

  const plannings = raw.plannings ?? []
  const activePlanning = plannings.find((p) => p.is_active) ?? null

  // Fetch sessions for all plannings of this group
  const planningIds = plannings.map((p) => p.id)
  let sessions: GroupSession[] = []
  if (planningIds.length > 0) {
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('id, session_date, start_time, end_time, status, is_consolidated, projects(name)')
      .in('planning_id', planningIds)
      .order('session_date', { ascending: false })
      .limit(50)
    sessions = ((sessionsData ?? []) as unknown as RawGroupSession[]).map((s) => ({
      id: s.id,
      date: s.session_date,
      startTime: s.start_time,
      endTime: s.end_time,
      status: s.status,
      projectName: s.projects?.name ?? null,
      isConsolidated: s.is_consolidated ?? false,
    }))
  }

  const teachers = (raw.group_assignments ?? [])
    .filter((a) => a.end_date === null && a.is_active && a.type === 'permanent' && a.workers)
    .map((a) => ({
      assignmentId: a.id,
      workerId: a.workers!.id,
      firstName: a.workers!.first_name,
      lastName: a.workers!.last_name,
    }))

  const students = (raw.group_enrollments ?? [])
    .filter((e) => e.is_active && e.students)
    .map((e) => ({
      enrollmentId: e.id,
      studentId: e.students!.id,
      firstName: e.students!.first_name,
      lastName: e.students!.last_name,
    }))

  const projectMaps = ((mapsResult.data ?? []) as { id: string; name: string }[])

  return {
    id: raw.id,
    name: raw.name,
    schoolId: raw.schools?.id ?? '',
    schoolName: raw.schools?.name ?? '',
    isActive: raw.is_active,
    schedule: (raw.group_schedule ?? [])
      .sort((a, b) => a.weekday - b.weekday)
      .map((s) => ({ weekday: s.weekday, startTime: s.start_time, endTime: s.end_time })),
    hasActivePlanning: activePlanning !== null,
    planningId: activePlanning?.id ?? null,
    planningProjectMapId: activePlanning?.project_map_id ?? null,
    planningProjectMapName: activePlanning?.project_maps?.name ?? null,
    teachers,
    students,
    sessions,
    projectMaps,
  }
}
