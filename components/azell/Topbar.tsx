'use client';

import Link from 'next/link';
import { me, portfolio } from '@/lib/mock-portal';

export default function Topbar() {
  return (
    <header className="sticky top-0 z-20 backdrop-blur border-b border-white/10 bg-[#242B33cc]">
      <div className="px-6 max-md:px-4 py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-white/60 text-xs">Bienvenido</div>
          <div className="font-semibold truncate">{me.name}</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-xs text-white/55">Próximo pago</div>
            <div className="text-sm font-semibold">{portfolio.nextPayoutAt}</div>
          </div>

          <Link href="/app/inversiones/12m" className="btn btn-primary">
            Invertir
          </Link>
        </div>
      </div>
    </header>
  );
}
