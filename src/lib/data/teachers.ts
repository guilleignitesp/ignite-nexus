import { createClient } from '@/lib/supabase-server'

export const PAGE_LIMIT = 15

export interface TeacherListItem {
  id: string
  first_name: string
  last_name: string
  status: 'active' | 'inactive'
  created_at: string
  is_admin: boolean
  is_superadmin: boolean
  active_group_count: number
}

export interface WorkerPermission {
  id: string
  module: string
  can_view: boolean
  can_edit: boolean
  is_superadmin: boolean
}

export interface AssignedGroup {
  assignment_id: string
  group_id: string
  group_name: string
  school_name: string
  start_date: string
  end_date: string | null
}

export interface TeacherProfile {
  id: string
  first_name: string
  last_name: string
  status: 'active' | 'inactive'
  created_at: string
  permissions: WorkerPermission[]
  current_groups: AssignedGroup[]
}

type RawPermission = {
  module: string
  can_view: boolean
  can_edit: boolean
  is_superadmin: boolean
}

type RawAssignment = {
  id: string
  end_date: string | null
}

type RawWorkerListItem = {
  id: string
  first_name: string
  last_name: string
  status: string
  created_at: string
  admin_permissions: RawPermission[]
  group_assignments: RawAssignment[]
}

type RawPermissionFull = {
  id: string
  module: string
  can_view: boolean
  can_edit: boolean
  is_superadmin: boolean
}

type RawSchool = { id: string; name: string } | null

type RawGroup = {
  id: string
  name: string
  schools: RawSchool
} | null

type RawAssignmentFull = {
  id: string
  start_date: string
  end_date: string | null
  groups: RawGroup
}

type RawWorkerProfile = {
  id: string
  first_name: string
  last_name: string
  status: string
  created_at: string
  admin_permissions: RawPermissionFull[]
  group_assignments: RawAssignmentFull[]
}

export async function getWorkersPage(
  search: string,
  page: number
): Promise<{ workers: TeacherListItem[]; total: number }> {
  const supabase = await createClient()

  const from = page * PAGE_LIMIT
  const to = from + PAGE_LIMIT - 1

  let query = supabase
    .from('workers')
    .select(
      'id, first_name, last_name, status, created_at, admin_permissions(module, can_view, can_edit, is_superadmin), group_assignments(id, end_date)',
      { count: 'exact' }
    )

  if (search.trim().length > 0) {
    query = query.or(
      `last_name.ilike.%${search.trim()}%,first_name.ilike.%${search.trim()}%`
    )
  }

  const { data, count, error } = await query
    .order('last_name')
    .order('first_name')
    .range(from, to)

  if (error) throw new Error(error.message)

  const workers: TeacherListItem[] = (data as RawWorkerListItem[]).map((w) => {
    const perms = w.admin_permissions ?? []
    const assignments = w.group_assignments ?? []
    return {
      id: w.id,
      first_name: w.first_name,
      last_name: w.last_name,
      status: w.status as 'active' | 'inactive',
      created_at: w.created_at,
      is_admin: perms.length > 0,
      is_superadmin: perms.some((p) => p.is_superadmin),
      active_group_count: assignments.filter((a) => a.end_date === null).length,
    }
  })

  return { workers, total: count ?? 0 }
}

export async function getWorkerProfile(
  workerId: string
): Promise<TeacherProfile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workers')
    .select(
      'id, first_name, last_name, status, created_at, admin_permissions(id, module, can_view, can_edit, is_superadmin), group_assignments(id, start_date, end_date, groups(id, name, schools(id, name)))'
    )
    .eq('id', workerId)
    .single()

  if (error || !data) return null

  const raw = data as unknown as RawWorkerProfile

  const permissions: WorkerPermission[] = (raw.admin_permissions ?? []).map(
    (p) => ({
      id: p.id,
      module: p.module,
      can_view: p.can_view,
      can_edit: p.can_edit,
      is_superadmin: p.is_superadmin,
    })
  )

  const current_groups: AssignedGroup[] = (raw.group_assignments ?? [])
    .filter((a) => a.end_date === null)
    .map((a) => ({
      assignment_id: a.id,
      group_id: a.groups?.id ?? '',
      group_name: a.groups?.name ?? '',
      school_name: a.groups?.schools?.name ?? '',
      start_date: a.start_date,
      end_date: a.end_date,
    }))

  return {
    id: raw.id,
    first_name: raw.first_name,
    last_name: raw.last_name,
    status: raw.status as 'active' | 'inactive',
    created_at: raw.created_at,
    permissions,
    current_groups,
  }
}
