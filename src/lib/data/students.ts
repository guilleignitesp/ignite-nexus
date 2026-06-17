import { createClient } from '@/lib/supabase-server'

export const PAGE_LIMIT = 20

export interface StudentListItem {
  id: string
  first_name: string
  last_name: string
  status: 'active' | 'inactive'
  created_at: string
  current_group: string | null
  current_school: string | null
}

export interface GroupEnrollment {
  id: string
  is_active: boolean
  enrolled_at: string
  left_at: string | null
  groups: {
    id: string
    name: string
    schools: { name: string } | null
    school_years: { name: string } | null
  } | null
}

export interface StudentXPEntry {
  academic_xp: number
  total_xp: number
  level: number
  skills: {
    id: string
    name_es: string
    name_en: string
    name_ca: string
    branches: {
      id: string
      code: string
      name_es: string
      name_en: string
      name_ca: string
      color: string
    } | null
  } | null
}

export interface SkillEval {
  xp_awarded: number
  skills: { name_es: string; name_en: string; name_ca: string } | null
}

export interface ProjectEvaluation {
  id: string
  xp_multiplier_pct: number
  evaluated_at: string
  projects: { name: string } | null
  skill_evaluations: SkillEval[]
}

export interface AttitudeLogEntry {
  id: string
  xp_awarded: number
  recorded_at: string
  attitude_actions: {
    name_es: string
    name_en: string
    name_ca: string
    xp_value: number
  } | null
  sessions: { session_date: string } | null
}

export interface CompletedProject {
  projectId: string
  projectName: string
  planningId: string
  planningProjectLogId: string
  evaluationId: string
  studentId: string
  firstSessionDate: string | null
  lastSessionDate: string | null
  totalXp: number
  skills: {
    skillId: string
    name_es: string
    name_en: string
    name_ca: string
    xp_awarded: number
    branchColor: string | null
  }[]
}

export interface StudentProfile {
  id: string
  first_name: string
  last_name: string
  status: 'active' | 'inactive'
  created_at: string
  user_id: string | null
  group_enrollments: GroupEnrollment[]
  student_xp: StudentXPEntry[]
  project_evaluations: ProjectEvaluation[]
  attitude_logs: AttitudeLogEntry[]
  completedProjects: CompletedProject[]
  currentProject: { projectName: string; groupName: string } | null
}

export async function getStudentsPage(
  search: string,
  page: number,
  status: string
): Promise<{ students: StudentListItem[]; total: number }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('search_students_page', {
    p_search: search.trim(),
    p_page: page,
    p_page_size: PAGE_LIMIT,
    p_status: status,
  })

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as Array<{
    id: string; first_name: string; last_name: string
    status: string; created_at: string
    current_group: string | null; current_school: string | null
    total_count: number
  }>

  const total = rows[0]?.total_count ?? 0

  const students: StudentListItem[] = rows.map((r) => ({
    id: r.id,
    first_name: r.first_name,
    last_name: r.last_name,
    status: r.status as 'active' | 'inactive',
    created_at: r.created_at,
    current_group: r.current_group,
    current_school: r.current_school,
  }))

  return { students, total }
}

