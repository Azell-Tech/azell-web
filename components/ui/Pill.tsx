export default function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral'|'ok'|'warn' }) {
  const cls =
    tone === 'ok'
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'
      : tone === 'warn'
        ? 'border-yellow-400/25 bg-yellow-400/10 text-yellow-100'
        : 'border-white/15 bg-white/5 text-white/70';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${cls}`}>
      {children}
    </span>
  );
}
