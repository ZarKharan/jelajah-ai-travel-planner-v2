import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(
        new URL('/login?setup=supabase', request.url)
      );
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (path.startsWith('/dashboard') && (!user || error)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (
    (path === '/login' || path === '/register') &&
    user &&
    !error
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};

