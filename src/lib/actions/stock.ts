'use server'

import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'

// ─── Interfaces públicas ───────────────────────────────────────────────────

export interface StockMovement {
  id: string
  fromType: 'location' | 'worker'
  fromId: string
  fromName: string
  toType: 'location' | 'worker'
  toId: string
  toName: string
  movedByName: string | null
  movedAt: string
}

// ─── Guard ─────────────────────────────────────────────────────────────────

async function assertStockAccess(): Promise<string> {
  const profile = await getUserProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!profile.isSuperAdmin && !profile.adminModules.includes('stock')) {
    throw new Error('Unauthorized')
  }
  return profile.workerId ?? ''
}

// ─── Locations ─────────────────────────────────────────────────────────────

export async function createLocation(name: string, description: string): Promise<void> {
  await assertStockAccess()
  const supabase = await createClient()

  const { error } = await supabase
    .from('stock_locations')
    .insert({ name: name.trim(), description: description.trim() || null })

  if (error) throw new Error(error.message)
}

export async function updateLocation(
  id: string,
  name: string,
  description: string
): Promise<void> {
  await assertStockAccess()
  const supabase = await createClient()

  const { error } = await supabase
    .from('stock_locations')
    .update({ name: name.trim(), description: description.trim() || null })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ─── Items ──────────────────────────────────────────────────────────────────

export async function createItem(
  name: string,
  description: string,
  quantity: number,
  holderType: 'location' | 'worker',
  holderId: string
): Promise<void> {
  await assertStockAccess()
  const supabase = await createClient()

  const { error } = await supabase.from('stock_items').insert({
    name: name.trim(),
    description: description.trim() || null,
    quantity,
    holder_type: holderType,
    holder_id: holderId,
  })

  if (error) throw new Error(error.message)
}

export async function toggleItemStatus(id: string, isActive: boolean): Promise<void> {
  await assertStockAccess()
  const supabase = await createClient()

  const { error } = await supabase
    .from('stock_items')
    .update({ is_active: !isActive })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ─── Movements ─────────────────────────────────────────────────────────────

export async function recordMovement(
  itemId: string,
  fromType: 'location' | 'worker',
  fromId: string,
  toType: 'location' | 'worker',
  toId: string
): Promise<void> {
  const workerId = await assertStockAccess()
  const supabase = await createClient()

  // Update item's current holder and record movement in parallel
  const [moveRes, updateRes] = await Promise.all([
    supabase.from('stock_movements').insert({
      item_id: itemId,
      from_type: fromType,
      from_id: fromId,
      to_type: toType,
      to_id: toId,
      moved_by: workerId || null,
    }),
    supabase
      .from('stock_items')
      .update({ holder_type: toType, holder_id: toId })
      .eq('id', itemId),
  ])

  if (moveRes.error) throw new Error(moveRes.error.message)
  if (updateRes.error) throw new Error(updateRes.error.message)
}

// ─── getItemMovements (lazy, called from client) ───────────────────────────

export async function getItemMovements(itemId: string): Promise<StockMovement[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('stock_movements')
    .select('id, from_type, from_id, to_type, to_id, moved_by, moved_at')
    .eq('item_id', itemId)
    .order('moved_at', { ascending: false })

  if (error) throw new Error(error.message)

  type RawMovement = {
    id: string
    from_type: string
    from_id: string
    to_type: string
    to_id: string
    moved_by: string | null
    moved_at: string
  }

  const movements = (data ?? []) as RawMovement[]
  if (movements.length === 0) return []

  // Batch-resolve names
  const locationIds = [
    ...new Set([
      ...movements.filter((m) => m.from_type === 'location').map((m) => m.from_id),
      ...movements.filter((m) => m.to_type === 'location').map((m) => m.to_id),
    ]),
  ]
  const workerIds = [
    ...new Set([
      ...movements.filter((m) => m.from_type === 'worker').map((m) => m.from_id),
      ...movements.filter((m) => m.to_type === 'worker').map((m) => m.to_id),
      ...movements.filter((m) => m.moved_by !== null).map((m) => m.moved_by!),
    ]),
  ]

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

  function resolveName(type: string, id: string): string {
    return type === 'location' ? (locationMap.get(id) ?? id) : (workerMap.get(id) ?? id)
  }

  return movements.map((m) => ({
    id: m.id,
    fromType: m.from_type as 'location' | 'worker',
    fromId: m.from_id,
    fromName: resolveName(m.from_type, m.from_id),
    toType: m.to_type as 'location' | 'worker',
    toId: m.to_id,
    toName: resolveName(m.to_type, m.to_id),
    movedByName: m.moved_by ? (workerMap.get(m.moved_by) ?? null) : null,
    movedAt: m.moved_at,
  }))
}
