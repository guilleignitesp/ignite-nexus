'use server'

import { updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'

async function assertSkillsAccess(): Promise<void> {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!profile.isSuperAdmin && !profile.adminModules.includes('skills')) {
    throw new Error('Unauthorized')
  }
}

export async function updateBranch(
  id: string,
  input: {
    name_es: string
    name_en: string
    name_ca: string
    color: string
  }
): Promise<void> {
  await assertSkillsAccess()
  const supabase = await createClient()
  const { error } = await supabase
    .from('branches')
    .update({
      name_es: input.name_es.trim(),
      name_en: input.name_en.trim(),
      name_ca: input.name_ca.trim(),
      color: input.color,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  updateTag('skills')
}

export async function createSkill(input: {
  branch_id: string
  name_es: string
  name_en: string
  name_ca: string
  description: string
  base_xp: number
}): Promise<void> {
  await assertSkillsAccess()
  const supabase = await createClient()
  const { error } = await supabase.from('skills').insert({
    branch_id: input.branch_id,
    name_es: input.name_es.trim(),
    name_en: input.name_en.trim(),
    name_ca: input.name_ca.trim(),
    description: input.description.trim() || null,
    base_xp: Math.max(1, Math.round(input.base_xp)),
  })
  if (error) throw new Error(error.message)
  updateTag('skills')
}

export async function updateSkill(
  id: string,
  input: {
    name_es: string
    name_en: string
    name_ca: string
    description: string
    base_xp: number
  }
): Promise<void> {
  await assertSkillsAccess()
  const supabase = await createClient()
  const { error } = await supabase
    .from('skills')
    .update({
      name_es: input.name_es.trim(),
      name_en: input.name_en.trim(),
      name_ca: input.name_ca.trim(),
      description: input.description.trim() || null,
      base_xp: Math.max(1, Math.round(input.base_xp)),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  updateTag('skills')
}

export async function toggleSkillStatus(id: string, currentIsActive: boolean): Promise<void> {
  await assertSkillsAccess()
  const supabase = await createClient()
  const { error } = await supabase
    .from('skills')
    .update({ is_active: !currentIsActive })
    .eq('id', id)
  if (error) throw new Error(error.message)
  updateTag('skills')
}
