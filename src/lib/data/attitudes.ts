import { createClient } from '@/lib/supabase-server'

// ─── Interfaces públicas ───────────────────────────────────────────────────

export interface AttitudeAction {
  id: string
  nameEs: string
  nameEn: string
  nameCa: string
  description: string | null
  xpValue: number
  isActive: boolean
}

// ─── Tipos raw ─────────────────────────────────────────────────────────────

type RawAttitudeAction = {
  id: string
  name_es: string
  name_en: string
  name_ca: string
  description: string | null
  xp_value: number
  is_active: boolean
}

// ─── getAttitudeActions ────────────────────────────────────────────────────

export async function getAttitudeActions(): Promise<AttitudeAction[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attitude_actions')
    .select('id, name_es, name_en, name_ca, description, xp_value, is_active')
    .order('name_es')

  if (error) throw new Error(error.message)

  return ((data ?? []) as unknown as RawAttitudeAction[]).map((r) => ({
    id: r.id,
    nameEs: r.name_es,
    nameEn: r.name_en,
    nameCa: r.name_ca,
    description: r.description,
    xpValue: r.xp_value,
    isActive: r.is_active,
  }))
}
