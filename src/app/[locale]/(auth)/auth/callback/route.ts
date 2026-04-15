import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserProfile } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirigir según el rol del usuario
  const profile = await getUserProfile()

  if (!profile) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  switch (profile.role) {
    case 'worker':
      return NextResponse.redirect(new URL(`/${locale}/teacher/home`, request.url))
    case 'admin':
      return NextResponse.redirect(new URL(`/${locale}/admin/dashboard`, request.url))
    case 'student':
      return NextResponse.redirect(new URL(`/${locale}/student/home`, request.url))
    default:
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }
}
