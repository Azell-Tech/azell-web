import Pill from '@/components/ui/Pill';
import { product12m, formatMoney } from '@/lib/mock';

export default function AdminProductsPage() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-white/55">Backoffice</div>
          <div className="text-2xl font-semibold tracking-tight">Producto 12m</div>
        </div>
        <Pill>config mock</Pill>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="card-title">Configuración</div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs text-white/55 mb-1">Nombre</div>
              <input className="input-dark" defaultValue={product12m.name} />
            </div>
            <div>
              <div className="text-xs text-white/55 mb-1">Plazo</div>
              <input className="input-dark" defaultValue={`${product12m.termMonths} meses`} />
            </div>
            <div>
              <div className="text-xs text-white/55 mb-1">Tasa anual</div>
              <input className="input-dark" defaultValue={`${product12m.annualRate}%`} />
            </div>
            <div>
              <div className="text-xs text-white/55 mb-1">Mínimo</div>
              <input className="input-dark" defaultValue={formatMoney(product12m.minContribution)} />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button className="btn btn-primary">Guardar (mock)</button>
            <button className="btn btn-outline">Desactivar (mock)</button>
          </div>

          <div className="mt-3 text-xs text-white/45">
            En fase 1 real, esto se conecta a endpoints /investment-products.
          </div>
        </div>

        <div className="card">
          <div className="card-title">Estado</div>
          <div className="text-lg font-semibold">Activo</div>
          <div className="text-sm text-white/60 mt-2">
            Versión MVP: 1 producto único y configurable.
          </div>
          <div className="mt-4 p-3 rounded-2xl border border-white/10 bg-white/5 text-xs text-white/55">
            Recomendación demo: mantén valores simples (tasa/plazo/mínimo) para que el inversionista entienda en 10 segundos.
          </div>
        </div>
      </div>
    </div>
  );
}
