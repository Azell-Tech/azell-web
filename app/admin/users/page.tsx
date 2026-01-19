import Pill from '@/components/ui/Pill';

export default function AdminUsersPage() {
  const users = [
    { name: 'Cristian Demo', email: 'user@azell.dev', status: 'APPROVED' },
    { name: 'Nuevo Usuario', email: 'nuevo@azell.dev', status: 'PENDING' },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-white/55">Backoffice</div>
          <div className="text-2xl font-semibold tracking-tight">Usuarios</div>
        </div>
        <Pill>mock</Pill>
      </div>

      <div className="card">
        <div className="card-title">Lista</div>
        <table className="w-full text-sm">
          <thead className="text-white/55">
            <tr>
              <th className="text-left py-2">Nombre</th>
              <th className="text-left py-2">Email</th>
              <th className="text-left py-2">Estado</th>
              <th className="text-right py-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} className="border-t border-white/10">
                <td className="py-2">{u.name}</td>
                <td className="py-2 text-white/70">{u.email}</td>
                <td className="py-2">
                  {u.status === 'APPROVED' ? <Pill tone="ok">approved</Pill> : <Pill tone="warn">pending</Pill>}
                </td>
                <td className="py-2 text-right">
                  <button className="btn btn-ghost h-9 px-3 text-xs">Aprobar (mock)</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 text-xs text-white/45">
          En fase 1 real, aquí consumirás el endpoint de approve/reject del API.
        </div>
      </div>
    </div>
  );
}
