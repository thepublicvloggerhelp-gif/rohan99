import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function redirectWithCookies(url: URL | string, supabaseResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url)
  supabaseResponse.cookies.getAll().forEach(cookie => {
    redirectResponse.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      maxAge: cookie.maxAge,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      expires: cookie.expires,
    })
  })
  return redirectResponse
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { pathname } = request.nextUrl
  const { data: { user } } = await supabase.auth.getUser()

  const publicRoutes = ['/login', '/signup', '/pending']

  // Auth routes: redirect authenticated users away
  const authRoutes = ['/login', '/signup']
  if (user && authRoutes.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/chat'
    return redirectWithCookies(url, supabaseResponse)
  }

  // Redirect approved users away from pending page
  if (user && pathname === '/pending') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single()
    if (profile?.status === 'approved') {
      const url = request.nextUrl.clone()
      url.pathname = '/chat'
      return redirectWithCookies(url, supabaseResponse)
    }
  }

  // Protected routes: require authentication
  if (!user && !publicRoutes.includes(pathname) && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return redirectWithCookies(url, supabaseResponse)
  }

  // Check approval status for authenticated users
  if (user && !publicRoutes.includes(pathname) && pathname !== '/') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status, role')
      .eq('id', user.id)
      .single()

    if (profile?.status === 'pending' && pathname !== '/pending') {
      const url = request.nextUrl.clone()
      url.pathname = '/pending'
      return redirectWithCookies(url, supabaseResponse)
    }

    if (profile?.status === 'banned') {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'banned')
      return redirectWithCookies(url, supabaseResponse)
    }

    if (profile?.status === 'rejected') {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'rejected')
      return redirectWithCookies(url, supabaseResponse)
    }

    // Admin routes: restrict to admin role
    if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/chat'
      return redirectWithCookies(url, supabaseResponse)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
