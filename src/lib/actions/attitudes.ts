'use server'

import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'

// ─── Guard ─────────────────────────────────────────────────────────────────

async function assertAttitudesAccess(): Promise<void> {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!profile.isSuperAdmin && !profile.adminModules.includes('attitudes')) {
    throw new Error('Unauthorized')
  }
}

// ─── createAttitudeAction ──────────────────────────────────────────────────

export async function createAttitudeAction(
  nameEs: string,
  nameEn: string,
  nameCa: string,
  xpValue: number,
  description: string
): Promise<void> {
  await assertAttitudesAccess()
  const supabase = await createClient()

  const { error } = await supabase.from('attitude_actions').insert({
    name_es: nameEs.trim(),
    name_en: nameEn.trim(),
    name_ca: nameCa.trim(),
    xp_value: xpValue,
    description: description.trim() || null,
  })

  if (error) throw new Error(error.message)
}

// ─── updateAttitudeAction ──────────────────────────────────────────────────

export async function updateAttitudeAction(
  id: string,
  nameEs: string,
  nameEn: string,
  nameCa: string,
  xpValue: number,
  description: string
): Promise<void> {
  await assertAttitudesAccess()
  const supabase = await createClient()

  const { error } = await supabase
    .from('attitude_actions')
    .update({
      name_es: nameEs.trim(),
      name_en: nameEn.trim(),
      name_ca: nameCa.trim(),
      xp_value: xpValue,
      description: description.trim() || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ─── toggleAttitudeStatus ──────────────────────────────────────────────────

export async function toggleAttitudeStatus(id: string, isActive: boolean): Promise<void> {
  await assertAttitudesAccess()
  const supabase = await createClient()

  const { error } = await supabase
    .from('attitude_actions')
    .update({ is_active: !isActive })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
