import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

export interface PlatformSettings {
  platform_name: string
  platform_logo_url: string | null
}

export interface SchoolYear {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

// Crea un cliente sin contexto de sesión — las tablas tienen política public_read
function getPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const getSettings = unstable_cache(
  async (): Promise<PlatformSettings> => {
    const supabase = getPublicSupabase()
    const { data } = await supabase.from('platform_settings').select('key, value')
    const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
    return {
      platform_name: map['platform_name'] ?? 'IGNITE NEXUS',
      platform_logo_url: map['platform_logo_url'] ?? null,
    }
  },
  ['platform_settings'],
  { tags: ['platform_settings'], revalidate: false }
)

export const getSchoolYears = unstable_cache(
  async (): Promise<SchoolYear[]> => {
    const supabase = getPublicSupabase()
    const { data } = await supabase
      .from('school_years')
      .select('id, name, start_date, end_date, is_active, created_at')
      .order('start_date', { ascending: false })
    return data ?? []
  },
  ['school_years'],
  { tags: ['school_years'], revalidate: false }
)
