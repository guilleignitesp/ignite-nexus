// Layout del alumno: aplica el tema gamificado
// requireAuth se añadirá cuando se implemente la autenticación de alumnos (post-lanzamiento)
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    // .theme-student activa los colores gamificados definidos en globals.css
    <div className="theme-student min-h-screen">
      {children}
    </div>
  )
}
