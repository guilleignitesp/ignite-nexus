'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EvaluationModal } from '@/components/teacher/group/EvaluationModal'
import type { CompletedProject } from '@/lib/data/students'

interface CompletedProjectsProps {
  projects: CompletedProject[]
  studentFirstName: string
  studentLastName: string
}

function formatDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export function CompletedProjects({ projects, studentFirstName, studentLastName }: CompletedProjectsProps) {
  const [openEvalId, setOpenEvalId] = useState<string | null>(null)
  const router = useRouter()

  const openProject = openEvalId ? projects.find(p => p.evaluationId === openEvalId) : null

  return (
    <section className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">Proyectos completados</h2>
      </div>
      <div className="p-4">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin evaluaciones de proyectos</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Proyecto</th>
                <th className="pb-2 pr-4 font-medium">Sesiones</th>
                <th className="pb-2 pr-4 font-medium text-right">XP</th>
                <th className="pb-2 pr-4 font-medium">Habilidades</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.evaluationId} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{p.projectName}</td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground tabular-nums">
                    {p.firstSessionDate && p.lastSessionDate
                      ? p.firstSessionDate === p.lastSessionDate
                        ? formatDate(p.firstSessionDate)
                        : `${formatDate(p.firstSessionDate)} – ${formatDate(p.lastSessionDate)}`
                      : '—'}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums font-medium">{p.totalXp}</td>
                  <td className="py-2 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {p.skills.map(s => (
                        <span
                          key={s.skillId}
                          title={s.name_es}
                          className="inline-block size-2.5 rounded-full"
                          style={{ backgroundColor: s.branchColor ?? '#6B7280' }}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setOpenEvalId(p.evaluationId)}
                      className="text-xs text-primary hover:underline"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {openProject && (
        <EvaluationModal
          open={true}
          projectId={openProject.projectId}
          planningId={openProject.planningId}
          groupId=""
          sessionId=""
          successors={[]}
          isEditMode={true}
          existingEvals={[{
            studentId: openProject.studentId,
            skills: openProject.skills.map(s => ({ skillId: s.skillId, xpAwarded: s.xp_awarded })),
          }]}
          preloadedStudents={[{
            studentId: openProject.studentId,
            firstName: studentFirstName,
            lastName: studentLastName,
          }]}
          onClose={() => setOpenEvalId(null)}
          onCompleted={() => {
            setOpenEvalId(null)
            router.refresh()
          }}
        />
      )}
    </section>
  )
}
