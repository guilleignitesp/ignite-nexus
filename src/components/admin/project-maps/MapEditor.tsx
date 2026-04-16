'use client'

import { useState, useCallback, useEffect, memo, useTransition } from 'react'
import '@xyflow/react/dist/style.css'
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type NodeChange,
  MarkerType,
} from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { saveProjectMap } from '@/lib/actions/project-maps'
import type { MapDetail } from '@/lib/data/project-maps'
import type { ProjectListItem } from '@/lib/data/projects'

// ─── Custom node ─────────────────────────────────────────────

type ProjectNodeData = {
  label: string
  materialType: string | null
  hours: number | null
  isInitial: boolean
}

type ProjectNode = Node<ProjectNodeData, 'projectNode'>

// Must be defined outside MapEditor to prevent recreation on every render
const ProjectNodeComponent = memo(({ data, selected }: NodeProps<ProjectNode>) => (
  <div
    className={cn(
      'rounded-lg border-2 bg-background p-3 text-sm shadow-sm',
      'min-w-[160px] max-w-[200px]',
      selected && 'border-primary',
      !selected && data.isInitial && 'border-green-500',
      !selected && !data.isInitial && 'border-border'
    )}
  >
    <Handle type="target" position={Position.Top} isConnectable />
    <div className="font-medium leading-tight">{data.label}</div>
    {(data.materialType || data.hours != null) && (
      <div className="mt-1 text-xs text-muted-foreground">
        {[data.materialType, data.hours != null ? `${data.hours}h` : null]
          .filter(Boolean)
          .join(' · ')}
      </div>
    )}
    {data.isInitial && (
      <span className="mt-1.5 inline-block text-xs font-semibold text-green-600">
        ◆ Initial
      </span>
    )}
    <Handle type="source" position={Position.Bottom} isConnectable />
  </div>
))
ProjectNodeComponent.displayName = 'ProjectNodeComponent'

const nodeTypes = { projectNode: ProjectNodeComponent }

// ─── BFS layout ──────────────────────────────────────────────

function computeLayout(
  nodeIds: string[],
  edgePairs: { source: string; target: string }[]
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

  const HGAP = 220
  const VGAP = 130
  const positions = new Map<string, { x: number; y: number }>()
  layers.forEach((layer, row) => {
    const totalW = (layer.length - 1) * HGAP
    layer.forEach((id, col) => {
      positions.set(id, { x: col * HGAP - totalW / 2, y: row * VGAP })
    })
  })
  return positions
}

// ─── Conversion helpers ───────────────────────────────────────

function buildInitialNodes(map: MapDetail): ProjectNode[] {
  const edgePairs = map.edges.map((e) => ({
    source: e.fromProjectId,
    target: e.toProjectId,
  }))
  const positions = computeLayout(
    map.nodes.map((n) => n.projectId),
    edgePairs
  )
  return map.nodes.map((n) => ({
    id: n.projectId,
    type: 'projectNode' as const,
    position: positions.get(n.projectId) ?? { x: 0, y: 0 },
    data: {
      label: n.projectName,
      materialType: n.materialType,
      hours: n.recommendedHours,
      isInitial: n.projectId === map.initial_project_id,
    },
  }))
}

function buildInitialEdges(map: MapDetail): Edge[] {
  return map.edges.map((e) => ({
    id: `${e.fromProjectId}-${e.toProjectId}`,
    source: e.fromProjectId,
    target: e.toProjectId,
    markerEnd: { type: MarkerType.ArrowClosed },
  }))
}

// ─── MapEditor ───────────────────────────────────────────────

interface MapEditorProps {
  map: MapDetail
  allProjects: ProjectListItem[]
  locale: string
}

