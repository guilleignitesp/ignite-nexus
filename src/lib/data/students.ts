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
  attitude_xp: number
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

export interface StudentProfile {
  id: string
  first_name: string
  last_name: string
  status: 'active' | 'inactive'
  created_at: string
  group_enrollments: GroupEnrollment[]
  student_xp: StudentXPEntry[]
  project_evaluations: ProjectEvaluation[]
  attitude_logs: AttitudeLogEntry[]
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
      id, first_name, last_name, status, created_at,
      group_enrollments(
        id, is_active, enrolled_at, left_at,
        groups(id, name, schools(name), school_years(name))
      ),
      student_xp(
        academic_xp, attitude_xp, total_xp, level,
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

  return raw
}
