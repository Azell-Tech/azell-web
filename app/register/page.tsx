'use client';

import { useState } from 'react';
import LogoMark from '@/components/ui/LogoMark';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { demo } from '@/lib/mock';

export default function RegisterPage() {
  const [tenantCode, setTenantCode] = useState(demo.tenantCode);
  const [name, setName] = useState('Nuevo Usuario');
  const [email, setEmail] = useState('nuevo@azell.dev');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ tenantCode, name, email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Error');
      window.location.href = '/pending';
    } catch (err: any) {
      setMsg(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="glass w-full max-w-lg p-7">
        <LogoMark />
        <div className="mt-6">
          <div className="text-sm text-white/55">Onboarding</div>
          <div className="text-2xl font-semibold tracking-tight mt-1">Crear registro</div>
          <p className="text-white/60 mt-2">
            En el MVP semana 1, el registro queda en estado <span className="text-yellow-200">pendiente</span> hasta aprobación.
          </p>
        </div>

        <form onSubmit={onRegister} className="mt-5 space-y-3">
          <div>
            <div className="text-xs text-white/55 mb-1">Tenant</div>
            <Input value={tenantCode} onChange={(e) => setTenantCode(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-white/55 mb-1">Nombre</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-white/55 mb-1">Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <Button disabled={loading} type="submit" className="w-full">
            {loading ? 'Creando...' : 'Enviar registro'}
          </Button>

          {msg && <div className="text-sm text-red-300 mt-2">{msg}</div>}

          <div className="text-sm text-white/55 mt-2">
            ¿Ya tienes acceso? <a className="underline" href="/login">Volver a login</a>
          </div>
        </form>
      </div>
    </main>
  );
}
