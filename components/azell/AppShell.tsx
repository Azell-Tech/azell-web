'use client';

import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative">
      <div className="bg-art" />
      <div className="noise" />

      <div className="relative z-10 grid grid-cols-[280px_1fr] max-lg:grid-cols-[84px_1fr]">
        <Sidebar />
        <div className="min-w-0">
          <Topbar />
          <main className="p-6 max-md:p-4 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
