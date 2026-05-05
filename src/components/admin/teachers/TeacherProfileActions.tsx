'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateWorkerInfo, changeWorkerPassword } from '@/lib/actions/teachers'

interface TeacherProfileActionsProps {
  workerId: string
  firstName: string
  lastName: string
  email: string | null
}

export function TeacherProfileActions({
  workerId,
  firstName,
  lastName,
  email,
}: TeacherProfileActionsProps) {
  const router = useRouter()
  const [mode, setMode] = useState<null | 'edit' | 'password'>(null)

  // Edit data
  const [editFirst, setEditFirst] = useState(firstName)
  const [editLast, setEditLast] = useState(lastName)
  const [editEmail, setEditEmail] = useState(email ?? '')
  const [editPending, startEditTransition] = useTransition()
  const [editError, setEditError] = useState<string | null>(null)

  // Change password
  const [newPassword, setNewPassword] = useState('')
  const [passwordPending, startPasswordTransition] = useTransition()
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordDone, setPasswordDone] = useState(false)

  function handleEditSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    setEditError(null)
    startEditTransition(async () => {
      try {
        await updateWorkerInfo(workerId, editFirst, editLast, editEmail || undefined)
        setMode(null)
        router.refresh()
      } catch (err) {
        setEditError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  function handlePasswordSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordDone(false)
    startPasswordTransition(async () => {
      try {
        await changeWorkerPassword(workerId, newPassword)
        setNewPassword('')
        setPasswordDone(true)
      } catch (err) {
        setPasswordError(err instanceof Error ? err.message : 'Error al cambiar contraseña')
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {mode === null && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setMode('edit')}>
            Editar datos
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setPasswordDone(false); setMode('password') }}>
            Cambiar contraseña
          </Button>
        </div>
      )}

      {mode === 'edit' && (
        <form onSubmit={handleEditSubmit} className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Editar datos</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                value={editFirst}
                onChange={(e) => setEditFirst(e.target.value)}
                required
                disabled={editPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Apellidos</Label>
              <Input
                value={editLast}
                onChange={(e) => setEditLast(e.target.value)}
                required
                disabled={editPending}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              disabled={editPending}
            />
          </div>
          {editError && <p className="text-sm text-destructive">{editError}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={editPending}>
              {editPending ? '...' : 'Guardar'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setMode(null)}
              disabled={editPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {mode === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Cambiar contraseña</p>
          <div className="space-y-1.5">
            <Label>Nueva contraseña</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              disabled={passwordPending}
            />
          </div>
          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          {passwordDone && (
            <p className="text-sm text-green-600">Contraseña cambiada correctamente.</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={passwordPending}>
              {passwordPending ? '...' : 'Cambiar'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setMode(null)}
              disabled={passwordPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
