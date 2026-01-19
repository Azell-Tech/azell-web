    export type NavItem = { id: string; label: string; path: string; badge?: string };
export type NavSection = { label: string; items: NavItem[] };

export const NAV: NavSection[] = [
  {
    label: 'Inversión',
    items: [
      { id: 'dash', label: 'Dashboard', path: '/dashboard' },
    ],
  },
  {
    label: 'Administración',
    items: [
      { id: 'admin-users', label: 'Usuarios', path: '/admin/users' },
      { id: 'admin-products', label: 'Producto 12m', path: '/admin/products' },
    ],
  },
];