export function MapEditor({ map, allProjects, locale }: MapEditorProps) {
  const t = useTranslations('projectMaps')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [initialProjectId, setInitialProjectId] = useState<string | null>(
    map.initial_project_id
  )
  const [search, setSearch] = useState('')
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([])

  const [nodes, setNodes, onNodesChange] = useNodesState<ProjectNode>(
    buildInitialNodes(map)
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildInitialEdges(map))

  // Sync isInitial flag in node data whenever initialProjectId changes
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: { ...n.data, isInitial: n.id === initialProjectId },
      }))
    )
  }, [initialProjectId, setNodes])

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed } }, eds)
      )
    },
    [setEdges]
  )

  function handleNodesChange(changes: NodeChange<ProjectNode>[]) {
    const removedIds = changes
      .filter((c) => c.type === 'remove')
      .map((c) => c.id)
    if (initialProjectId && removedIds.includes(initialProjectId)) {
      setInitialProjectId(null)
    }
    onNodesChange(changes)
  }

  function handleAutoLayout() {
    const edgePairs = edges.map((e) => ({ source: e.source, target: e.target }))
    const positions = computeLayout(
      nodes.map((n) => n.id),
      edgePairs
    )
    setNodes((prev) =>
      prev.map((n) => ({ ...n, position: positions.get(n.id) ?? n.position }))
    )
  }

  function addProjectToMap(project: ProjectListItem) {
    setNodes((prev) => {
      const col = prev.length % 5
      const row = Math.floor(prev.length / 5)
      return [
        ...prev,
        {
          id: project.id,
          type: 'projectNode' as const,
          position: { x: col * 220, y: row * 130 },
          data: {
            label: project.name,
            materialType: project.material_type,
            hours: project.recommended_hours,
            isInitial: false,
          },
        },
      ]
    })
  }

  function removeSelectedNodes() {
    const removing = new Set(selectedNodeIds)
    setNodes((prev) => prev.filter((n) => !removing.has(n.id)))
    setEdges((prev) =>
      prev.filter((e) => !removing.has(e.source) && !removing.has(e.target))
    )
    if (initialProjectId && removing.has(initialProjectId)) {
      setInitialProjectId(null)
    }
    setSelectedNodeIds([])
  }

  function removeSelectedEdges() {
    const removing = new Set(selectedEdgeIds)
    setEdges((prev) => prev.filter((e) => !removing.has(e.id)))
    setSelectedEdgeIds([])
  }

  function setAsInitial() {
    if (selectedNodeIds.length === 1) setInitialProjectId(selectedNodeIds[0])
  }

  function handleSave() {
    startTransition(async () => {
      await saveProjectMap(map.id, {
        nodes: nodes.map((n) => ({ projectId: n.id })),
        edges: edges.map((e) => ({
          fromProjectId: e.source,
          toProjectId: e.target,
        })),
        initialProjectId,
      })
      router.refresh()
    })
  }

  const inMapIds = new Set(nodes.map((n) => n.id))
  const availableProjects = allProjects.filter(
    (p) =>
      p.is_active &&
      !inMapIds.has(p.id) &&
      (search === '' || p.name.toLowerCase().includes(search.toLowerCase()))
  )

  const hasSelection = selectedNodeIds.length > 0 || selectedEdgeIds.length > 0

  return (
    <div className="-mx-6 -mt-6 flex h-[calc(100dvh)] flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push(`/${locale}/admin/project-maps`)}
        >
          <ArrowLeft className="size-4" />
          {t('backToList')}
        </Button>
        <div className="flex items-center gap-2 truncate">
          <span className="truncate font-semibold">{map.name}</span>
          <Badge variant={map.is_active ? 'default' : 'secondary'}>
            {map.is_active ? t('statusActive') : t('statusInactive')}
          </Badge>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleAutoLayout}>
            <Wand2 className="size-4" />
            {t('autoLayout')}
          </Button>
          <Button size="sm" disabled={isPending} onClick={handleSave}>
            {isPending ? '...' : t('save')}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar — available projects */}
        <div className="flex w-64 shrink-0 flex-col gap-2 overflow-hidden border-r bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            {t('availableProjects')}
          </p>
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs"
          />
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {availableProjects.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('noAvailableProjects')}</p>
            ) : (
              availableProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addProjectToMap(p)}
                  className="w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent"
                >
                  <div className="font-medium">{p.name}</div>
                  {p.material_type && (
                    <div className="text-muted-foreground">{p.material_type}</div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* React Flow canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onSelectionChange={({ nodes: selNodes, edges: selEdges }) => {
              setSelectedNodeIds(selNodes.map((n) => n.id))
              setSelectedEdgeIds(selEdges.map((e) => e.id))
            }}
            fitView
            deleteKeyCode="Delete"
          >
            <Background />
            <Controls />
            {hasSelection && (
              <Panel position="bottom-center">
                <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
                  {selectedNodeIds.length === 1 && (
                    <Button size="sm" variant="outline" onClick={setAsInitial}>
                      {t('setAsInitial')}
                    </Button>
                  )}
                  {selectedNodeIds.length > 0 && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={removeSelectedNodes}
                    >
                      {t('removeFromMap')}
                    </Button>
                  )}
                  {selectedEdgeIds.length > 0 && selectedNodeIds.length === 0 && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={removeSelectedEdges}
                    >
                      {t('removeConnection')}
                    </Button>
                  )}
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
