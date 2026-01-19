'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/app', label: 'Portafolio' },
  { href: '/app/inversiones', label: 'Inversiones' },
  { href: '/app/movimientos', label: 'Movimientos' },
  { href: '/app/documentos', label: 'Documentos' },
  { href: '/app/ajustes', label: 'Ajustes' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar min-h-screen p-4 max-lg:p-3">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl border border-white/10 bg-white/5 grid place-items-center">
            <div
              className="w-5 h-5 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(56,212,48,.95), rgba(56,212,48,.55))',
                boxShadow: '0 12px 34px rgba(56,212,48,.20)',
              }}
            />
          </div>
          <div className="max-lg:hidden">
            <div className="font-semibold tracking-tight">Azell</div>
            <div className="text-xs text-white/55">Scaling Business</div>
          </div>
        </div>
      </div>

      <nav className="space-y-1">
        {items.map(i => {
          const active = pathname === i.href;
          return (
            <Link
              key={i.href}
              href={i.href}
              className={[
                'block rounded-xl px-3 py-2 text-sm border transition',
                active
                  ? 'bg-white/7 border-white/15'
                  : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10',
              ].join(' ')}
            >
              <span className="max-lg:hidden">{i.label}</span>
              <span className="lg:hidden">•</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 pt-4 border-t border-white/10 text-xs text-white/50 max-lg:hidden">
        Portal inversionista
      </div>
    </aside>
  );
}
