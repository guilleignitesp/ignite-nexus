import { createClient as createPublicClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-server'
import type { TrafficLight, SessionStatus } from '@/types'
import { getMondayOf, addDays } from '@/lib/utils/week-helpers'

export type { TrafficLight, SessionStatus }

// ─── Interfaces públicas ───────────────────────────────────────────────────

export interface ScheduleSlot {
  weekday: number    // 1=Lun … 5=Vie
  startTime: string  // 'HH:MM:SS'
  endTime: string
}

export interface TeacherGroupCard {
  groupId: string
  groupName: string
  schoolName: string
  ageRange: string | null
  schedule: ScheduleSlot[]
  activeStudentCount: number
  currentProjectName: string | null
  planningId: string | null
}

export interface TeacherDashboard {
  workerId: string
  firstName: string
  groups: TeacherGroupCard[]
}

export interface EnrolledStudent {
  studentId: string
  firstName: string
  lastName: string
}


export interface TodaySession {
  sessionId: string
  sessionDate: string
  startTime: string
  endTime: string
  status: SessionStatus
  trafficLight: TrafficLight | null
  teacherComment: string | null
  isConsolidated: boolean
  attendances: { studentId: string; attended: boolean }[]
  projectId: string | null
  projectName: string | null
}

export interface SessionHistoryItem {
  sessionId: string
  sessionDate: string
  status: SessionStatus
  trafficLight: TrafficLight | null
  teacherComment: string | null
  isConsolidated: boolean
  projectName: string | null
  projectId: string | null
  hasEvaluation: boolean
  excusedReason: string | null
}

export interface MapNode {
  projectId: string
  projectName: string
  materialType: string | null
}

export interface MapEdge {
  fromProjectId: string
  toProjectId: string
  percentage: number | null
  label: string | null
}

export interface GroupPlanningData {
  planningId: string
  currentProjectId: string | null
  currentProjectName: string | null
  currentLogId: string | null
  mapId: string | null
  mapInitialProjectId: string | null
  mapNodes: MapNode[]
  mapEdges: MapEdge[]
  /** Projetos sucesores del proyecto actual en el mapa (aristas salientes) */
  successors: { projectId: string; projectName: string; percentage: number | null; label: string | null }[]
}

export interface GroupDetail {
  groupId: string
  groupName: string
  schoolName: string
  ageRange: string | null
  schedule: ScheduleSlot[]
  students: EnrolledStudent[]
  planning: GroupPlanningData | null
  closestSession: TodaySession | null
  recentSessions: SessionHistoryItem[]
}

// ─── Tipos raw de Supabase ─────────────────────────────────────────────────

type RawEnrollment = {
  is_active: boolean
  students: { id: string; first_name: string; last_name: string } | null
}

type RawSchedule = { weekday: number; start_time: string; end_time: string }

type RawProjectLog = {
  id: string
  project_id: string
  assigned_at: string
  status: string
  projects: { id: string; name: string; material_type: string | null } | null
}

type RawMapNode = {
  project_id: string
  projects: { id: string; name: string; material_type: string | null } | null
}

type RawMapEdge = { from_project_id: string; to_project_id: string; percentage: number | null; label: string | null }

type RawMap = {
  id: string
  initial_project_id: string | null
  project_map_nodes: RawMapNode[]
  project_map_edges: RawMapEdge[]
}

type RawPlanning = {
  id: string
  is_active: boolean
  project_map_id: string | null
  planning_project_log: RawProjectLog[]
  project_maps: RawMap | null
}

type RawGroup = {
  id: string
  name: string
  age_range: string | null
  is_active: boolean
  schools: { id: string; name: string } | null
  group_schedule: RawSchedule[]
  group_enrollments: RawEnrollment[]
  plannings: RawPlanning[]
}

type RawAssignment = {
  group_id: string
  start_date: string
  end_date: string | null
  groups: RawGroup | null
}

type RawTodaySession = {
  id: string
  session_date: string
  start_time: string
  end_time: string
  status: string
  traffic_light: string | null
  teacher_comment: string | null
  is_consolidated: boolean
  session_attendances: { student_id: string; attended: boolean }[]
  project_id: string | null
  projects: { name: string } | null
}

type RawHistorySession = {
  id: string
  session_date: string
  status: string
  traffic_light: string | null
  teacher_comment: string | null
  is_consolidated: boolean
  project_id: string | null
  projects: { name: string } | null
  excused_reason: string | null
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function latestLog(logs: RawProjectLog[]): RawProjectLog | null {
  if (!logs || logs.length === 0) return null
  return logs.reduce((a, b) =>
    new Date(a.assigned_at) > new Date(b.assigned_at) ? a : b
  )
}

// ─── getTeacherDashboard ───────────────────────────────────────────────────

export async function getTeacherDashboard(workerId: string): Promise<TeacherDashboard | null> {
  const supabase = await createClient()

  const { data: worker, error } = await supabase
    .from('workers')
    .select(`
      id, first_name,
      group_assignments(
        group_id, start_date, end_date,
        groups(
          id, name, age_range, is_active,
          schools(id, name),
          group_schedule(weekday, start_time, end_time),
          group_enrollments(is_active),
          plannings(
            id, is_active,
            planning_project_log(id, project_id, assigned_at, status,
              projects(id, name, material_type)
            )
          )
        )
      )
    `)
    .eq('id', workerId)
    .single()

  if (error || !worker) return null

  const today = new Date().toISOString().slice(0, 10)
  const weekStart = getMondayOf(today)
  const weekEnd = addDays(weekStart, 4)

  const assignments = ((worker as unknown as {
    id: string
    first_name: string
    group_assignments: RawAssignment[]
  }).group_assignments ?? []).filter(
    (a) =>
      a.groups?.is_active &&
      a.start_date <= weekEnd &&
      (a.end_date === null || a.end_date >= weekStart)
  )

  const groups: TeacherGroupCard[] = assignments.map((a) => {
    const g = a.groups!
    const activePlannings = (g.plannings ?? []).filter((p) => p.is_active)
    const planning = activePlannings[0] ?? null
    const log = planning ? latestLog(planning.planning_project_log ?? []) : null
    const activeCount = (g.group_enrollments ?? []).filter((e) => e.is_active).length

    return {
      groupId: g.id,
      groupName: g.name,
      schoolName: g.schools?.name ?? '',
      ageRange: g.age_range ?? null,
      schedule: (g.group_schedule ?? []).map((s) => ({
        weekday: s.weekday,
        startTime: s.start_time,
        endTime: s.end_time,
      })),
      activeStudentCount: activeCount,
      currentProjectName: log?.projects?.name ?? null,
      planningId: planning?.id ?? null,
    }
  })

  return {
    workerId: worker.id,
    firstName: (worker as unknown as { first_name: string }).first_name,
    groups,
  }
}

// ─── buildGroupDetail (shared logic) ─────────────────────────────────────

const GROUP_FIELDS_SELECT = `
  id, name, age_range, is_active,
  schools(id, name),
  group_schedule(weekday, start_time, end_time),
  group_enrollments(
    is_active,
    students(id, first_name, last_name)
  ),
  plannings(
    id, is_active, project_map_id,
    planning_project_log(id, project_id, assigned_at, status,
      projects(id, name, material_type)
    ),
    project_maps(
      id, initial_project_id,
      project_map_nodes(project_id, projects(id, name, material_type)),
      project_map_edges(from_project_id, to_project_id, percentage, label)
    )
  )
`

async function buildGroupDetail(g: RawGroup): Promise<GroupDetail> {
  const supabase = await createClient()

  const schedule: ScheduleSlot[] = (g.group_schedule ?? []).map((s) => ({
    weekday: s.weekday,
    startTime: s.start_time,
    endTime: s.end_time,
  }))

  const students: EnrolledStudent[] = (g.group_enrollments ?? [])
    .filter((e) => e.is_active && e.students)
    .map((e) => ({
      studentId: e.students!.id,
      firstName: e.students!.first_name,
      lastName: e.students!.last_name,
    }))
    .sort((a, b) => a.lastName.localeCompare(b.lastName))

  const activePlannings = (g.plannings ?? []).filter((p) => p.is_active)
  const rawPlanning = activePlannings[0] ?? null

  // Extract map data before async fetch (no DB calls needed here)
  let log: RawProjectLog | null = null
  let rawMap: RawMap | null = null
  let nodes: MapNode[] = []
  let edges: MapEdge[] = []
  if (rawPlanning) {
    log = latestLog(rawPlanning.planning_project_log ?? [])
    rawMap = rawPlanning.project_maps as RawMap | null
    nodes = (rawMap?.project_map_nodes ?? []).map((n) => ({
      projectId: n.project_id,
      projectName: n.projects?.name ?? '',
      materialType: n.projects?.material_type ?? null,
    }))
    edges = (rawMap?.project_map_edges ?? []).map((e) => ({
      fromProjectId: e.from_project_id,
      toProjectId: e.to_project_id,
      percentage: e.percentage ?? null,
      label: e.label ?? null,
    }))
  }

  const planningId = rawPlanning?.id ?? null

  async function fetchClosestSession(pid: string): Promise<RawTodaySession | null> {
    const sel = `id, session_date, start_time, end_time, status, traffic_light, teacher_comment, is_consolidated, project_id,
      session_attendances(student_id, attended), projects(name)`
    const { data } = await supabase
      .from('sessions')
      .select(sel)
      .eq('planning_id', pid)
      .not('status', 'in', '(completed,excused)')
      .order('session_date', { ascending: true })
      .limit(1)
      .maybeSingle()
    return data as unknown as RawTodaySession | null
  }

  const [rawClosest, historyResult, logsResult] = planningId
    ? await Promise.all([
        fetchClosestSession(planningId),
        supabase
          .from('sessions')
          .select(`
            id, session_date, status, traffic_light, teacher_comment, is_consolidated, project_id, excused_reason,
            projects(name)
          `)
          .eq('planning_id', planningId)
          .in('status', ['completed', 'excused'])
          .order('session_date', { ascending: false })
          .limit(20),
        supabase
          .from('planning_project_log')
          .select('project_id, project_evaluations(id)')
          .eq('planning_id', planningId),
      ])
    : ([null, { data: [], error: null }, { data: [], error: null }] as const)

  // Build projectsWithEvals before constructing successors so completed projects can be filtered out
  type LogWithEval = { project_id: string; project_evaluations: { id: string }[] }
  const projectsWithEvals = new Set<string>(
    ((logsResult.data ?? []) as unknown as LogWithEval[])
      .filter((l) => (l.project_evaluations?.length ?? 0) > 0)
      .map((l) => l.project_id)
  )

  // Build planning with successors filtered to exclude already-completed projects
  let planning: GroupPlanningData | null = null
  if (rawPlanning) {
    const successors = log
      ? edges
          .filter((e) => e.fromProjectId === log!.project_id)
          .map((e) => {
            const node = nodes.find((n) => n.projectId === e.toProjectId)
            return node ? { projectId: node.projectId, projectName: node.projectName, percentage: e.percentage, label: e.label } : null
          })
          .filter((x): x is { projectId: string; projectName: string; percentage: number | null; label: string | null } => x !== null)
          .filter((x) => !projectsWithEvals.has(x.projectId))
      : []

    planning = {
      planningId: rawPlanning.id,
      currentProjectId: log?.project_id ?? null,
      currentProjectName: log?.projects?.name ?? null,
      currentLogId: log?.id ?? null,
      mapId: rawMap?.id ?? null,
      mapInitialProjectId: rawMap?.initial_project_id ?? null,
      mapNodes: nodes,
      mapEdges: edges,
      successors,
    }
  }

  const closestSession: TodaySession | null = rawClosest
    ? {
        sessionId: rawClosest.id,
        sessionDate: rawClosest.session_date,
        startTime: rawClosest.start_time,
        endTime: rawClosest.end_time,
        status: rawClosest.status as SessionStatus,
        trafficLight: rawClosest.traffic_light as TrafficLight | null,
        teacherComment: rawClosest.teacher_comment,
        isConsolidated: rawClosest.is_consolidated,
        attendances: (rawClosest.session_attendances ?? []).map((a) => ({
          studentId: a.student_id,
          attended: a.attended,
        })),
        projectId: rawClosest.project_id,
        projectName: rawClosest.projects?.name ?? null,
      }
    : null

  if (planning && closestSession) {
    planning = {
      ...planning,
      currentProjectId: closestSession.projectId,
      currentProjectName: closestSession.projectName,
    }
    const newSuccessors = closestSession.projectId
      ? planning.mapEdges
          .filter((e) => e.fromProjectId === closestSession.projectId)
          .map((e) => {
            const node = planning!.mapNodes.find((n) => n.projectId === e.toProjectId)
            return node ? { projectId: node.projectId, projectName: node.projectName, percentage: e.percentage, label: e.label } : null
          })
          .filter((x): x is { projectId: string; projectName: string; percentage: number | null; label: string | null } => x !== null)
          .filter((x) => !projectsWithEvals.has(x.projectId))
      : []
    planning = { ...planning, successors: newSuccessors }
  }

  // Sessions arrive DESC by date — first occurrence of each project_id is the latest session
  const lastSessionByProject = new Map<string, string>()
  const rawSessions = (historyResult.data ?? []) as unknown as RawHistorySession[]
  for (const s of rawSessions) {
    if (!s.project_id) continue
    if (!lastSessionByProject.has(s.project_id)) {
      lastSessionByProject.set(s.project_id, s.id)
    }
  }

  const recentSessions: SessionHistoryItem[] = rawSessions.map((s) => ({
    sessionId: s.id,
    sessionDate: s.session_date,
    status: s.status as SessionStatus,
    trafficLight: s.traffic_light as TrafficLight | null,
    teacherComment: s.teacher_comment,
    isConsolidated: s.is_consolidated,
    projectName: s.projects?.name ?? null,
    projectId: s.project_id,
    hasEvaluation:
      s.project_id !== null &&
      projectsWithEvals.has(s.project_id) &&
      lastSessionByProject.get(s.project_id) === s.id,
    excusedReason: s.excused_reason ?? null,
  }))

  return {
    groupId: g.id,
    groupName: g.name,
    schoolName: g.schools?.name ?? '',
    ageRange: g.age_range ?? null,
    schedule,
    students,
    planning,
    closestSession,
    recentSessions,
  }
}

// ─── getGroupDetail ────────────────────────────────────────────────────────

export async function getGroupDetail(
  groupId: string,
  workerId: string
): Promise<GroupDetail | null> {
  const supabase = await createClient()

  const { data: assignment, error: aErr } = await supabase
    .from('group_assignments')
    .select(`group_id, end_date, groups(${GROUP_FIELDS_SELECT})`)
    .eq('worker_id', workerId)
    .eq('group_id', groupId)
    .is('end_date', null)
    .maybeSingle()

  if (aErr || !assignment?.groups) return null
  return buildGroupDetail(assignment.groups as unknown as RawGroup)
}

// ─── getGroupDetailForAnyWorker ───────────────────────────────────────────

export async function getGroupDetailForAnyWorker(
  groupId: string,
  _workerId: string
): Promise<GroupDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('groups')
    .select(GROUP_FIELDS_SELECT)
    .eq('id', groupId)
    .maybeSingle()

  if (error || !data) return null
  return buildGroupDetail(data as unknown as RawGroup)
}

// ─── getAllGroupsForTeacher ────────────────────────────────────

export interface SchoolWithGroups {
  schoolId: string
  schoolName: string
  groups: { groupId: string; groupName: string; ageRange: string | null; schedule: ScheduleSlot[] }[]
}

export async function getAllGroupsForTeacher(): Promise<SchoolWithGroups[]> {
  const supabase = createPublicClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  type RawSchool = {
    id: string
    name: string
    groups: {
      id: string
      name: string
      age_range: string | null
      group_schedule: { weekday: number; start_time: string; end_time: string }[]
    }[]
  }

  const { data, error } = await supabase
    .from('schools')
    .select('id, name, groups(id, name, age_range, group_schedule(weekday, start_time, end_time))')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(error.message)

  return ((data ?? []) as unknown as RawSchool[]).map((school) => ({
    schoolId: school.id,
    schoolName: school.name,
    groups: (school.groups ?? [])
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((g) => ({
        groupId: g.id,
        groupName: g.name,
        ageRange: g.age_range ?? null,
        schedule: (g.group_schedule ?? []).map((s) => ({
          weekday: s.weekday,
          startTime: s.start_time,
          endTime: s.end_time,
        })),
      })),
  }))
}
