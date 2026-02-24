import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const isGoldilexSubdomain =
    host === 'goldilex.briefica.com' || host.startsWith('goldilex.');

  if (isGoldilexSubdomain) {
    const { pathname, search } = req.nextUrl;

    // Already routed to /goldilex or /api — pass through
    if (pathname.startsWith('/goldilex') || pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    // Rewrite everything else to /goldilex
    const url = req.nextUrl.clone();
    url.pathname = '/goldilex' + (pathname === '/' ? '' : pathname);
    url.search = search;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
