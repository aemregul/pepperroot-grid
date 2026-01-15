import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Şifre kontrolü için cookie kontrol et
    const isAuthenticated = request.cookies.get('site-auth')?.value === 'authenticated';

    // Auth sayfasına erişime izin ver
    if (request.nextUrl.pathname === '/auth') {
        return NextResponse.next();
    }

    // API route'larına izin ver (auth API için)
    if (request.nextUrl.pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    // Authenticated değilse auth sayfasına yönlendir
    if (!isAuthenticated) {
        return NextResponse.redirect(new URL('/auth', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
    ],
};