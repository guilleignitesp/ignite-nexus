'use client'

import { memo } from 'react'
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
import type { MapNode, MapEdge } from '@/lib/data/teacher'

// ─── Custom node (read-only) ──────────────────────────────────────────────

type RONodeData = {
  label: string
  materialType: string | null
  isCurrent: boolean
  isInitial: boolean
}
type RONode = Node<RONodeData, 'roNode'>

const RONodeComponent = memo(({ data }: NodeProps<RONode>) => (
  <div
    className={cn(
      'rounded-lg border-2 bg-background px-3 py-2 text-sm shadow-sm min-w-[140px] max-w-[180px]',
      data.isCurrent  && 'border-primary bg-primary/5',
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

  if (nodes.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noMap')}</p>
  }

  const rfNodes = buildNodes(nodes, edges, currentProjectId, initialProjectId)
  const rfEdges = buildEdges(edges)

  return (
    <div className="h-80 rounded-lg border overflow-hidden">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnDoubleClick={false}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
