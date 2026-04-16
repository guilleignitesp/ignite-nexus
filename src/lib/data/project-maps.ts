import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'

export interface MapListItem {
  id: string
  name: string
  description: string | null
  is_active: boolean
  node_count: number
}

export interface MapNodeDetail {
  projectId: string
  projectName: string
  materialType: string | null
  recommendedHours: number | null
}

export interface MapEdgeDetail {
  fromProjectId: string
  toProjectId: string
}

export interface MapDetail {
  id: string
  name: string
  description: string | null
  is_active: boolean
  initial_project_id: string | null
  nodes: MapNodeDetail[]
  edges: MapEdgeDetail[]
}

type RawMapListItem = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  project_map_nodes: { project_id: string }[]
}

export const getProjectMapsList = unstable_cache(
  async (): Promise<MapListItem[]> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .from('project_maps')
      .select('id, name, description, is_active, project_map_nodes(project_id)')
      .order('name')
    if (error) throw new Error(error.message)
    return ((data ?? []) as unknown as RawMapListItem[]).map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      is_active: m.is_active,
      node_count: (m.project_map_nodes ?? []).length,
    }))
  },
  ['project-maps'],
  { tags: ['project-maps'], revalidate: false }
)

type RawMapDetail = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  initial_project_id: string | null
  project_map_nodes: {
    project_id: string
    projects: {
      id: string
      name: string
      material_type: string | null
      recommended_hours: number | null
    } | null
  }[]
  project_map_edges: {
    from_project_id: string
    to_project_id: string
  }[]
}

export async function getProjectMapDetail(id: string): Promise<MapDetail | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('project_maps')
    .select(
      `id, name, description, is_active, initial_project_id,
      project_map_nodes(project_id, projects(id, name, material_type, recommended_hours)),
      project_map_edges(from_project_id, to_project_id)`
    )
    .eq('id', id)
    .single()
  if (error || !data) return null
  const raw = data as unknown as RawMapDetail
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    is_active: raw.is_active,
    initial_project_id: raw.initial_project_id,
    nodes: (raw.project_map_nodes ?? []).map((n) => ({
      projectId: n.project_id,
      projectName: n.projects?.name ?? '',
      materialType: n.projects?.material_type ?? null,
      recommendedHours: n.projects?.recommended_hours ?? null,
    })),
    edges: (raw.project_map_edges ?? []).map((e) => ({
      fromProjectId: e.from_project_id,
      toProjectId: e.to_project_id,
    })),
  }
}
