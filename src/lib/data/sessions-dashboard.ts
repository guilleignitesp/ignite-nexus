import { unstable_cache } from 'next/cache'
import { createClient as createPublicClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-server'

// ─── Types ────────────────────────────────────────────────────

export interface DashboardSchool {
  id: string
  name: string
  groups: DashboardGroup[]
}

export interface DashboardGroup {
  id: string
  name: string
  is_active: boolean
  schedule: { weekday: number; startTime: string; endTime: string }[]
}

export interface WeekSession {
  id: string
  groupId: string
  date: string
  startTime: string
  endTime: string
  minTeachersRequired: number
  status: 'pending' | 'completed' | 'suspended' | 'holiday'
  isConsolidated: boolean
  teacherChanges: {
    id: string
    workerId: string
    type: 'substitute' | 'absent'
    isActive: boolean
  }[]
}

export interface ActiveAssignment {
  id: string
  groupId: string
  workerId: string
  workerFirstName: string
  workerLastName: string
  workerStatus: string
}

// ─── Week helpers ─────────────────────────────────────────────

export { getMondayOf, addDays } from '@/lib/utils/week-helpers'

// ─── Raw types for Q1 ─────────────────────────────────────────

type RawScheduleItem = {
  weekday: number
  start_time: string
  end_time: string
}

type RawDashboardGroup = {
  id: string
  name: string
  is_active: boolean
  group_schedule: RawScheduleItem[]
}

type RawDashboardSchool = {
  id: string
  name: string
  groups: RawDashboardGroup[]
}

// ─── Raw types for Q2 ─────────────────────────────────────────

type RawWeekSession = {
  id: string
  session_date: string
  start_time: string
  end_time: string
  min_teachers_required: number
  status: string
  is_consolidated: boolean
  plannings: { group_id: string } | null
  session_teacher_assignments: {
    id: string
    worker_id: string
    type: string
    is_active: boolean
  }[]
}

// ─── Raw types for Q3 ─────────────────────────────────────────

type RawAssignment = {
  id: string
  group_id: string
  worker_id: string
  workers: { id: string; first_name: string; last_name: string; status: string } | null
}

// ─── Q1: Schools (cached, public) ────────────────────────────

export const getSchoolsForDashboard = unstable_cache(
  async (): Promise<DashboardSchool[]> => {
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from('schools')
      .select(
        'id, name, groups(id, name, is_active, group_schedule(weekday, start_time, end_time))'
      )
      .eq('is_active', true)
      .order('name')

    if (error) throw new Error(error.message)

    const raw = (data ?? []) as unknown as RawDashboardSchool[]

    return raw.map((school) => ({
      id: school.id,
      name: school.name,
      groups: (school.groups ?? [])
        .filter((g) => g.is_active !== false)
        .map((g) => ({
          id: g.id,
          name: g.name,
          is_active: g.is_active,
          schedule: (g.group_schedule ?? []).map((s) => ({
            weekday: s.weekday,
            startTime: s.start_time,
            endTime: s.end_time,
          })),
        })),
    }))
  },
  ['schools'],
  { tags: ['schools'], revalidate: false }
)

// ─── Q2: Week sessions (live, authenticated) ─────────────────

export async function getWeekSessions(
  weekStart: string,
  weekEnd: string
): Promise<WeekSession[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sessions')
    .select(
      'id, session_date, start_time, end_time, min_teachers_required, status, is_consolidated, plannings(group_id), session_teacher_assignments(id, worker_id, type, is_active)'
    )
    .gte('session_date', weekStart)
    .lte('session_date', weekEnd)

  if (error) throw new Error(error.message)

  const raw = (data ?? []) as unknown as RawWeekSession[]

  return raw
    .filter((s) => s.plannings !== null)
    .map((s) => ({
      id: s.id,
      groupId: s.plannings!.group_id,
      date: s.session_date,
      startTime: s.start_time,
      endTime: s.end_time,
      minTeachersRequired: s.min_teachers_required ?? 1,
      status: s.status as WeekSession['status'],
      isConsolidated: s.is_consolidated ?? false,
      teacherChanges: (s.session_teacher_assignments ?? []).map((tc) => ({
        id: tc.id,
        workerId: tc.worker_id,
        type: tc.type as 'substitute' | 'absent',
        isActive: tc.is_active,
      })),
    }))
}

// ─── Q3: Active permanent assignments (live, authenticated) ──

export async function getActiveGroupAssignments(): Promise<ActiveAssignment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('group_assignments')
    .select('id, group_id, worker_id, workers(id, first_name, last_name, status)')
    .is('end_date', null)
    .eq('type', 'permanent')
    .eq('is_active', true)

  if (error) throw new Error(error.message)

  const raw = (data ?? []) as unknown as RawAssignment[]

  return raw
    .filter((a) => a.workers !== null)
    .map((a) => ({
      id: a.id,
      groupId: a.group_id,
      workerId: a.worker_id,
      workerFirstName: a.workers!.first_name,
      workerLastName: a.workers!.last_name,
      workerStatus: a.workers!.status,
    }))
}
