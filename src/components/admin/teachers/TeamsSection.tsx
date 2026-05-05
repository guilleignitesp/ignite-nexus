'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Team } from '@/lib/data/teachers'
import { addWorkerTeam, removeWorkerTeam, createTeam } from '@/lib/actions/teachers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  workerId: string
  initialTeams: Team[]
  allTeams: Team[]
  isSuperAdmin: boolean
}

export function TeamsSection({ workerId, initialTeams, allTeams, isSuperAdmin }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')

  const currentTeamIds = new Set(initialTeams.map((t) => t.id))
  const available = allTeams.filter((t) => !currentTeamIds.has(t.id))

  function handleAdd(teamId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await addWorkerTeam(workerId, teamId)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function handleRemove(teamId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await removeWorkerTeam(workerId, teamId)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await createTeam(newCode, newName)
        setNewCode('')
        setNewName('')
        setCreateOpen(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  return (
    <div className="space-y-3">
      {/* Current teams */}
      {initialTeams.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin equipos asignados</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {initialTeams.map((team) => (
            <div key={team.id} className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                {team.code} · {team.name}
              </Badge>
              <button
                type="button"
                onClick={() => handleRemove(team.id)}
                disabled={isPending}
                className="rounded text-muted-foreground hover:text-destructive disabled:opacity-50 text-xs px-1"
                aria-label={`Quitar ${team.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add from available */}
      {available.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            defaultValue=""
            disabled={isPending}
            onChange={(e) => { if (e.target.value) handleAdd(e.target.value) }}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring disabled:opacity-50"
          >
            <option value="" disabled>Añadir equipo…</option>
            {available.map((t) => (
              <option key={t.id} value={t.id}>{t.code} · {t.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Create new team — superadmin only */}
      {isSuperAdmin && (
        <div>
          {!createOpen ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              + Crear equipo
            </button>
          ) : (
            <form onSubmit={handleCreate} className="flex items-end gap-2 rounded-md border p-3">
              <div className="space-y-1">
                <Label className="text-xs">Código</Label>
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="BCN"
                  required
                  disabled={isPending}
                  className="h-7 w-20 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nombre</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Barcelona"
                  required
                  disabled={isPending}
                  className="h-7 w-36 text-xs"
                />
              </div>
              <Button type="submit" size="xs" disabled={isPending}>
                {isPending ? '...' : 'Crear'}
              </Button>
              <Button type="button" size="xs" variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
