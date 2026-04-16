'use server'

import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'

async function assertResourcesAccess(): Promise<void> {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!profile.isSuperAdmin && !profile.adminModules.includes('resources')) {
    throw new Error('Unauthorized')
  }
}

interface ResourceInput {
  title: string
  url: string
  resourceType: string | null
  targetRole: string | null  // null | 'worker' | 'student'
  visibleToType: string | null // null | 'school' | 'group'
  visibleToId: string | null
}

// ─── createGlobalResource ──────────────────────────────────────────────────

export async function createGlobalResource(input: ResourceInput): Promise<void> {
  await assertResourcesAccess()
  const supabase = await createClient()

  const { error } = await supabase.from('global_resources').insert({
    title: input.title,
    url: input.url,
    resource_type: input.resourceType || null,
    target_role: input.targetRole || null,
    visible_to_type: input.visibleToType || null,
    visible_to_id: input.visibleToId || null,
  })

  if (error) throw new Error(error.message)
}

// ─── updateGlobalResource ──────────────────────────────────────────────────

export async function updateGlobalResource(id: string, input: ResourceInput): Promise<void> {
  await assertResourcesAccess()
  const supabase = await createClient()

  const { error } = await supabase
    .from('global_resources')
    .update({
      title: input.title,
      url: input.url,
      resource_type: input.resourceType || null,
      target_role: input.targetRole || null,
      visible_to_type: input.visibleToType || null,
      visible_to_id: input.visibleToId || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ─── toggleGlobalResourceStatus ───────────────────────────────────────────

export async function toggleGlobalResourceStatus(id: string, isActive: boolean): Promise<void> {
  await assertResourcesAccess()
  const supabase = await createClient()

  const { error } = await supabase
    .from('global_resources')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
