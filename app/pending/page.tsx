import Pill from '@/components/ui/Pill';
import Button from '@/components/ui/Button';

export default function PendingPage() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="glass w-full max-w-xl p-7">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/55">Estado</div>
            <div className="text-2xl font-semibold tracking-tight mt-1">Registro pendiente</div>
          </div>
          <Pill tone="warn">aprobación requerida</Pill>
        </div>

        <p className="text-white/60 mt-4">
          Para la demo de semana 1, este es el punto de control operativo: el admin aprueba y el usuario puede operar.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <a className="btn btn-outline" href="/login">Volver a login</a>
          <a className="btn btn-primary" href="/login">Usar demo usuario aprobado</a>
        </div>

        <div className="mt-4 text-xs text-white/45">
          Nota: el flujo real (semana 2+) conectará aprobación a API/Prisma y estado KYC.
        </div>
      </div>
    </main>
  );
}
