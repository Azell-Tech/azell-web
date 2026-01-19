import { NextResponse } from 'next/server';
import { COOKIE_NAME, encodeSession } from '@/lib/session';
import { demo } from '@/lib/mock';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const tenantCode = String(body.tenantCode || demo.tenantCode).trim();
  const name = String(body.name || 'Nuevo Usuario').trim();
  const email = String(body.email || '').trim().toLowerCase();

  // Simulación: usuario queda pendiente (no aprobado)
  const session = {
    tenantCode,
    email,
    userName: name,
    role: 'USER',
    approved: false,
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
