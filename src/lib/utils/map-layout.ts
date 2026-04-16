/**
 * BFS-based hierarchical layout for project maps.
 * Nodes with no in-edges go in the first layer; each subsequent layer
 * contains nodes whose parents have all been placed.
 */
export function computeLayout(
  nodeIds: string[],
  edgePairs: { source: string; target: string }[],
  hgap = 220,
  vgap = 130,
): Map<string, { x: number; y: number }> {
  const children = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  nodeIds.forEach((id) => {
    children.set(id, [])
    inDegree.set(id, 0)
  })
  edgePairs.forEach((e) => {
    children.get(e.source)?.push(e.target)
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1)
  })

  const layers: string[][] = []
  const placed = new Set<string>()
  let current = nodeIds.filter((id) => inDegree.get(id) === 0)

  while (current.length > 0) {
    layers.push(current)
    current.forEach((id) => placed.add(id))
    const next: string[] = []
    current.forEach((id) => {
      children.get(id)?.forEach((child) => {
        if (placed.has(child)) return
        inDegree.set(child, (inDegree.get(child) ?? 1) - 1)
        if (inDegree.get(child) === 0) next.push(child)
      })
    })
    current = next
  }

  const remaining = nodeIds.filter((id) => !placed.has(id))
  if (remaining.length > 0) layers.push(remaining)

  const positions = new Map<string, { x: number; y: number }>()
  layers.forEach((layer, row) => {
    const totalW = (layer.length - 1) * hgap
    layer.forEach((id, col) => {
      positions.set(id, { x: col * hgap - totalW / 2, y: row * vgap })
    })
  })
  return positions
}
