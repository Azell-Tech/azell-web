'use client';

import { useEffect, useState } from 'react';
import Pill from './ui/Pill';
import Button from './ui/Button';
import { COOKIE_NAME, Session } from '@/lib/session';

export default function UserHeader() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // cookie httpOnly no se lee en client: simulamos el "header" con un fetch liviano
    // Para MVP UI, mostramos un header neutro.
    // Si quieres ver datos reales aquí, lo hacemos server-side con cookies() en un Server Component.
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <header className="px-5 md:px-6 py-4 border-b border-white/10 bg-white/2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold tracking-tight">Azell</div>
          <Pill>demo</Pill>
          <Pill tone="ok">ui</Pill>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => (window.location.href = '/dashboard')}>Dashboard</Button>
          <Button variant="outline" onClick={logout}>Salir</Button>
        </div>
      </div>
    </header>
  );
}
