import { createClient } from '@/lib/supabase-server'
import type { TimesheetType } from '@/types'

// ─── Interfaces públicas ───────────────────────────────────────────────────

export interface TimesheetEntry {
  id: string
  type: TimesheetType
  recordedAt: string // ISO timestamptz
}

export interface DayRecord {
  date: string // YYYY-MM-DD
  entries: TimesheetEntry[]
  totalMinutes: number
}

export interface TimesheetStatus {
  isIn: boolean
  todayEntries: TimesheetEntry[]
  recentDays: DayRecord[] // últimos días excluyendo hoy
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function computeTotalMinutes(entries: TimesheetEntry[]): number {
  let total = 0
  let lastIn: string | null = null
  for (const e of entries) {
    if (e.type === 'in') {
      lastIn = e.recordedAt
    } else if (e.type === 'out' && lastIn !== null) {
      total += (new Date(e.recordedAt).getTime() - new Date(lastIn).getTime()) / 60_000
      lastIn = null
    }
  }
  return Math.round(total)
}

// ─── getTimesheetStatus ────────────────────────────────────────────────────

export async function getTimesheetStatus(workerId: string): Promise<TimesheetStatus> {
  const supabase = await createClient()

  const since = new Date()
  since.setDate(since.getDate() - 14)

  const { data, error } = await supabase
    .from('timesheets')
    .select('id, type, recorded_at')
    .eq('worker_id', workerId)
    .gte('recorded_at', since.toISOString())
    .order('recorded_at', { ascending: true })

  if (error) return { isIn: false, todayEntries: [], recentDays: [] }

  const entries: TimesheetEntry[] = (data ?? []).map((r) => ({
    id: r.id,
    type: r.type as TimesheetType,
    recordedAt: r.recorded_at,
  }))

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayEntries = entries.filter((e) => e.recordedAt.slice(0, 10) === todayStr)
  const pastEntries = entries.filter((e) => e.recordedAt.slice(0, 10) < todayStr)

  // Estado actual: determinado por el último fichaje (hoy incluido)
  const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null
  const isIn = lastEntry?.type === 'in'

  // Agrupar días pasados
  const dayMap = new Map<string, TimesheetEntry[]>()
  for (const e of pastEntries) {
    const day = e.recordedAt.slice(0, 10)
    if (!dayMap.has(day)) dayMap.set(day, [])
    dayMap.get(day)!.push(e)
  }

  const recentDays: DayRecord[] = Array.from(dayMap.entries())
    .sort(([a], [b]) => b.localeCompare(a)) // más reciente primero
    .slice(0, 7)
    .map(([date, dayEntries]) => ({
      date,
      entries: dayEntries,
      totalMinutes: computeTotalMinutes(dayEntries),
    }))

  return { isIn, todayEntries, recentDays }
}
