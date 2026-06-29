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
  age_range: string | null
  isActive: boolean
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
  teamId: string | null
  teamName: string | null
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
  age_range: string | null
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
  team_id: string | null
  teams: { id: string; name: string } | null
  groups: RawGroup[]
}

function transformSchools(raw: RawSchool[]): School[] {
  return raw.map((school) => {
    const allGroups = (school.groups ?? [])

    const today = new Date().toISOString().slice(0, 10)
    const uniqueStudents = new Set<string>()
    const groups: Group[] = allGroups.map((g) => {
      const teachers: GroupTeacher[] = (g.group_assignments ?? [])
        .filter((a) => a.workers && (a.end_date === null || a.end_date >= today))
        .map((a) => a.workers as RawWorker)

      const enrollments = (g.group_enrollments ?? []).filter((e) => e.is_active)
      if (g.is_active !== false) enrollments.forEach((e) => uniqueStudents.add(e.student_id))

      const schedule: GroupScheduleItem[] = [...(g.group_schedule ?? [])].sort(
        (a, b) => a.weekday - b.weekday
      )

      const schoolYear = g.school_years as RawSchoolYear

      return {
        id: g.id,
        name: g.name,
        age_range: g.age_range ?? null,
        isActive: g.is_active !== false,
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
      teamId: school.team_id ?? null,
      teamName: school.teams?.name ?? null,
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
      'id, name, team_id, teams(id, name), groups(id, name, age_range, is_active, school_year_id, school_years(name), group_enrollments(student_id, is_active), group_schedule(weekday, start_time, end_time), group_assignments(end_date, workers(id, first_name, last_name)))'
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

// ─── Staffing types ───────────────────────────────────────────

export interface SlotRef {
  groupId: string
  slotDate: string
  startTime: string
  endTime: string
}

export interface StaffingSlot {
  groupId: string
  groupName: string
  schoolId: string
  schoolName: string
  teamId: string | null
  teamName: string | null
  slotDate: string
  startTime: string
  endTime: string
  sessionId: string | null
  sessionStatus: 'pending' | 'completed' | 'excused' | null
  minTeachersRequired: number
  projectId: string | null
  projectName: string | null
  excusedReason: string | null
  ageRange: string | null
  permanentWorkers: {
    assignmentId: string
    workerId: string
    firstName: string
    lastName: string
  }[]
  teacherChanges: {
    id: string
    workerId: string
    type: 'substitute' | 'absent'
    isActive: boolean
  }[]
}

export interface WorkerLayerItem {
  id: string
  firstName: string
  lastName: string
  currentGroupName?: string
  differentSchool?: boolean
}

export interface WorkerAvailabilityResult {
  p1Surplus: WorkerLayerItem[]
  p2Free: WorkerLayerItem[]
  p3Critical: WorkerLayerItem[]
  p4Unavailable: WorkerLayerItem[]
  p5Inactive: WorkerLayerItem[]
}

// ─── getWeekStaffing ──────────────────────────────────────────

export async function getWeekStaffing(
  weekStart: string,
  weekEnd: string
): Promise<StaffingSlot[]> {
  const supabase = await createServerClient()

  type RawSchoolForStaffing = {
    id: string
    name: string
    team_id: string | null
    teams: { id: string; name: string } | null
    groups: {
      id: string
      name: string
      age_range: string | null
      is_active: boolean
      group_schedule: { weekday: number; start_time: string; end_time: string; min_teachers_required: number }[]
    }[]
  }

  type RawSessionForStaffing = {
    id: string
    session_date: string
    start_time: string
    end_time: string
    min_teachers_required: number
    status: string
    is_consolidated: boolean
    project_id: string | null
    excused_reason: string | null
    projects: { id: string; name: string } | null
    plannings: { group_id: string } | null
    session_teacher_assignments: {
      id: string
      worker_id: string
      type: string
      is_active: boolean
    }[]
  }

  type RawSlotSTA = {
    id: string
    group_id: string
    slot_date: string
    start_time_local: string
    end_time_local: string
    worker_id: string
    type: string
    is_active: boolean
  }

  type RawGroupAssignmentForStaffing = {
    id: string
    group_id: string
    worker_id: string
    start_date: string
    end_date: string | null
    weekday: number | null
    slot_start_time: string | null
    slot_end_time: string | null
    workers: { id: string; first_name: string; last_name: string } | null
  }

  const [schoolsResult, sessionsResult, slotSTAsResult, assignmentsResult] = await Promise.all([
    supabase
      .from('schools')
      .select(
        'id, name, team_id, teams(id, name), groups(id, name, age_range, is_active, group_schedule(weekday, start_time, end_time, min_teachers_required))'
      )
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('sessions')
      .select(
        'id, session_date, start_time, end_time, min_teachers_required, status, is_consolidated, project_id, excused_reason, projects(id, name), plannings(group_id), session_teacher_assignments(id, worker_id, type, is_active)'
      )
      .gte('session_date', weekStart)
      .lte('session_date', weekEnd),
    supabase
      .from('session_teacher_assignments')
      .select('id, group_id, slot_date, start_time_local, end_time_local, worker_id, type, is_active')
      .gte('slot_date', weekStart)
      .lte('slot_date', weekEnd)
      .not('group_id', 'is', null),
    supabase
      .from('group_assignments')
      .select('id, group_id, worker_id, start_date, end_date, weekday, slot_start_time, slot_end_time, workers(id, first_name, last_name)')
      .eq('type', 'permanent')
      .eq('is_active', true),
  ])

  if (schoolsResult.error) throw new Error(schoolsResult.error.message)
  if (sessionsResult.error) throw new Error(sessionsResult.error.message)

  const schools = (schoolsResult.data ?? []) as unknown as RawSchoolForStaffing[]
  const sessions = (
    (sessionsResult.data ?? []) as unknown as RawSessionForStaffing[]
  ).filter((s) => s.plannings !== null)
  const slotSTAs = (slotSTAsResult.data ?? []) as unknown as RawSlotSTA[]

  const sessionBySlotKey = new Map<string, RawSessionForStaffing>()
  for (const s of sessions) {
    const key = `${s.plannings!.group_id}|${s.session_date}|${s.start_time}`
    sessionBySlotKey.set(key, s)
  }

  const permanentAssignments = (assignmentsResult.data ?? []) as unknown as RawGroupAssignmentForStaffing[]

  // Index perm assignments by groupId
  const permByGroupId = new Map<string, RawGroupAssignmentForStaffing[]>()
  for (const a of permanentAssignments) {
    if (!a.workers) continue
    const arr = permByGroupId.get(a.group_id) ?? []
    arr.push(a)
    permByGroupId.set(a.group_id, arr)
  }

  const slotSTAsByKey = new Map<string, RawSlotSTA[]>()
  for (const sta of slotSTAs) {
    const key = `${sta.group_id}|${sta.slot_date}|${sta.start_time_local}`
    const arr = slotSTAsByKey.get(key) ?? []
    arr.push(sta)
    slotSTAsByKey.set(key, arr)
  }

  const weekStartDate = new Date(`${weekStart}T12:00:00`)
  const weekEndDate = new Date(`${weekEnd}T12:00:00`)
  const slots: StaffingSlot[] = []

  for (const school of schools) {
    for (const group of school.groups ?? []) {
      if (group.is_active === false) continue
      for (const schedSlot of group.group_schedule ?? []) {
        // weekday 1=Mon…5=Fri; weekStart is always Monday → offset = weekday - 1
        const slotDate = new Date(weekStartDate)
        slotDate.setDate(slotDate.getDate() + (schedSlot.weekday - 1))
        if (slotDate > weekEndDate) continue
        const slotDateStr = slotDate.toISOString().slice(0, 10)

        const slotKey = `${group.id}|${slotDateStr}|${schedSlot.start_time}`
        const session = sessionBySlotKey.get(slotKey) ?? null
        const sessionSTAs = session?.session_teacher_assignments ?? []
        const extraSTAs = slotSTAsByKey.get(slotKey) ?? []

        const allSTAsMap = new Map<
          string,
          { id: string; workerId: string; type: 'substitute' | 'absent'; isActive: boolean }
        >()
        for (const sta of sessionSTAs) {
          allSTAsMap.set(sta.id, {
            id: sta.id,
            workerId: sta.worker_id,
            type: sta.type as 'substitute' | 'absent',
            isActive: sta.is_active,
          })
        }
        for (const sta of extraSTAs) {
          allSTAsMap.set(sta.id, {
            id: sta.id,
            workerId: sta.worker_id,
            type: sta.type as 'substitute' | 'absent',
            isActive: sta.is_active,
          })
        }

        const slotPermWorkers = (permByGroupId.get(group.id) ?? [])
          .filter((a) => {
            if (a.start_date > slotDateStr) return false
            if (a.end_date !== null && a.end_date < slotDateStr) return false
            if (a.weekday !== null && a.weekday !== undefined) {
              if (a.weekday !== schedSlot.weekday) return false
              if (a.slot_start_time && a.slot_start_time !== schedSlot.start_time) return false
            }
            return true
          })
          .map((a) => ({
            assignmentId: a.id,
            workerId: a.worker_id,
            firstName: a.workers!.first_name,
            lastName: a.workers!.last_name,
          }))

        slots.push({
          groupId: group.id,
          groupName: group.name,
          schoolId: school.id,
          schoolName: school.name,
          teamId: school.team_id ?? null,
          teamName: school.teams?.name ?? null,
          slotDate: slotDateStr,
          startTime: schedSlot.start_time,
          endTime: schedSlot.end_time,
          sessionId: session?.id ?? null,
          sessionStatus: session
            ? (session.status as 'pending' | 'completed' | 'excused')
            : null,
          minTeachersRequired: schedSlot.min_teachers_required,
          projectId: session?.project_id ?? null,
          projectName: session?.projects?.name ?? null,
          excusedReason: session?.excused_reason ?? null,
          ageRange: group.age_range ?? null,
          permanentWorkers: slotPermWorkers,
          teacherChanges: [...allSTAsMap.values()],
        })
      }
    }
  }

  return slots
}

// ─── Group admin detail (live, authenticated) ─────────────────

export interface GroupSession {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  projectId: string | null
  projectName: string | null
  isConsolidated: boolean
  trafficLight: string | null
  teacherComment: string | null
  excusedReason: string | null
  attendances: { studentId: string; attended: boolean }[]
  hasEvaluation: boolean
}

export interface GroupAdminDetail {
  id: string
  name: string
  ageRange: string | null
  schoolId: string
  schoolName: string
  isActive: boolean
  schedule: { id: string; weekday: number; startTime: string; endTime: string }[]
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
  age_range: string | null
  is_active: boolean
  schools: { id: string; name: string } | null
  group_schedule: { id: string; weekday: number; start_time: string; end_time: string }[]
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
  traffic_light: string | null
  teacher_comment: string | null
  excused_reason: string | null
  projects: { id: string; name: string } | null
  session_attendances: { student_id: string; attended: boolean }[]
}

export async function getGroupAdminDetail(
  groupId: string
): Promise<GroupAdminDetail | null> {
  const supabase = await createServerClient()

  const [groupResult, mapsResult] = await Promise.all([
    supabase
      .from('groups')
      .select(
        `id, name, age_range, is_active,
        schools(id, name),
        group_schedule(id, weekday, start_time, end_time),
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
    const [sessionsResult, logsResult] = await Promise.all([
      supabase
        .from('sessions')
        .select('id, session_date, start_time, end_time, status, is_consolidated, traffic_light, teacher_comment, excused_reason, projects(id, name), session_attendances(student_id, attended)')
        .in('planning_id', planningIds)
        .order('session_date', { ascending: false })
        .limit(50),
      supabase
        .from('planning_project_log')
        .select('project_id, project_evaluations(id)')
        .in('planning_id', planningIds),
    ])

    type LogWithEval = { project_id: string; project_evaluations: { id: string }[] }
    const projectsWithEvals = new Set<string>(
      ((logsResult.data ?? []) as unknown as LogWithEval[])
        .filter((l) => (l.project_evaluations?.length ?? 0) > 0)
        .map((l) => l.project_id)
    )

    // Sessions arrive DESC by date — first occurrence of each project_id is the latest session
    const rawSessionsList = (sessionsResult.data ?? []) as unknown as RawGroupSession[]
    const lastSessionByProject = new Map<string, string>()
    for (const s of rawSessionsList) {
      const pid = s.projects?.id ?? null
      if (!pid) continue
      if (!lastSessionByProject.has(pid)) {
        lastSessionByProject.set(pid, s.id)
      }
    }

    sessions = rawSessionsList.map((s) => {
      const projectId = s.projects?.id ?? null
      return {
        id: s.id,
        date: s.session_date,
        startTime: s.start_time,
        endTime: s.end_time,
        status: s.status,
        projectId,
        projectName: s.projects?.name ?? null,
        isConsolidated: s.is_consolidated ?? false,
        trafficLight: s.traffic_light,
        teacherComment: s.teacher_comment,
        excusedReason: s.excused_reason ?? null,
        attendances: (s.session_attendances ?? []).map((a) => ({
          studentId: a.student_id,
          attended: a.attended,
        })),
        hasEvaluation:
          projectId !== null &&
          projectsWithEvals.has(projectId) &&
          lastSessionByProject.get(projectId) === s.id,
      }
    })
  }

  const today = new Date().toISOString().slice(0, 10)
  const teachers = (raw.group_assignments ?? [])
    .filter((a) => (a.end_date === null || a.end_date >= today) && a.is_active && a.type === 'permanent' && a.workers)
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
    ageRange: raw.age_range ?? null,
    schoolId: raw.schools?.id ?? '',
    schoolName: raw.schools?.name ?? '',
    isActive: raw.is_active,
    schedule: (raw.group_schedule ?? [])
      .sort((a, b) => a.weekday - b.weekday)
      .map((s) => ({ id: s.id, weekday: s.weekday, startTime: s.start_time, endTime: s.end_time })),
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
