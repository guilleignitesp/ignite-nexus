import { createClient } from '@/lib/supabase-server'

// ─── Interfaces públicas ───────────────────────────────────────────────────

export const PAGE_LIMIT = 20

export interface TeacherResource {
  id: string
  title: string
  url: string
  resourceType: string | null // 'presentation' | 'guide' | null
}

export interface AdminResource {
  id: string
  title: string
  url: string
  resourceType: string | null
  targetRole: string | null    // null | 'worker' | 'student'
  visibleToType: string | null // null | 'school' | 'group'
  visibleToId: string | null
  visibleToName: string | null // nombre resuelto (escuela o grupo)
  isActive: boolean
  createdAt: string
}

export interface ScopeOption {
  id: string
  name: string
  schoolName?: string // solo para grupos
}

// ─── Tipos raw ─────────────────────────────────────────────────────────────

type RawResource = {
  id: string
  title: string
  url: string
  resource_type: string | null
  target_role: string | null
  visible_to_type: string | null
  visible_to_id: string | null
  is_active: boolean
  created_at: string
}

// ─── getTeacherResources ───────────────────────────────────────────────────
// RLS ya filtra por rol y visibilidad; esta función solo ordena.

export async function getTeacherResources(): Promise<TeacherResource[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('global_resources')
    .select('id, title, url, resource_type')
    .eq('is_active', true)
    .order('title')

  if (error) return []

  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    url: r.url,
    resourceType: r.resource_type,
  }))
}

// ─── getAdminResourcesPage ─────────────────────────────────────────────────

export async function getAdminResourcesPage(
  search: string,
  page: number
): Promise<{ items: AdminResource[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('global_resources')
    .select('id, title, url, resource_type, target_role, visible_to_type, visible_to_id, is_active, created_at', {
      count: 'exact',
    })
    .order('title')
    .range(page * PAGE_LIMIT, (page + 1) * PAGE_LIMIT - 1)

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data, count, error } = await query
  if (error) return { items: [], total: 0 }

  const raw = (data ?? []) as RawResource[]

  // Resolver nombres en paralelo con los IDs presentes en esta página
  const schoolIds = [...new Set(raw.filter((r) => r.visible_to_type === 'school' && r.visible_to_id).map((r) => r.visible_to_id as string))]
  const groupIds = [...new Set(raw.filter((r) => r.visible_to_type === 'group' && r.visible_to_id).map((r) => r.visible_to_id as string))]

  const [schoolsResult, groupsResult] = await Promise.all([
    schoolIds.length > 0
      ? supabase.from('schools').select('id, name').in('id', schoolIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    groupIds.length > 0
      ? supabase.from('groups').select('id, name').in('id', groupIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ])

  const schoolMap = new Map((schoolsResult.data ?? []).map((s) => [s.id, s.name]))
  const groupMap = new Map((groupsResult.data ?? []).map((g) => [g.id, g.name]))

  const items: AdminResource[] = raw.map((r) => {
    let visibleToName: string | null = null
    if (r.visible_to_type === 'school' && r.visible_to_id) {
      visibleToName = schoolMap.get(r.visible_to_id) ?? null
    } else if (r.visible_to_type === 'group' && r.visible_to_id) {
      visibleToName = groupMap.get(r.visible_to_id) ?? null
    }
    return {
      id: r.id,
      title: r.title,
      url: r.url,
      resourceType: r.resource_type,
      targetRole: r.target_role,
      visibleToType: r.visible_to_type,
      visibleToId: r.visible_to_id,
      visibleToName,
      isActive: r.is_active,
      createdAt: r.created_at,
    }
  })

  return { items, total: count ?? 0 }
}

// ─── Selectores para el formulario ────────────────────────────────────────

export async function getSchoolsForSelect(): Promise<ScopeOption[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('schools')
    .select('id, name')
    .eq('is_active', true)
    .order('name')
  return (data ?? []).map((s) => ({ id: s.id, name: s.name }))
}

export async function getGroupsForSelect(): Promise<ScopeOption[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('groups')
    .select('id, name, schools(name)')
    .eq('is_active', true)
    .order('name')
  return ((data ?? []) as unknown as { id: string; name: string; schools: { name: string } | null }[]).map((g) => ({
    id: g.id,
    name: g.name,
    schoolName: g.schools?.name ?? '',
  }))
}
