export const demo = {
  tenantCode: 'AZELL',
  admin: { email: 'admin@azell.dev', password: 'Azell12345', name: 'Admin Azell' },
  user:  { email: 'user@azell.dev',  password: 'Azell12345', name: 'Cristian Demo' },
};

export const product12m = {
  name: 'Inversión 12 meses',
  termMonths: 12,
  annualRate: 12.0,
  minContribution: 500,
  currency: 'MXN',
};

export function formatMoney(n: number, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(n);
}
