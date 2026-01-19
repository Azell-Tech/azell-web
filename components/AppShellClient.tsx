'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoMark from './ui/LogoMark';
import type { NavSection } from '@/lib/sitemap';

export default function AppShellClient({ nav, children }: { nav: NavSection[]; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="layout">
      <aside className="sidebar p-4 md:p-5">
        <div className="mb-5">
          <LogoMark />
        </div>

        <nav className="space-y-5">
          {nav.map((sec) => (
            <div key={sec.label}>
              <div className="text-[11px] uppercase tracking-wider text-white/45 mb-2">{sec.label}</div>
              <div className="space-y-1">
                {sec.items.map((it) => {
                  const active = pathname === it.path || pathname.startsWith(it.path + '/');
                  return (
                    <Link
                      key={it.id}
                      href={it.path}
                      className={`block px-3 py-2 rounded-xl border ${
                        active ? 'border-white/18 bg-white/6' : 'border-transparent hover:border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <div className="text-sm font-medium">{it.label}</div>
                      {it.badge && <div className="text-xs text-white/45 mt-0.5">{it.badge}</div>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-6 p-3 rounded-2xl border border-white/10 bg-white/5">
          <div className="text-xs text-white/55">Semana 1</div>
          <div className="text-sm font-semibold mt-1">UI + flujos simulados</div>
          <div className="text-xs text-white/45 mt-1">Sin STP, sin API real</div>
        </div>
      </aside>

      <section className="content">{children}</section>
    </div>
  );
}
