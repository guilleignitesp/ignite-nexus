interface CurrentProjectProps {
  currentProject: { projectName: string; groupName: string } | null
}

export function CurrentProject({ currentProject }: CurrentProjectProps) {
  return (
    <section className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">Proyecto actual</h2>
      </div>
      <div className="p-4">
        {!currentProject ? (
          <p className="text-sm text-muted-foreground">Sin proyecto asignado</p>
        ) : (
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{currentProject.projectName}</p>
            <p className="text-xs text-muted-foreground">{currentProject.groupName}</p>
          </div>
        )}
      </div>
    </section>
  )
}
