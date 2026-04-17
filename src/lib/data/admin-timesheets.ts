import { createClient } from '@/lib/supabase-server'

// ─── Interfaces públicas ───────────────────────────────────────────────────

export const PAGE_LIMIT = 25

export interface AdminTimesheetEntry {
  id: string
  workerId: string
  workerFirstName: string
  workerLastName: string
  type: 'in' | 'out'
  recordedAt: string // ISO timestamptz
}

// ─── Tipos raw ─────────────────────────────────────────────────────────────

type RawEntry = {
  id: string
  worker_id: string
  type: string
  recorded_at: string
  workers: { first_name: string; last_name: string } | null
}

// ─── getAdminTimesheetPage ─────────────────────────────────────────────────

export async function getAdminTimesheetPage(
  workerId: string,
  dateFrom: string,
  dateTo: string,
  page: number
): Promise<{ items: AdminTimesheetEntry[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('timesheets')
    .select('id, worker_id, type, recorded_at, workers(first_name, last_name)', {
      count: 'exact',
    })
    .order('recorded_at', { ascending: false })
    .range(page * PAGE_LIMIT, (page + 1) * PAGE_LIMIT - 1)

  if (workerId) {
    query = query.eq('worker_id', workerId)
  }
  if (dateFrom) {
    query = query.gte('recorded_at', `${dateFrom}T00:00:00`)
  }
  if (dateTo) {
    query = query.lte('recorded_at', `${dateTo}T23:59:59`)
  }

  const { data, count, error } = await query

  if (error) throw new Error(error.message)

  const items = ((data ?? []) as unknown as RawEntry[]).map((r) => ({
    id: r.id,
    workerId: r.worker_id,
    workerFirstName: r.workers?.first_name ?? '',
    workerLastName: r.workers?.last_name ?? '',
    type: r.type as 'in' | 'out',
    recordedAt: r.recorded_at,
  }))

  return { items, total: count ?? 0 }
}
