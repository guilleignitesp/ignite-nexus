import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserProfile, getRoleHomePath } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params
  const code = new URL(request.url).searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  const profile = await getUserProfile()

  if (!profile) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  return NextResponse.redirect(new URL(getRoleHomePath(profile, locale), request.url))
}