export async function getStudentProfile(
  studentId: string
): Promise<StudentProfile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .select(`
      id, first_name, last_name, status, created_at, user_id,
      group_enrollments(
        id, is_active, enrolled_at, left_at,
        groups(id, name, schools(name), school_years(name))
      ),
      student_xp(
        academic_xp, total_xp, level,
        skills(id, name_es, name_en, name_ca, branches(id, code, name_es, name_en, name_ca, color))
      ),
      project_evaluations(
        id, xp_multiplier_pct, evaluated_at,
        projects(name),
        skill_evaluations(xp_awarded, skills(name_es, name_en, name_ca))
      ),
      attitude_logs(
        id, xp_awarded, recorded_at,
        attitude_actions(name_es, name_en, name_ca, xp_value),
        sessions(session_date)
      )
    `)
    .eq('id', studentId)
    .single()

  if (error || !data) return null

  // Cast via unknown to avoid TS inference issues with deep nested Supabase types
  const raw = data as unknown as StudentProfile

  // Sort nested arrays
  raw.group_enrollments = (raw.group_enrollments ?? []).sort(
    (a, b) => Number(b.is_active) - Number(a.is_active)
  )
  raw.project_evaluations = (raw.project_evaluations ?? []).sort(
    (a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime()
  )
  raw.attitude_logs = (raw.attitude_logs ?? []).sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  )

  // --- Completed projects (project_evaluations with full join) ---
  const { data: evalRows } = await supabase
    .from('project_evaluations')
    .select(`
      id, student_id, project_id,
      planning_project_log(id, planning_id, project_id, projects(id, name)),
      skill_evaluations(xp_awarded, skill_id, skills(name_es, name_en, name_ca, branches(color)))
    `)
    .eq('student_id', studentId)
    .order('evaluated_at', { ascending: false })

  type RawEvalRow = {
    id: string
    student_id: string
    project_id: string
    planning_project_log: {
      id: string
      planning_id: string
      project_id: string
      projects: { id: string; name: string } | null
    } | null
    skill_evaluations: Array<{
      xp_awarded: number
      skill_id: string
      skills: {
        name_es: string
        name_en: string
        name_ca: string
        branches: { color: string } | null
      } | null
    }>
  }

  const evalRowsCast = (evalRows ?? []) as unknown as RawEvalRow[]

  // Collect unique planning_ids to fetch session date ranges in one query
  const planningIds = [...new Set(
    evalRowsCast
      .filter(r => r.planning_project_log?.planning_id)
      .map(r => r.planning_project_log!.planning_id)
  )]

  const sessionDates = new Map<string, { first: string; last: string }>()

  if (planningIds.length > 0) {
    const { data: sessRows } = await supabase
      .from('sessions')
      .select('planning_id, project_id, session_date')
      .in('planning_id', planningIds)
      .eq('status', 'completed')

    for (const s of (sessRows ?? []) as { planning_id: string; project_id: string; session_date: string }[]) {
      const key = `${s.planning_id}::${s.project_id}`
      const cur = sessionDates.get(key)
      if (!cur) {
        sessionDates.set(key, { first: s.session_date, last: s.session_date })
      } else {
        if (s.session_date < cur.first) cur.first = s.session_date
        if (s.session_date > cur.last) cur.last = s.session_date
      }
    }
  }

  raw.completedProjects = evalRowsCast.map(r => {
    const ppl = r.planning_project_log
    const key = ppl ? `${ppl.planning_id}::${r.project_id}` : ''
    const dates = key ? sessionDates.get(key) : undefined
    const totalXp = (r.skill_evaluations ?? []).reduce((sum, se) => sum + se.xp_awarded, 0)
    return {
      projectId: r.project_id,
      projectName: ppl?.projects?.name ?? '—',
      planningId: ppl?.planning_id ?? '',
      planningProjectLogId: ppl?.id ?? '',
      evaluationId: r.id,
      studentId: r.student_id,
      firstSessionDate: dates?.first ?? null,
      lastSessionDate: dates?.last ?? null,
      totalXp,
      skills: (r.skill_evaluations ?? []).map(se => ({
        skillId: se.skill_id,
        name_es: se.skills?.name_es ?? '',
        name_en: se.skills?.name_en ?? '',
        name_ca: se.skills?.name_ca ?? '',
        xp_awarded: se.xp_awarded,
        branchColor: se.skills?.branches?.color ?? null,
      })),
    }
  })

  // --- Current project from active group's active planning ---
  const activeEnrollment = raw.group_enrollments.find(e => e.is_active)
  raw.currentProject = null

  if (activeEnrollment?.groups?.id) {
    const { data: planData } = await supabase
      .from('plannings')
      .select('id, planning_project_log(id, project_id, assigned_at, projects(name))')
      .eq('group_id', activeEnrollment.groups.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    type RawPlanData = {
      id: string
      planning_project_log: Array<{
        id: string
        project_id: string
        assigned_at: string
        projects: { name: string } | null
      }>
    }

    if (planData) {
      const plan = planData as unknown as RawPlanData
      const logs = (plan.planning_project_log ?? []).sort(
        (a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
      )
      const latestLog = logs[0]
      if (latestLog?.projects?.name) {
        raw.currentProject = {
          projectName: latestLog.projects.name,
          groupName: activeEnrollment.groups.name,
        }
      }
    }
  }

  return raw
}
