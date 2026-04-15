import { redirect } from 'next/navigation'

// Redirige la raíz al idioma por defecto
// El proxy.ts (next-intl) normalmente intercepta antes, esto es un fallback
export default function RootPage() {
  redirect('/es')
}
