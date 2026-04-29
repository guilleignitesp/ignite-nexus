'use server'

import { updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { getUserProfile } from '@/lib/auth'

export interface ProjectFullDetails {
  id: string
  name: string
  description: string | null
  material_type: string | null
  recommended_hours: number | null
  resources: { title: string; url: string; type: 'presentation' | 'guide' }[]
  skills: { rank: number; name_es: string; branch_name_es: string; branch_color: string }[]
}

type RawPFD = {
  id: string
  name: string
  description: string | null
  material_type: string | null
  recommended_hours: number | null
  project_resources: { title: string; url: string; type: 'presentation' | 'guide' }[]
  project_skills: {
    rank: number | null
    skills: { name_es: string; branches: { name_es: string; color: string } | null } | null
  }[]
}

export async function getProjectFullDetails(
  projectId: string
): Promise<ProjectFullDetails | null> {
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await supabase
    .from('projects')
    .select(
      `id, name, description, material_type, recommended_hours,
      project_resources(title, url, type),
      project_skills(rank, skills(name_es, branches(name_es, color)))`
    )
    .eq('id', projectId)
    .single()
  if (error || !data) return null
  const raw = data as unknown as RawPFD
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    material_type: raw.material_type,
    recommended_hours: raw.recommended_hours,
    resources: (raw.project_resources ?? []) as ProjectFullDetails['resources'],
    skills: (raw.project_skills ?? []).map((ps) => ({
      rank: ps.rank ?? 1,
      name_es: ps.skills?.name_es ?? '',
      branch_name_es: ps.skills?.branches?.name_es ?? '',
      branch_color: ps.skills?.branches?.color ?? '#000000',
    })),
  }
}

async function assertProjectMapsAccess(): Promise<void> {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!profile.isSuperAdmin && !profile.adminModules.includes('project_maps')) {
    throw new Error('Unauthorized')
  }
}

export async function createProjectMap(name: string, description: string): Promise<string> {
  await assertProjectMapsAccess()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('project_maps')
    .insert({ name: name.trim(), description: description.trim() || null })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  updateTag('project-maps')
  return data.id
}

interface SaveMapInput {
  nodes: { projectId: string }[]
  edges: { fromProjectId: string; toProjectId: string; percentage: number | null; label: string | null }[]
  initialProjectId: string | null
}

export async function saveProjectMap(mapId: string, input: SaveMapInput): Promise<void> {
  await assertProjectMapsAccess()
  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('project_maps')
    .update({ initial_project_id: input.initialProjectId })
    .eq('id', mapId)
  if (updateError) throw new Error(updateError.message)

  const { error: delNodesError } = await supabase
    .from('project_map_nodes')
    .delete()
    .eq('map_id', mapId)
  if (delNodesError) throw new Error(delNodesError.message)

  if (input.nodes.length > 0) {
    const { error } = await supabase.from('project_map_nodes').insert(
      input.nodes.map((n) => ({ map_id: mapId, project_id: n.projectId }))
    )
    if (error) throw new Error(error.message)
  }

  const { error: delEdgesError } = await supabase
    .from('project_map_edges')
    .delete()
    .eq('map_id', mapId)
  if (delEdgesError) throw new Error(delEdgesError.message)

  if (input.edges.length > 0) {
    const { error } = await supabase.from('project_map_edges').insert(
      input.edges.map((e) => ({
        map_id: mapId,
        from_project_id: e.fromProjectId,
        to_project_id: e.toProjectId,
        percentage: e.percentage,
        label: e.label,
      }))
    )
    if (error) throw new Error(error.message)
  }

  updateTag('project-maps')
  updateTag('projects')
}

export async function toggleProjectMapStatus(id: string, currentIsActive: boolean): Promise<void> {
  await assertProjectMapsAccess()
  const supabase = await createClient()
  const { error } = await supabase
    .from('project_maps')
    .update({ is_active: !currentIsActive })
    .eq('id', id)
  if (error) throw new Error(error.message)
  updateTag('project-maps')
}
