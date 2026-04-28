import { createClient } from '@/lib/supabase-server'
import type { TrafficLight, SessionStatus } from '@/types'

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
  status: SessionStatus
  trafficLight: TrafficLight | null
  teacherComment: string | null
  isConsolidated: boolean
  attendances: { studentId: string; attended: boolean }[]
}

export interface SessionHistoryItem {
  sessionId: string
  sessionDate: string
  status: SessionStatus
  trafficLight: TrafficLight | null
  teacherComment: string | null
  isConsolidated: boolean
  projectName: string | null
}

export interface MapNode {
  projectId: string
  projectName: string
  materialType: string | null
}

export interface MapEdge {
  fromProjectId: string
  toProjectId: string
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
  successors: { projectId: string; projectName: string }[]
}

export interface GroupDetail {
  groupId: string
  groupName: string
  schoolName: string
  schedule: ScheduleSlot[]
  students: EnrolledStudent[]
  planning: GroupPlanningData | null
  closestSession: TodaySession | null
  /** true si hoy es un día de clase según el horario del grupo */
  isClassToday: boolean
  /** Horario del día de hoy si hay clase */
  todaySlot: ScheduleSlot | null
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

type RawMapEdge = { from_project_id: string; to_project_id: string }

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
  is_active: boolean
  schools: { id: string; name: string } | null
  group_schedule: RawSchedule[]
  group_enrollments: RawEnrollment[]
  plannings: RawPlanning[]
}

type RawAssignment = {
  group_id: string
  end_date: string | null
  groups: RawGroup | null
}

type RawTodaySession = {
  id: string
  session_date: string
  status: string
  traffic_light: string | null
  teacher_comment: string | null
  is_consolidated: boolean
  session_attendances: { student_id: string; attended: boolean }[]
}

type RawHistorySession = {
  id: string
  session_date: string
  status: string
  traffic_light: string | null
  teacher_comment: string | null
  is_consolidated: boolean
  projects: { name: string } | null
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function jsWeekday(): number {
  // JS getDay() → 0=Dom,1=Lun…6=Sáb; DB: 1=Lun…5=Vie
  const day = new Date().getDay()
  return day === 0 ? 7 : day  // Dom→7, el resto coincide
}


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
        group_id, end_date,
        groups(
          id, name, is_active,
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

  const assignments = ((worker as unknown as {
    id: string
    first_name: string
    group_assignments: RawAssignment[]
  }).group_assignments ?? []).filter(
    (a) => a.end_date === null && a.groups?.is_active
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

// ─── getGroupDetail ────────────────────────────────────────────────────────

export async function getGroupDetail(
  groupId: string,
  workerId: string
): Promise<GroupDetail | null> {
  const supabase = await createClient()

  // Step 1: structural data + ownership check (single query)
  const { data: assignment, error: aErr } = await supabase
    .from('group_assignments')
    .select(`
      group_id, end_date,
      groups(
        id, name, is_active,
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
            project_map_edges(from_project_id, to_project_id)
          )
        )
      )
    `)
    .eq('worker_id', workerId)
    .eq('group_id', groupId)
    .is('end_date', null)
    .maybeSingle()

  if (aErr || !assignment?.groups) return null

  const g = assignment.groups as unknown as RawGroup
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

  // Determine active planning
  const activePlannings = (g.plannings ?? []).filter((p) => p.is_active)
  const rawPlanning = activePlannings[0] ?? null

  // Determine if today is a class day
  const todayWd = jsWeekday()
  const todaySlotRaw = schedule.find((s) => s.weekday === todayWd) ?? null
  const isClassToday = todaySlotRaw !== null

  // Build planning data
  let planning: GroupPlanningData | null = null
  if (rawPlanning) {
    const log = latestLog(rawPlanning.planning_project_log ?? [])
    const rawMap = rawPlanning.project_maps as RawMap | null
    const nodes: MapNode[] = (rawMap?.project_map_nodes ?? []).map((n) => ({
      projectId: n.project_id,
      projectName: n.projects?.name ?? '',
      materialType: n.projects?.material_type ?? null,
    }))
    const edges: MapEdge[] = (rawMap?.project_map_edges ?? []).map((e) => ({
      fromProjectId: e.from_project_id,
      toProjectId: e.to_project_id,
    }))
    const successors = log
      ? edges
          .filter((e) => e.fromProjectId === log.project_id)
          .map((e) => {
            const node = nodes.find((n) => n.projectId === e.toProjectId)
            return node ? { projectId: node.projectId, projectName: node.projectName } : null
          })
          .filter((x): x is { projectId: string; projectName: string } => x !== null)
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

  // Step 2: parallel — closest session + recent history
  const planningId = planning?.planningId ?? null

  // Oldest non-completed session — teacher works through backlog in chronological order
  async function fetchClosestSession(pid: string): Promise<RawTodaySession | null> {
    const sel = `id, session_date, status, traffic_light, teacher_comment, is_consolidated,
      session_attendances(student_id, attended)`
    const { data } = await supabase
      .from('sessions')
      .select(sel)
      .eq('planning_id', pid)
      .not('status', 'in', '(completed,unknown,excused)')
      .order('session_date', { ascending: true })
      .limit(1)
      .maybeSingle()
    return data as unknown as RawTodaySession | null
  }

  const [rawClosest, historyResult] = planningId
    ? await Promise.all([
        fetchClosestSession(planningId),
        supabase
          .from('sessions')
          .select(`
            id, session_date, status, traffic_light, teacher_comment, is_consolidated,
            projects(name)
          `)
          .eq('planning_id', planningId)
          .eq('status', 'completed')
          .order('session_date', { ascending: false })
          .limit(20),
      ])
    : [null, { data: [], error: null }]

  const closestSession: TodaySession | null = rawClosest
    ? {
        sessionId: rawClosest.id,
        sessionDate: rawClosest.session_date,
        status: rawClosest.status as SessionStatus,
        trafficLight: rawClosest.traffic_light as TrafficLight | null,
        teacherComment: rawClosest.teacher_comment,
        isConsolidated: rawClosest.is_consolidated,
        attendances: (rawClosest.session_attendances ?? []).map((a) => ({
          studentId: a.student_id,
          attended: a.attended,
        })),
      }
    : null

  const recentSessions: SessionHistoryItem[] = ((historyResult.data ?? []) as unknown as RawHistorySession[]).map(
    (s) => ({
      sessionId: s.id,
      sessionDate: s.session_date,
      status: s.status as SessionStatus,
      trafficLight: s.traffic_light as TrafficLight | null,
      teacherComment: s.teacher_comment,
      isConsolidated: s.is_consolidated,
      projectName: s.projects?.name ?? null,
    })
  )

  return {
    groupId: g.id,
    groupName: g.name,
    schoolName: g.schools?.name ?? '',
    schedule,
    students,
    planning,
    closestSession,
    isClassToday,
    todaySlot: todaySlotRaw,
    recentSessions,
  }
}
