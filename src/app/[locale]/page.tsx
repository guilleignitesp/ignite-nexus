import { redirect } from 'next/navigation'

// La página raíz de cada locale redirige al login
// El sistema de auth redirigirá al dashboard correcto si ya hay sesión
export default function LocaleHomePage() {
  redirect('/login')
}
