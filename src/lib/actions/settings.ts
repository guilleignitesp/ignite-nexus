'use server'

import { updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'

async function assertSuperAdmin() {
  const profile = await getUserProfile()
  if (!profile?.isSuperAdmin) throw new Error('Unauthorized')
}

export async function updatePlatformName(name: string): Promise<void> {
  await assertSuperAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('platform_settings')
    .update({ value: name.trim(), updated_at: new Date().toISOString() })
    .eq('key', 'platform_name')
  if (error) throw new Error(error.message)
  updateTag('platform_settings')
}

export async function createSchoolYear(
  name: string,
  startDate: string,
  endDate: string
): Promise<void> {
  await assertSuperAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('school_years').insert({
    name: name.trim(),
    start_date: startDate,
    end_date: endDate,
    is_active: false,
  })
  if (error) throw new Error(error.message)
  updateTag('school_years')
}

export async function activateSchoolYear(id: string): Promise<void> {
  await assertSuperAdmin()
  const supabase = await createClient()
  // Desactivar todos, luego activar el seleccionado
  await supabase.from('school_years').update({ is_active: false }).neq('id', id)
  const { error } = await supabase
    .from('school_years')
    .update({ is_active: true })
    .eq('id', id)
  if (error) throw new Error(error.message)
  updateTag('school_years')
}

export async function closeCourse(id: string, confirmedName: string): Promise<void> {
  await assertSuperAdmin()
  const supabase = await createClient()

  // Verificar que el curso existe, está activo y el nombre coincide
  const { data: year } = await supabase
    .from('school_years')
    .select('name, is_active')
    .eq('id', id)
    .single()

  if (!year) throw new Error('Curso no encontrado')
  if (!year.is_active) throw new Error('El curso no está activo')
  if (year.name !== confirmedName) throw new Error('El nombre no coincide')

  const { error } = await supabase
    .from('school_years')
    .update({ is_active: false })
    .eq('id', id)
  if (error) throw new Error(error.message)
  updateTag('school_years')
}
