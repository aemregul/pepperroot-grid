import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Auth sayfasına ve API'lere izin ver
    const { pathname } = request.nextUrl;

    if (
        pathname === '/auth' ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Cookie kontrolü
    const authCookie = request.cookies.get('site-auth');

    if (authCookie?.value !== 'authenticated') {
        // Auth sayfasına yönlendir
        const authUrl = new URL('/auth', request.url);
        return NextResponse.redirect(authUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};