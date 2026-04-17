import { createClient } from '@/lib/supabase-server'

// ─── Interfaces públicas ───────────────────────────────────────────────────

export interface StockLocation {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

export interface StockItem {
  id: string
  name: string
  description: string | null
  quantity: number
  holderType: 'location' | 'worker'
  holderId: string
  holderName: string
  isActive: boolean
  createdAt: string
}

// ─── Tipos raw ─────────────────────────────────────────────────────────────

type RawLocation = {
  id: string
  name: string
  description: string | null
  is_active: boolean
}

type RawItem = {
  id: string
  name: string
  description: string | null
  quantity: number
  holder_type: string
  holder_id: string
  is_active: boolean
  created_at: string
}

// ─── getStockLocations ─────────────────────────────────────────────────────

export async function getStockLocations(): Promise<StockLocation[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('stock_locations')
    .select('id, name, description, is_active')
    .order('name')

  if (error) throw new Error(error.message)

  return ((data ?? []) as RawLocation[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isActive: r.is_active,
  }))
}

// ─── getStockItems ─────────────────────────────────────────────────────────

export async function getStockItems(): Promise<StockItem[]> {
  const supabase = await createClient()

  const { data: rawItems, error } = await supabase
    .from('stock_items')
    .select('id, name, description, quantity, holder_type, holder_id, is_active, created_at')
    .order('name')

  if (error) throw new Error(error.message)

  const items = (rawItems ?? []) as RawItem[]

  // Batch-resolve holder names to avoid N+1
  const locationIds = [...new Set(items.filter((i) => i.holder_type === 'location').map((i) => i.holder_id))]
  const workerIds = [...new Set(items.filter((i) => i.holder_type === 'worker').map((i) => i.holder_id))]

  const [locationRows, workerRows] = await Promise.all([
    locationIds.length > 0
      ? supabase.from('stock_locations').select('id, name').in('id', locationIds).then((r) => r.data ?? [])
      : Promise.resolve([]),
    workerIds.length > 0
      ? supabase.from('workers').select('id, first_name, last_name').in('id', workerIds).then((r) => r.data ?? [])
      : Promise.resolve([]),
  ])

  const locationMap = new Map<string, string>(
    (locationRows as { id: string; name: string }[]).map((l) => [l.id, l.name])
  )
  const workerMap = new Map<string, string>(
    (workerRows as { id: string; first_name: string; last_name: string }[]).map((w) => [
      w.id,
      `${w.first_name} ${w.last_name}`,
    ])
  )

  return items.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    quantity: r.quantity,
    holderType: r.holder_type as 'location' | 'worker',
    holderId: r.holder_id,
    holderName:
      r.holder_type === 'location'
        ? (locationMap.get(r.holder_id) ?? r.holder_id)
        : (workerMap.get(r.holder_id) ?? r.holder_id),
    isActive: r.is_active,
    createdAt: r.created_at,
  }))
}
