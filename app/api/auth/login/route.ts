import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        // Şifreyi .env'den al
        const correctPassword = process.env.SITE_PASSWORD;

        if (!correctPassword) {
            console.error("SITE_PASSWORD not set in environment");
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }

        if (password === correctPassword) {
            const response = NextResponse.json({ success: true });

            // Cookie set et (30 gün geçerli)
            response.cookies.set('site-auth', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 365 * 100, // Sınırsız (100 yıl)
                path: '/',
            });

            return response;
        }

        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}