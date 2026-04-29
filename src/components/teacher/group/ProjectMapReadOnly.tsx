'use client'

import { useState, useCallback, useEffect, useMemo, memo } from 'react'
import '@xyflow/react/dist/style.css'
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  MarkerType,
} from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { computeLayout } from '@/lib/utils/map-layout'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { calcXP } from '@/lib/data/projects'
import { getProjectFullDetails } from '@/lib/actions/project-maps'
import type { ProjectFullDetails } from '@/lib/actions/project-maps'
import type { MapNode, MapEdge } from '@/lib/data/teacher'

// ─── Custom node (read-only) ──────────────────────────────────────────────

type RONodeData = {
  label: string
  materialType: string | null
  isCurrent: boolean
  isInitial: boolean
}
type RONode = Node<RONodeData, 'roNode'>

const RONodeComponent = memo(({ data, selected }: NodeProps<RONode>) => (
  <div
    className={cn(
      'cursor-pointer rounded-lg border-2 bg-background px-3 py-2 text-sm shadow-sm min-w-[140px] max-w-[180px]',
      selected && 'ring-2 ring-primary ring-offset-1',
      data.isCurrent && 'border-primary bg-primary/5',
      !data.isCurrent && data.isInitial && 'border-green-500',
      !data.isCurrent && !data.isInitial && 'border-border'
    )}
  >
    <Handle type="target" position={Position.Top} isConnectable={false} />
    <div className="font-medium leading-tight">{data.label}</div>
    {data.materialType && (
      <div className="mt-0.5 text-xs text-muted-foreground">{data.materialType}</div>
    )}
    {data.isCurrent && (
      <span className="mt-1 inline-block text-xs font-semibold text-primary">● Actual</span>
    )}
    <Handle type="source" position={Position.Bottom} isConnectable={false} />
  </div>
))
RONodeComponent.displayName = 'RONodeComponent'

const nodeTypes = { roNode: RONodeComponent }

// ─── Build RF nodes/edges ─────────────────────────────────────────────────

function buildNodes(
  nodes: MapNode[],
  edges: MapEdge[],
  currentProjectId: string | null,
  initialProjectId: string | null
): RONode[] {
  const edgePairs = edges.map((e) => ({ source: e.fromProjectId, target: e.toProjectId }))
  const positions = computeLayout(nodes.map((n) => n.projectId), edgePairs, 200)
  return nodes.map((n) => {
    const pos = positions.get(n.projectId) ?? { x: 0, y: 0 }
    return {
      id: n.projectId,
      type: 'roNode' as const,
      position: pos,
      data: {
        label: n.projectName,
        materialType: n.materialType,
        isCurrent: n.projectId === currentProjectId,
        isInitial: n.projectId === initialProjectId,
      },
    }
  })
}

function buildEdges(edges: MapEdge[]): Edge[] {
  return edges.map((e, i) => ({
    id: `e-${i}`,
    source: e.fromProjectId,
    target: e.toProjectId,
    markerEnd: { type: MarkerType.ArrowClosed },
  }))
}

// ─── Component ────────────────────────────────────────────────────────────

interface ProjectMapReadOnlyProps {
  nodes: MapNode[]
  edges: MapEdge[]
  currentProjectId: string | null
  initialProjectId: string | null
}

export function ProjectMapReadOnly({
  nodes,
  edges,
  currentProjectId,
  initialProjectId,
}: ProjectMapReadOnlyProps) {
  const t = useTranslations('teacherGroup')

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [details, setDetails] = useState<ProjectFullDetails | null>(null)

  const rfNodes = useMemo(
    () => buildNodes(nodes, edges, currentProjectId, initialProjectId),
    [nodes, edges, currentProjectId, initialProjectId]
  )
  const rfEdges = useMemo(() => buildEdges(edges), [edges])

  useEffect(() => {
    if (!selectedProjectId) {
      setDetails(null)
      return
    }
    let cancelled = false
    getProjectFullDetails(selectedProjectId).then((d) => {
      if (!cancelled) setDetails(d)
    })
    return () => {
      cancelled = true
    }
  }, [selectedProjectId])

  const onSelectionChange = useCallback(
    ({ nodes: selNodes }: { nodes: Node[]; edges: Edge[] }) => {
      setSelectedProjectId(selNodes.length === 1 ? selNodes[0].id : null)
    },
    []
  )

  const skillsByBranch = useMemo(() => {
    if (!details) return {} as Record<string, ProjectFullDetails['skills']>
    return details.skills.reduce<Record<string, ProjectFullDetails['skills']>>((acc, s) => {
      ;(acc[s.branch_name_es || 'Otras'] ??= []).push(s)
      return acc
    }, {})
  }, [details])

  if (nodes.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noMap')}</p>
  }

  return (
    <>
    <div className="h-80 rounded-lg border overflow-hidden">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnDoubleClick={false}
        onSelectionChange={onSelectionChange}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>

      <Sheet
        open={!!selectedProjectId}
        onOpenChange={(open) => {
          if (!open) setSelectedProjectId(null)
        }}
      >
        <SheetContent
          className="sm:max-w-sm overflow-y-auto"
          style={{ maxHeight: '100dvh', overflowY: 'auto' }}
        >
          {details ? (
            <>
              <SheetHeader>
                <SheetTitle>{details.name}</SheetTitle>
                {(details.material_type || details.recommended_hours != null) && (
                  <p className="text-sm text-muted-foreground">
                    {[
                      details.material_type,
                      details.recommended_hours != null
                        ? `${details.recommended_hours}h`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </SheetHeader>

              <div className="mt-4 space-y-5">
                {details.description && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Descripción
                    </p>
                    <p className="text-sm">{details.description}</p>
                  </div>
                )}

                {details.resources.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Recursos
                    </p>
                    <div className="space-y-1.5">
                      {details.resources.map((r, i) => (
                        <a
                          key={i}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm hover:bg-accent"
                        >
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            {r.type === 'presentation' ? 'Presentación' : 'Guía'}
                          </Badge>
                          <span className="truncate">{r.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {details.skills.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Habilidades
                    </p>
                    <div className="space-y-3">
                      {Object.entries(skillsByBranch).map(([branch, skills]) => (
                        <div key={branch}>
                          <p className="mb-1 text-xs font-semibold">{branch}</p>
                          <div className="space-y-1">
                            {skills.map((s, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span
                                  className="size-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: s.branch_color }}
                                />
                                <span className="flex-1 text-sm">{s.name_es}</span>
                                <Badge variant="outline" className="text-[10px]">
                                  Rk{s.rank}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {calcXP(s.rank)} XP
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
