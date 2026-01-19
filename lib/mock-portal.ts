export type Movement = {
  id: string;
  at: string;
  type: 'DEPOSITO_STP' | 'INVERSION' | 'RENDIMIENTO';
  amount: number;
  status: 'CONFIRMADO' | 'PENDIENTE';
  ref?: string;
};

export const me = {
  name: 'Cristian',
  kycStatus: 'LISTO' as 'PENDIENTE' | 'LISTO',
};

export const portfolio = {
  totalInvested: 125000,
  totalYieldAccrued: 3420,
  nextPayoutAt: '2026-01-15',
  product12m: {
    name: 'Inversión 12 meses',
    rateAnnual: 12.8,
    termMonths: 12,
    invested: 100000,
    status: 'ACTIVA' as 'ACTIVA' | 'DISPONIBLE',
  },
};

export const movements: Movement[] = [
  { id:'m1', at:'2025-12-22 10:18', type:'DEPOSITO_STP', amount: 50000, status:'CONFIRMADO', ref:'STP-10293' },
  { id:'m2', at:'2025-12-22 10:22', type:'INVERSION', amount: -50000, status:'CONFIRMADO', ref:'INV-12M-0007' },
  { id:'m3', at:'2025-12-29 09:10', type:'DEPOSITO_STP', amount: 75000, status:'CONFIRMADO', ref:'STP-11340' },
  { id:'m4', at:'2025-12-29 09:14', type:'INVERSION', amount: -50000, status:'CONFIRMADO', ref:'INV-12M-0012' },
  { id:'m5', at:'2025-12-30 08:00', type:'RENDIMIENTO', amount: 120, status:'PENDIENTE', ref:'YLD-0003' },
];
