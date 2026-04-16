import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

export interface ProjectResource {
  id: string
  title: string
  url: string
  type: 'presentation' | 'guide'
}

export interface ProjectSkillEntry {
  id: string
  skill_id: string
  name_es: string
  name_en: string
  name_ca: string
  branch_name_es: string
  branch_name_en: string
  branch_name_ca: string
  branch_color: string
  base_xp: number
  difficulty_grade: number
}

export interface ProjectListItem {
  id: string
  name: string
  material_type: string | null
  recommended_hours: number | null
  description: string | null
  is_active: boolean
  map_names: string[]
  resources: ProjectResource[]
  skills: ProjectSkillEntry[]
}

type RawResource = {
  id: string
  title: string
  url: string
  type: 'presentation' | 'guide'
}

type RawProjectSkill = {
  id: string
  skill_id: string
  base_xp: number
  difficulty_grade: number | null
  skills: {
    name_es: string
    name_en: string
    name_ca: string
    branches: {
      name_es: string
      name_en: string
      name_ca: string
      color: string
    } | null
  } | null
}

type RawMapNode = {
  project_maps: { id: string; name: string } | null
}

type RawProject = {
  id: string
  name: string
  material_type: string | null
  recommended_hours: number | null
  description: string | null
  is_active: boolean
  project_resources: RawResource[]
  project_skills: RawProjectSkill[]
  project_map_nodes: RawMapNode[]
}

function transformProjects(raw: RawProject[]): ProjectListItem[] {
  return raw.map((p) => ({
    id: p.id,
    name: p.name,
    material_type: p.material_type,
    recommended_hours: p.recommended_hours,
    description: p.description,
    is_active: p.is_active,
    resources: (p.project_resources ?? []) as ProjectResource[],
    skills: (p.project_skills ?? []).map((ps) => ({
      id: ps.id,
      skill_id: ps.skill_id,
      name_es: ps.skills?.name_es ?? '',
      name_en: ps.skills?.name_en ?? '',
      name_ca: ps.skills?.name_ca ?? '',
      branch_name_es: ps.skills?.branches?.name_es ?? '',
      branch_name_en: ps.skills?.branches?.name_en ?? '',
      branch_name_ca: ps.skills?.branches?.name_ca ?? '',
      branch_color: ps.skills?.branches?.color ?? '#000000',
      base_xp: ps.base_xp,
      difficulty_grade: ps.difficulty_grade ?? 3,
    })),
    map_names: (p.project_map_nodes ?? [])
      .map((n) => n.project_maps?.name)
      .filter((n): n is string => !!n),
  }))
}

export const getProjectsList = unstable_cache(
  async (): Promise<ProjectListItem[]> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .from('projects')
      .select(
        `id, name, material_type, recommended_hours, description, is_active,
        project_resources(id, title, url, type),
        project_skills(id, skill_id, base_xp, difficulty_grade, skills(name_es, name_en, name_ca, branches(name_es, name_en, name_ca, color))),
        project_map_nodes(project_maps(id, name))`
      )
      .order('name')
    if (error) throw new Error(error.message)
    return transformProjects((data ?? []) as unknown as RawProject[])
  },
  ['projects'],
  { tags: ['projects'], revalidate: false }
)
