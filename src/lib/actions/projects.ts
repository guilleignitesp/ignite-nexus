'use server'

import { updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'

async function assertProjectsAccess(): Promise<void> {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!profile.isSuperAdmin && !profile.adminModules.includes('projects')) {
    throw new Error('Unauthorized')
  }
}

interface ProjectInput {
  name: string
  description: string
  material_type: string
  recommended_hours: string
  resources: { title: string; url: string; type: 'presentation' | 'guide' }[]
  skills: { skill_id: string; rank: number }[]
}

function parseHours(raw: string): number | null {
  if (!raw.trim()) return null
  const val = parseFloat(raw)
  return isNaN(val) || val <= 0 ? null : val
}

export async function createProject(input: ProjectInput): Promise<void> {
  await assertProjectsAccess()
  const supabase = await createClient()

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      name: input.name.trim(),
      description: input.description.trim() || null,
      material_type: input.material_type.trim() || null,
      recommended_hours: parseHours(input.recommended_hours),
    })
    .select('id')
    .single()
  if (projectError) throw new Error(projectError.message)

  const validResources = input.resources.filter((r) => r.title.trim() && r.url.trim())
  if (validResources.length > 0) {
    const { error } = await supabase.from('project_resources').insert(
      validResources.map((r) => ({
        project_id: project.id,
        title: r.title.trim(),
        url: r.url.trim(),
        type: r.type,
      }))
    )
    if (error) throw new Error(error.message)
  }

  if (input.skills.length > 0) {
    const { error } = await supabase.from('project_skills').insert(
      input.skills.map((s) => ({
        project_id: project.id,
        skill_id: s.skill_id,
        rank: Math.max(1, Math.round(s.rank)),
      }))
    )
    if (error) throw new Error(error.message)
  }

  updateTag('projects')
}

export async function updateProject(id: string, input: ProjectInput): Promise<void> {
  await assertProjectsAccess()
  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('projects')
    .update({
      name: input.name.trim(),
      description: input.description.trim() || null,
      material_type: input.material_type.trim() || null,
      recommended_hours: parseHours(input.recommended_hours),
    })
    .eq('id', id)
  if (updateError) throw new Error(updateError.message)

  // Replace resources: delete existing, insert new
  const { error: delResourcesError } = await supabase
    .from('project_resources')
    .delete()
    .eq('project_id', id)
  if (delResourcesError) throw new Error(delResourcesError.message)

  const validResources = input.resources.filter((r) => r.title.trim() && r.url.trim())
  if (validResources.length > 0) {
    const { error } = await supabase.from('project_resources').insert(
      validResources.map((r) => ({
        project_id: id,
        title: r.title.trim(),
        url: r.url.trim(),
        type: r.type,
      }))
    )
    if (error) throw new Error(error.message)
  }

  // Replace skills: delete existing, insert new
  const { error: delSkillsError } = await supabase
    .from('project_skills')
    .delete()
    .eq('project_id', id)
  if (delSkillsError) throw new Error(delSkillsError.message)

  if (input.skills.length > 0) {
    const { error } = await supabase.from('project_skills').insert(
      input.skills.map((s) => ({
        project_id: id,
        skill_id: s.skill_id,
        rank: Math.max(1, Math.round(s.rank)),
      }))
    )
    if (error) throw new Error(error.message)
  }

  updateTag('projects')
}

export async function toggleProjectStatus(id: string, currentIsActive: boolean): Promise<void> {
  await assertProjectsAccess()
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({ is_active: !currentIsActive })
    .eq('id', id)
  if (error) throw new Error(error.message)
  updateTag('projects')
}
