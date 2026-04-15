import { createServerClient } from '@supabase/ssr'
import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// En Next.js 16, el archivo se llama proxy.ts y la función exportada se llama 'proxy'
// (middleware.ts está deprecado desde v16)
export async function proxy(request: NextRequest) {
  // 1. Refrescar sesión de Supabase (mantiene las cookies de auth actualizadas)
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refrescar sesión sin bloquear — necesario para que el token no expire
  await supabase.auth.getUser()

  // 2. Gestionar routing i18n (next-intl)
  const intlResponse = intlMiddleware(request)

  // Si next-intl emite una redirección (e.g., / → /es), respetarla
  if (intlResponse.status !== 200) {
    // Copiar cookies de Supabase a la respuesta de intl
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      intlResponse.cookies.set(name, value)
    })
    return intlResponse
  }

  // Copiar cookies de Supabase a la respuesta final
  supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
    intlResponse.cookies.set(name, value)
  })

  return intlResponse
}

export const config = {
  matcher: [
    // Excluir rutas internas de Next.js y archivos estáticos
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
