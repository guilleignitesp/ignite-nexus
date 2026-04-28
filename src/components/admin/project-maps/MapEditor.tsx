'use client'

import { useState, useCallback, useEffect, memo, useTransition, useMemo } from 'react'
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
  EdgeLabelRenderer,
  getBezierPath,
  BaseEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type EdgeProps,
  type NodeChange,
  MarkerType,
} from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Wand2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { computeLayout } from '@/lib/utils/map-layout'
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

// ─── Custom edge ──────────────────────────────────────────────

type EdgeData = { percentage: number | null; label: string | null }

const ProjectEdgeComponent = memo(
  ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    markerEnd,
    selected,
  }: EdgeProps) => {
    const d = data as EdgeData | undefined
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })
    const hasLabel = d?.label || d?.percentage != null

    return (
      <>
        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd}
          style={selected ? { stroke: 'hsl(var(--primary))' } : undefined}
        />
        {hasLabel && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: 'none',
              }}
              className="nodrag nopan flex items-center gap-1 rounded border bg-background px-1.5 py-0.5 text-[10px] shadow-sm"
            >
              {d?.percentage != null && (
                <span className="font-semibold">{d.percentage}%</span>
              )}
              {d?.label && (
                <span className="text-muted-foreground">{d.label}</span>
              )}
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    )
  }
)
ProjectEdgeComponent.displayName = 'ProjectEdgeComponent'

const edgeTypes = { projectEdge: ProjectEdgeComponent }

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
    type: 'projectEdge',
    markerEnd: { type: MarkerType.ArrowClosed },
    data: { percentage: e.percentage, label: e.label } satisfies EdgeData,
  }))
}

// ─── MapEditor ───────────────────────────────────────────────

interface MapEditorProps {
  map: MapDetail
  allProjects: ProjectListItem[]
  locale: string
}

type EdgePanelState = {
  mode: 'connect' | 'edit'
  connection?: Connection
  edgeId?: string
  percentage: string
  label: string
}

export function MapEditor({ map, allProjects, locale }: MapEditorProps) {
  const t = useTranslations('projectMaps')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [initialProjectId, setInitialProjectId] = useState<string | null>(
    map.initial_project_id
  )
  const [search, setSearch] = useState('')
  const [materialFilter, setMaterialFilter] = useState('')
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([])
  const [edgePanel, setEdgePanel] = useState<EdgePanelState | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState<ProjectNode>(
    buildInitialNodes(map)
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildInitialEdges(map))

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
      setEdgePanel({ mode: 'connect', connection, percentage: '', label: '' })
    },
    []
  )

  function handleEdgePanelConfirm() {
    if (!edgePanel) return
    const raw = parseFloat(edgePanel.percentage)
    const data: EdgeData = {
      percentage: edgePanel.percentage !== '' && !isNaN(raw) ? raw : null,
      label: edgePanel.label.trim() || null,
    }
    if (edgePanel.mode === 'connect' && edgePanel.connection) {
      setEdges((eds) =>
        addEdge(
          {
            ...edgePanel.connection!,
            type: 'projectEdge',
            markerEnd: { type: MarkerType.ArrowClosed },
            data,
          },
          eds
        )
      )
    } else if (edgePanel.mode === 'edit' && edgePanel.edgeId) {
      setEdges((eds) =>
        eds.map((e) => (e.id === edgePanel.edgeId ? { ...e, data } : e))
      )
    }
    setEdgePanel(null)
  }

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    const d = edge.data as EdgeData | undefined
    setEdgePanel({
      mode: 'edit',
      edgeId: edge.id,
      percentage: d?.percentage != null ? String(d.percentage) : '',
      label: d?.label ?? '',
    })
  }, [])

  const handleNodesChange = useCallback(
    (changes: NodeChange<ProjectNode>[]) => {
      const removedIds = changes.filter((c) => c.type === 'remove').map((c) => c.id)
      if (initialProjectId && removedIds.includes(initialProjectId)) {
        setInitialProjectId(null)
      }
      onNodesChange(changes)
    },
    [initialProjectId, onNodesChange]
  )

  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: { nodes: Node[]; edges: Edge[] }) => {
      setSelectedNodeIds(selNodes.map((n) => n.id))
      setSelectedEdgeIds(selEdges.map((e) => e.id))
    },
    []
  )

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
        edges: edges.map((e) => {
          const d = e.data as EdgeData | undefined
          return {
            fromProjectId: e.source,
            toProjectId: e.target,
            percentage: d?.percentage ?? null,
            label: d?.label ?? null,
          }
        }),
        initialProjectId,
      })
      router.refresh()
    })
  }

  const warningNodes = useMemo(() => {
    const bySource = new Map<string, number[]>()
    for (const e of edges) {
      const pct = (e.data as EdgeData | undefined)?.percentage
      if (pct != null) {
        const arr = bySource.get(e.source) ?? []
        arr.push(pct)
        bySource.set(e.source, arr)
      }
    }
    const problematic: string[] = []
    for (const [nodeId, pcts] of bySource) {
      if (Math.abs(pcts.reduce((a, b) => a + b, 0) - 100) > 0.01) {
        const node = nodes.find((n) => n.id === nodeId)
        if (node) problematic.push(node.data.label)
      }
    }
    return problematic
  }, [edges, nodes])

  const materialTypes = [
    ...new Set(allProjects.filter((p) => p.material_type).map((p) => p.material_type!)),
  ]

  const inMapIds = new Set(nodes.map((n) => n.id))
  const availableProjects = allProjects.filter(
    (p) =>
      p.is_active &&
      !inMapIds.has(p.id) &&
      (search === '' || p.name.toLowerCase().includes(search.toLowerCase())) &&
      (materialFilter === '' || p.material_type === materialFilter)
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
        {/* Sidebar */}
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
          <select
            value={materialFilter}
            onChange={(e) => setMaterialFilter(e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
          >
            <option value="">Todos los materiales</option>
            {materialTypes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
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
            onEdgeClick={handleEdgeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onSelectionChange={onSelectionChange}
            fitView
            deleteKeyCode="Delete"
          >
            <Background />
            <Controls />

            {warningNodes.length > 0 && (
              <Panel position="top-center">
                <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-800 shadow-sm">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  {t('percentageWarning', { nodes: warningNodes.join(', ') })}
                </div>
              </Panel>
            )}

            {edgePanel && (
              <Panel position="top-right">
                <div className="w-60 rounded-lg border bg-background p-3 shadow-md space-y-3">
                  <p className="text-sm font-medium">
                    {edgePanel.mode === 'connect' ? t('edgeConnect') : t('edgeEdit')}
                  </p>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">
                        {t('edgePercentage')}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={edgePanel.percentage}
                        onChange={(e) =>
                          setEdgePanel((p) =>
                            p ? { ...p, percentage: e.target.value } : null
                          )
                        }
                        placeholder="0–100"
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">
                        {t('edgeLabel')}
                      </label>
                      <Input
                        value={edgePanel.label}
                        onChange={(e) =>
                          setEdgePanel((p) =>
                            p ? { ...p, label: e.target.value } : null
                          )
                        }
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleEdgePanelConfirm}
                      className="flex-1"
                    >
                      {t('edgeConfirm')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEdgePanel(null)}
                    >
                      {t('cancel')}
                    </Button>
                  </div>
                </div>
              </Panel>
            )}

            {hasSelection && !edgePanel && (
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
