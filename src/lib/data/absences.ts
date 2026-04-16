import { createClient } from '@/lib/supabase-server'
import type { AbsenceStatus } from '@/types'

// ─── Interfaces públicas ───────────────────────────────────────────────────

export const PAGE_LIMIT = 20

export interface AbsenceReason {
  id: string
  nameEs: string
  nameEn: string
  nameCa: string
  autoApprove: boolean
}

export interface MyAbsence {
  id: string
  reasonName: string // ya localizado
  startDate: string
  endDate: string
  status: AbsenceStatus
  comment: string | null
  createdAt: string
}

export interface AdminAbsenceItem {
  id: string
  workerFirstName: string
  workerLastName: string
  reasonName: string
  startDate: string
  endDate: string
  status: AbsenceStatus
  comment: string | null
  createdAt: string
}

// ─── Tipos raw ─────────────────────────────────────────────────────────────

type RawAbsenceReason = {
  name_es: string
  name_en: string
  name_ca: string
}

type RawMyAbsence = {
  id: string
  start_date: string
  end_date: string
  status: string
  comment: string | null
  created_at: string
  absence_reasons: RawAbsenceReason | null
}

type RawAdminAbsence = {
  id: string
  start_date: string
  end_date: string
  status: string
  comment: string | null
  created_at: string
  workers: { first_name: string; last_name: string } | null
  absence_reasons: RawAbsenceReason | null
}

// ─── Helper ────────────────────────────────────────────────────────────────

function pickName(r: RawAbsenceReason | null, locale: string): string {
  if (!r) return ''
  if (locale === 'en') return r.name_en
  if (locale === 'ca') return r.name_ca
  return r.name_es
}

// ─── getMyAbsences ─────────────────────────────────────────────────────────

export async function getMyAbsences(workerId: string, locale: string): Promise<MyAbsence[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('absences')
    .select(`
      id, start_date, end_date, status, comment, created_at,
      absence_reasons(name_es, name_en, name_ca)
    `)
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false })

  if (error) return []

  return ((data ?? []) as unknown as RawMyAbsence[]).map((r) => ({
    id: r.id,
    reasonName: pickName(r.absence_reasons, locale),
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status as AbsenceStatus,
    comment: r.comment,
    createdAt: r.created_at,
  }))
}

// ─── getAbsenceReasons ─────────────────────────────────────────────────────

export async function getAbsenceReasons(): Promise<AbsenceReason[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('absence_reasons')
    .select('id, name_es, name_en, name_ca, auto_approve')
    .eq('is_active', true)
    .order('name_es')

  if (error) return []

  return (data ?? []).map((r) => ({
    id: r.id,
    nameEs: r.name_es,
    nameEn: r.name_en,
    nameCa: r.name_ca,
    autoApprove: r.auto_approve,
  }))
}

// ─── getAdminAbsencesPage ──────────────────────────────────────────────────

export async function getAdminAbsencesPage(
  status: string,
  page: number,
  locale: string
): Promise<{ items: AdminAbsenceItem[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('absences')
    .select(
      `id, start_date, end_date, status, comment, created_at,
       workers(first_name, last_name),
       absence_reasons(name_es, name_en, name_ca)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(page * PAGE_LIMIT, (page + 1) * PAGE_LIMIT - 1)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, count, error } = await query

  if (error) return { items: [], total: 0 }

  const items = ((data ?? []) as unknown as RawAdminAbsence[]).map((r) => ({
    id: r.id,
    workerFirstName: r.workers?.first_name ?? '',
    workerLastName: r.workers?.last_name ?? '',
    reasonName: pickName(r.absence_reasons, locale),
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status as AbsenceStatus,
    comment: r.comment,
    createdAt: r.created_at,
  }))

  return { items, total: count ?? 0 }
}
