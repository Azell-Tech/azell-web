import StatCard from '@/components/ui/StatCard';
import Pill from '@/components/ui/Pill';
import { product12m, formatMoney } from '@/lib/mock';

export default function DashboardPage() {
  // Mock numbers (para demo)
  const principal = 12500;
  const estYield = 410;
  const available = 0;

  return (
    <div className="p-0">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-white/55">Inversión</div>
            <div className="text-2xl font-semibold tracking-tight">Dashboard</div>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="ok">mvp</Pill>
            <Pill>sin stp</Pill>
          </div>
        </div>
        <p className="text-white/60 mt-2 max-w-3xl">
          Vista limpia para inversionista: capital, rendimiento estimado, producto 12 meses y movimientos simulados.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard title="Capital invertido" value={formatMoney(principal)} hint="principal acumulado (mock)" />
        <StatCard title="Rendimiento estimado" value={formatMoney(estYield)} hint={`tasa anual ${product12m.annualRate}% (mock)`} />
        <StatCard title="Disponible para invertir" value={formatMoney(available)} hint="se habilita con depósitos STP (fase 2)" />
      </div>

      <div className="grid gap-3 mt-3 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="card-title">Movimientos (simulados)</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-white/55">
                <tr>
                  <th className="text-left py-2">Fecha</th>
                  <th className="text-left py-2">Tipo</th>
                  <th className="text-right py-2">Monto</th>
                  <th className="text-left py-2">Estado</th>
                </tr>
              </thead>
              <tbody className="text-white/85">
                {[
                  { d: '2025-12-29 10:21', t: 'Aporte', a: 5000, s: 'posted' },
                  { d: '2025-12-15 09:10', t: 'Aporte', a: 7500, s: 'posted' },
                  { d: '2025-12-01 08:40', t: 'Apertura', a: 0, s: 'active' },
                ].map((m, i) => (
                  <tr key={i} className="border-t border-white/10">
                    <td className="py-2">{m.d}</td>
                    <td className="py-2">{m.t}</td>
                    <td className="py-2 text-right">{formatMoney(m.a)}</td>
                    <td className="py-2">
                      <span className="inline-flex px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-xs">
                        {m.s}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Producto</div>
          <div className="text-lg font-semibold tracking-tight">{product12m.name}</div>
          <div className="mt-2 text-sm text-white/70 space-y-1">
            <div>Plazo: <span className="text-white/90">{product12m.termMonths} meses</span></div>
            <div>Tasa anual: <span className="text-white/90">{product12m.annualRate}%</span></div>
            <div>Mínimo: <span className="text-white/90">{formatMoney(product12m.minContribution)}</span></div>
          </div>

          <div className="mt-4 grid gap-2">
            <button className="btn btn-primary" disabled>
              Simular depósito (fase 2)
            </button>
            <button className="btn btn-outline">
              Simular aporte (mock)
            </button>
          </div>

          <div className="mt-3 text-xs text-white/45">
            En fase 2, los depósitos vendrán de STP y alimentarán movimientos y ledger.
          </div>
        </div>
      </div>
    </div>
  );
}
