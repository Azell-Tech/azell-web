import { NextResponse } from 'next/server';
import { COOKIE_NAME, encodeSession } from '@/lib/session';
import { demo } from '@/lib/mock';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const tenantCode = String(body.tenantCode || '').trim() || demo.tenantCode;
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  // demo credentials
  const isAdmin = email === demo.admin.email && password === demo.admin.password;
  const isUser = email === demo.user.email && password === demo.user.password;

  if (!isAdmin && !isUser) {
    return NextResponse.json({ message: 'Credenciales inválidas (demo)' }, { status: 401 });
  }

  const session = {
    tenantCode,
    email,
    userName: isAdmin ? demo.admin.name : demo.user.name,
    role: isAdmin ? 'ADMIN' : 'USER',
    approved: isAdmin ? true : true, // demo: user ya aprobado al loguear
  } as const;

  const res = NextResponse.json({ ok: true, session });
  res.cookies.set(COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: false,
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
