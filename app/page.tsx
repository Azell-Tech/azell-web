"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  Calendar,
  ChevronRight,
  CreditCard,
  LineChart,
  Lock,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";

type Session = {
  userId: number;
  email: string;
  name: string;
  tenant: string;
};

function getSession(): Session | null {
  const s =
    localStorage.getItem("azell_session") ||
    sessionStorage.getItem("azell_session");
  return s ? JSON.parse(s) : null;
}

function getApiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
}

function money(n: number) {
  const safe = Number.isFinite(n) ? n : 0;
  return safe.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  const s = String(d).slice(0, 10);
  const [y, m, day] = s.split("-").map(Number);
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  if (!y || !m || !day) return s;
  return `${day} ${months[(m || 1) - 1]} ${y}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function progressPctFromDates(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return null;
  const s = new Date(String(startDate).slice(0, 10) + "T00:00:00");
  const e = new Date(String(endDate).slice(0, 10) + "T00:00:00");
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e.getTime() <= s.getTime())
    return null;

  const now = new Date();
  const total = e.getTime() - s.getTime();
  const done = now.getTime() - s.getTime();
  return clamp((done / total) * 100, 0, 100);
}

function maskEmail(email: string) {
  const e = (email || "").trim();
  const [local, domain] = e.split("@");
  if (!domain) return e;
  const local2 =
    local.length <= 2 ? "***" : `${local.slice(0, 1)}***${local.slice(-1)}`;
  return `${local2}@${domain}`;
}

function isStatus(v: any, s: string) {
  return String(v || "").toLowerCase() === s.toLowerCase();
}

function formatBonusPct(v: any) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  // si viene 0.03 -> 3% o si viene 3 -> 3%
  const pct = n > 0 && n <= 1 ? n * 100 : n;
  return `${Math.round(pct * 100) / 100}%`;
}

type Txn = {
  id: number | string;
  type: "deposit" | "investment" | "yield" | "fee" | "withdrawal";
  description: string;
  date: string;
  reference: string;
  status: "Aplicado" | "En proceso";
  amount: number;
  productId?: number | string | null;
};

type Product = {
  id: number | string;
  name: string;
  subtitle?: string | null;
  status: string;
  term?: string | null;
  rate?: string | null;

  invested?: number | null;

  // Fechas del user_products (ya vienen desde /dashboard)
  startDate?: string | null;
  maturity?: string | null;

  // extras de user_products (ya vienen desde /dashboard)
  termMonths?: number | null;
  annualRate?: number | null;
  noWithdrawBonus?: number | string | null;
  periodRate?: number | string | null;
  contractNumber?: string | null;
  country?: string | null;
  indicatedPayment?: string | null;
  currency?: string | null;
};

type DashboardResp = {
  summary?: {
    balance?: number;
    totalYield?: number;
  };
  products: Product[];
  transactions: Txn[];
};

export default function Page() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<DashboardResp | null>(null);

  // oportunidades (solo disponibles)
  const [available, setAvailable] = useState<Product[]>([]);

  const [modal, setModal] = useState<{ open: boolean; title: string; message: string }>(() => ({
    open: false,
    title: "",
    message: "",
  }));

  const [withdraw, setWithdraw] = useState<{
    open: boolean;
    product: Product | null;
    amount: string;
    busy: boolean;
    error: string | null;
    ok: boolean;
  }>({
    open: false,
    product: null,
    amount: "",
    busy: false,
    error: null,
    ok: false,
  });

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    setSession(s);
  }, [router]);

  // --- load dashboard + available products
  useEffect(() => {
    const run = async () => {
      if (!session?.userId) return;

      const apiBase = getApiBase();
      if (!apiBase) {
        setLoading(false);
        setDash({ products: [], transactions: [] });
        setAvailable([]);
        return;
      }

      setLoading(true);
      try {
        const [rDash, rAvail] = await Promise.all([
          fetch(`${apiBase}/dashboard/${session.userId}`, { cache: "no-store" }),
          fetch(`${apiBase}/products?status=Disponible`, { cache: "no-store" }),
        ]);

        if (!rDash.ok) throw new Error("Error cargando dashboard");
        const data = (await rDash.json()) as DashboardResp;

        setDash({
          summary: data.summary || {},
          products: Array.isArray(data.products) ? data.products : [],
          transactions: Array.isArray(data.transactions) ? data.transactions : [],
        });

        if (rAvail.ok) {
          const prod = (await rAvail.json()) as Product[];
          // hard filter defensivo: SOLO Disponible
          const onlyDisponible = (Array.isArray(prod) ? prod : []).filter((p) =>
            isStatus((p as any)?.status, "Disponible")
          );
          setAvailable(onlyDisponible);
        } else {
          setAvailable([]);
        }
      } catch {
        setDash({ products: [], transactions: [] });
        setAvailable([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [session?.userId]);

  const products = dash?.products || [];
  const transactionsAll = dash?.transactions || [];

  const activeProducts = useMemo(
    () => products.filter((p) => isStatus(p.status, "Activo")),
    [products]
  );

  const txns = useMemo(() => {
    const sorted = [...transactionsAll].sort((a, b) => {
      const da = new Date(String(a.date).slice(0, 10)).getTime() || 0;
      const db = new Date(String(b.date).slice(0, 10)).getTime() || 0;
      if (db !== da) return db - da;
      return String(b.id).localeCompare(String(a.id));
    });
    return sorted;
  }, [transactionsAll]);

  // capital invertido desde productos (si viene)
  const investedFromProducts = useMemo(() => {
    return activeProducts.reduce((acc, p) => acc + (Number(p.invested) || 0), 0);
  }, [activeProducts]);

  // rendimiento simple (demo): usa annualRate si existe, si no usa rate
  const projectedYield = useMemo(() => {
    let total = 0;
    for (const p of activeProducts) {
      const inv = Number(p.invested) || 0;
      const annual = Number(p.annualRate);
      // annualRate si viene como 0.12 o 12
      const pct =
        Number.isFinite(annual)
          ? annual > 0 && annual <= 1
            ? annual * 100
            : annual
          : (() => {
              const m = String(p.rate || "").match(/(\d+(\.\d+)?)/);
              return m ? Number(m[1]) : 0;
            })();

      total += Math.round(inv * (pct / 100));
    }
    return total;
  }, [activeProducts]);

  const netWorth = useMemo(
    () => investedFromProducts + projectedYield,
    [investedFromProducts, projectedYield]
  );

  // YTD = yields del año / capital invertido
  const ytd = useMemo(() => {
    const year = new Date().getFullYear();
    const ytdYield = transactionsAll.reduce((acc, t) => {
      const d = String(t.date || "").slice(0, 10);
      const y = Number(d.split("-")[0]);
      if (t.type === "yield" && y === year) return acc + (Number(t.amount) || 0);
      return acc;
    }, 0);

    const base = investedFromProducts || 0;
    if (!base) return 0;
    return clamp(ytdYield / base, 0, 0.999);
  }, [transactionsAll, investedFromProducts]);

  // progreso por producto activo:
  // start = user_products.start_date
  // end = user_products.maturity_date
  const progressBars = useMemo(() => {
    return activeProducts.map((p) => {
      const pid = String(p.id);
      const start = p.startDate ? String(p.startDate).slice(0, 10) : null;
      const end = p.maturity ? String(p.maturity).slice(0, 10) : null;
      const pct = progressPctFromDates(start, end);

      return {
        id: pid,
        name: p.name,
        endDate: end,
        pct: pct === null ? 0 : clamp(pct, 0, 100),
      };
    });
  }, [activeProducts]);

  async function refreshDashboard() {
    if (!session?.userId) return;
    const apiBase = getApiBase();
    if (!apiBase) return;

    const rDash = await fetch(`${apiBase}/dashboard/${session.userId}`, { cache: "no-store" });
    if (!rDash.ok) return;

    const data = (await rDash.json()) as DashboardResp;
    setDash({
      summary: data.summary || {},
      products: Array.isArray(data.products) ? data.products : [],
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
    });
  }

  async function submitWithdraw() {
    if (!session?.userId) return;

    const apiBase = getApiBase();
    if (!apiBase) {
      setWithdraw((w) => ({
        ...w,
        error: "Falta configurar NEXT_PUBLIC_API_BASE_URL.",
        busy: false,
      }));
      return;
    }

    const p = withdraw.product;
    if (!p?.id) {
      setWithdraw((w) => ({ ...w, error: "Selecciona un producto.", busy: false }));
      return;
    }

    const amountNum = Number(String(withdraw.amount).replace(/[^\d.]/g, ""));
    if (!amountNum || amountNum <= 0) {
      setWithdraw((w) => ({ ...w, error: "Ingresa un monto válido.", busy: false }));
      return;
    }

    const invested = Number(p.invested) || 0;
    if (invested <= 0) {
      setWithdraw((w) => ({ ...w, error: "Este producto no tiene inversión registrada.", busy: false }));
      return;
    }

    if (amountNum > invested) {
      setWithdraw((w) => ({
        ...w,
        error: `El monto debe ser menor o igual al valor invertido (${money(invested)}).`,
        busy: false,
      }));
      return;
    }

    setWithdraw((w) => ({ ...w, busy: true, error: null, ok: false }));

    try {
      const r = await fetch(`${apiBase}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.userId,
          amount: amountNum,
          productId: p.id,
        }),
      });

      const payload = await r.json().catch(() => null);

      if (!r.ok) {
        throw new Error(payload?.message || "Error registrando retiro.");
      }

      setWithdraw((w) => ({ ...w, busy: false, ok: true }));

      // refresca dashboard (saldo y txns)
      await refreshDashboard();
    } catch (e: any) {
      setWithdraw((w) => ({
        ...w,
        busy: false,
        error: e?.message || "No se pudo registrar el retiro.",
      }));
    }
  }

  if (!session) return null;
  if (loading && !dash) return null;

  return (
    <div className="min-h-screen bg-[#EEF0F2] text-[#101820]">
      {/* Modal genérico */}
      {modal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-[#242B33] text-white border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="text-lg font-semibold">{modal.title}</div>
              <div className="mt-2 text-sm text-white/70 leading-5">{modal.message}</div>

              <button
                onClick={() => setModal({ open: false, title: "", message: "" })}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#38D430] text-black font-semibold hover:opacity-90 transition"
              >
                Entendido <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal retiro */}
      {withdraw.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-[#242B33] text-white border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="text-lg font-semibold">Retiro</div>
              <div className="mt-1 text-sm text-white/70">
                {withdraw.product?.name || "Producto"}
              </div>

              <div className="mt-4">
                <label className="block text-xs text-white/60 mb-2">Monto a retirar</label>
                <input
                  inputMode="decimal"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none"
                  placeholder="Ej. 50000"
                  value={withdraw.amount}
                  onChange={(e) => setWithdraw((w) => ({ ...w, amount: e.target.value }))}
                />
                <div className="mt-2 text-xs text-white/50">
                  Máximo:{" "}
                  <span className="text-white/80 font-semibold">
                    ${money(Number(withdraw.product?.invested) || 0)}
                  </span>
                </div>
              </div>

              {withdraw.error && (
                <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {withdraw.error}
                </div>
              )}

              {withdraw.ok && (
                <div className="mt-3 rounded-2xl border border-[#38D430]/25 bg-[#38D430]/10 px-4 py-3 text-sm text-[#C7F7C5]">
                  Solicitud registrada. Quedó en proceso y el saldo fue actualizado.
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() =>
                    setWithdraw({ open: false, product: null, amount: "", busy: false, error: null, ok: false })
                  }
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/15 text-white hover:bg-white/10 transition font-semibold"
                  disabled={withdraw.busy}
                >
                  Cerrar
                </button>

                <button
                  onClick={submitWithdraw}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#38D430] text-black font-semibold hover:opacity-90 transition"
                  disabled={withdraw.busy}
                >
                  {withdraw.busy ? "Procesando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#101820] text-white border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="https://papaya-dieffenbachia-9f2990.netlify.app/Images/Azell_isologo-verde-8.png"
              alt="Azell"
              className="h-7 w-auto"
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight truncate">
                Portal de inversión
              </div>
              <div className="text-xs text-white/60 leading-tight truncate">
                {session.tenant}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <UserRound size={18} className="text-white/85" />
              </div>
              <div className="text-right">
                <div className="text-sm font-medium leading-tight">
                  {session.name}
                </div>
                <div className="text-xs text-white/60 leading-tight">
                  {maskEmail(session.email)}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("azell_session");
                sessionStorage.removeItem("azell_session");
                router.replace("/login");
              }}
              className="px-4 py-2 text-sm rounded-lg border border-white/20 hover:bg-white/10 transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-5 sm:py-6 space-y-4">
        {/* ROW A: Resumen + Oportunidades */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Resumen */}
          <div className="lg:col-span-8 rounded-3xl bg-[#242B33] text-white border border-black/5 shadow-[0_10px_26px_rgba(16,24,32,0.10)] overflow-hidden">
            <div className="relative p-5 sm:p-6">
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.14]"
                style={{
                  background:
                    "radial-gradient(760px 320px at 12% 6%, rgba(56,212,48,.55), transparent 62%), radial-gradient(560px 260px at 92% 14%, rgba(255,255,255,.14), transparent 64%)",
                }}
              />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 text-white/75 text-sm">
                      <Wallet size={16} />
                      <span>Resumen del portafolio</span>
                    </div>
                    <div className="mt-2 text-2xl sm:text-[28px] font-semibold tracking-tight">
                      Patrimonio estimado
                    </div>
                    <div className="mt-1 text-sm text-white/60">
                      Consolidado de productos activos y rendimiento del ciclo.
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-7">
                    <div className="text-[40px] sm:text-[54px] font-semibold tracking-tight leading-none">
                      ${money(netWorth)}
                    </div>
                    <div className="mt-2 text-sm text-white/70">
                      Capital invertido:{" "}
                      <span className="text-white font-semibold">
                        ${money(investedFromProducts)}
                      </span>
                      <span className="text-white/35"> · </span>
                      Rendimiento:{" "}
                      <span className="text-[#38D430] font-semibold">
                        ${money(projectedYield)}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-5 flex flex-wrap gap-2 md:justify-end">
                    <Chip
                      icon={<TrendingUp size={16} className="text-[#38D430]" />}
                      label="YTD"
                      value={`+${Math.round(ytd * 1000) / 10}%`}
                    />
                    <Chip icon={<Lock size={16} className="text-white/85" />} label="Acceso" value="Seguro" />
                    <Chip icon={<ShieldCheck size={16} className="text-white/85" />} label="Estado" value="Verificado" />
                  </div>
                </div>

                {/* Barras por cada producto activo */}
                {progressBars.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {progressBars.map((b) => {
                      const p = activeProducts.find((x) => String(x.id) === String(b.id));
                      if (!p) return null;

                      // rendimiento mostrado desde rate (UI original)
                      const rendMatch = String(p.rate || "").match(/(\d+(\.\d+)?)/);
                      const rend = rendMatch ? Number(rendMatch[1]) : 0;

                      return (
                        <div
                          key={b.id}
                          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="text-sm text-white/75">
                              <span className="font-semibold text-white">{b.name}</span>{" "}
                              <span className="text-white/35">·</span>{" "}
                              <span className="text-white/60">Vence {formatDate(b.endDate)}</span>
                            </div>

                            <span className="text-xs px-3 py-1 rounded-full bg-[#38D430]/15 text-[#38D430] border border-[#38D430]/25">
                              En curso
                            </span>
                          </div>

                          <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full bg-[#38D430]" style={{ width: `${b.pct}%` }} />
                          </div>

                          <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <Kpi icon={<LineChart size={16} />} label="Rendimiento" value={`${rend}%`} accent />
                            <Kpi icon={<Calendar size={16} />} label="Plazo" value={p.term || "—"} />
                            <Kpi icon={<BadgeCheck size={16} />} label="Producto" value={String(p.status || "—")} accent />
                            {/* CAMBIO: antes "Canal: SPEI" -> ahora Bono no retiro */}
                            <Kpi
                              icon={<CreditCard size={16} />}
                              label="Bono no retiro"
                              value={formatBonusPct(p.noWithdrawBonus)}
                            />

                            {/* Botones 50/50 */}
                            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                              <button
                                onClick={() =>
                                  setModal({
                                    open: true,
                                    title: "Invertir",
                                    message: "Próximamente podrás realizar aportes directamente desde el portal.",
                                  })
                                }
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#38D430] text-black font-semibold hover:opacity-90 transition"
                              >
                                Invertir <ArrowUpRight size={16} />
                              </button>

                              <button
                                onClick={() =>
                                  setWithdraw({
                                    open: true,
                                    product: p,
                                    amount: "",
                                    busy: false,
                                    error: null,
                                    ok: false,
                                  })
                                }
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white/85 font-semibold hover:bg-white/[0.08] transition"
                              >
                                Retirar <ArrowUpRight size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Oportunidades desde products WHERE status='Disponible' */}
          <div className="lg:col-span-4 rounded-3xl bg-[#242B33] text-white border border-black/5 shadow-[0_10px_26px_rgba(16,24,32,0.10)] overflow-hidden">
            <div className="relative p-5 sm:p-6">
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.12]"
                style={{
                  background:
                    "radial-gradient(720px 300px at 20% 0%, rgba(56,212,48,.42), transparent 70%)",
                }}
              />
              <div className="relative">
                <div className="inline-flex items-center gap-2 text-white/80 text-sm">
                  <Sparkles size={16} />
                  <span>Nuevos productos</span>
                </div>
                <div className="mt-2 text-xl font-semibold">Oportunidades</div>
                <div className="mt-1 text-sm text-white/60">
                  Productos disponibles para explorar.
                </div>

                <div className="mt-4 space-y-3">
                  {available.length ? (
                    available.slice(0, 6).map((p) => (
                      <button
                        key={String(p.id)}
                        onClick={() =>
                          setModal({
                            open: true,
                            title: p.name,
                            message:
                              "Próximamente tendrás acceso a este producto. Estamos habilitando la contratación desde el portal.",
                          })
                        }
                        className="w-full text-left"
                      >
                        <OpportunityMini
                          title={p.name}
                          tag={p.rate || "Disponible"}
                          icon={<Briefcase size={16} />}
                        />
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-white/70">
                      No hay productos disponibles en este momento.
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    setModal({
                      open: true,
                      title: "Explorar",
                      message:
                        "Próximamente podrás explorar y contratar nuevos productos desde el portal.",
                    })
                  }
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/15 text-white hover:bg-white/10 transition font-semibold"
                >
                  Explorar <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ROW B: Movimientos */}
        <section className="grid grid-cols-1 gap-4">
          <div className="rounded-3xl bg-[#242B33] text-white border border-black/5 shadow-[0_10px_26px_rgba(16,24,32,0.10)] overflow-hidden">
            <div className="p-5 sm:p-6 flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 text-white/80 text-sm">
                  <ReceiptText size={16} />
                  <span>Movimientos</span>
                </div>
                <div className="mt-2 text-xl font-semibold">Actividad reciente</div>
                <div className="mt-1 text-sm text-white/60">
                  Incluye aperturas, rendimientos y retiros.
                </div>
              </div>
              <button
                onClick={() =>
                  setModal({
                    open: true,
                    title: "Histórico de movimientos",
                    message:
                      "Próximamente podrás ver el histórico completo y exportaciones avanzadas.",
                  })
                }
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/15 text-white hover:bg-white/10 transition"
              >
                Ver todo <ChevronRight size={16} />
              </button>
            </div>

            <div className="px-5 sm:px-6 py-2 border-t border-white/10 bg-white/[0.04] text-xs text-white/60">
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-8">Concepto</div>
                <div className="col-span-4 text-right">Monto</div>
              </div>
            </div>

            <div className="divide-y divide-white/10">
              {txns.slice(0, 20).map((t) => (
                <div
                  key={String(t.id)}
                  className="px-5 sm:px-6 py-3 hover:bg-white/[0.04] transition"
                >
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-8 flex items-start gap-3 min-w-0">
                      <TxnIcon type={t.type} />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{t.description}</div>
                        <div className="text-sm text-white/60">
                          {formatDate(t.date)}{" "}
                          <span className="text-white/30">·</span>{" "}
                          <span className="text-white/65">{t.reference}</span>{" "}
                          <span className="text-white/30">·</span>{" "}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              t.status === "Aplicado"
                                ? "bg-[#38D430]/15 text-[#38D430] border-[#38D430]/25"
                                : "bg-white/10 text-white/80 border-white/15"
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-4 text-right">
                      <div className="text-[18px] font-semibold tracking-tight">
                        <span className={Number(t.amount) >= 0 ? "text-[#38D430]" : "text-white"}>
                          {Number(t.amount) >= 0 ? "+" : "−"} ${money(Math.abs(Number(t.amount) || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-white/10">
              <button
                onClick={() =>
                  setModal({
                    open: true,
                    title: "Estado de cuenta",
                    message: "Próximamente podrás descargar el estado de cuenta en PDF.",
                  })
                }
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] transition text-white font-semibold"
              >
                Descargar estado de cuenta <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 text-center text-sm text-slate-500">
        © 2025 Azell. Portal de inversión.
      </footer>
    </div>
  );
}

/* ================= UI components ================= */

function Chip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] border border-white/10 px-3.5 py-1.5">
      {icon}
      <div className="text-sm">
        <span className="text-white/70">{label} </span>
        <span className="text-white font-semibold">{value}</span>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-white/75 text-sm truncate">{label}</div>
        <div className="p-2 rounded-xl bg-white/[0.08] text-white/90">{icon}</div>
      </div>
      <div className={`mt-1.5 text-lg font-semibold ${accent ? "text-[#38D430]" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function TxnIcon({ type }: { type: Txn["type"] }) {
  const base =
    "w-10 h-10 rounded-2xl flex items-center justify-center border bg-white/[0.04]";
  switch (type) {
    case "deposit":
      return (
        <div className={`${base} border-[#38D430]/25`}>
          <Wallet size={18} className="text-[#38D430]" />
        </div>
      );
    case "investment":
      return (
        <div className={`${base} border-white/12`}>
          <LineChart size={18} className="text-white/85" />
        </div>
      );
    case "yield":
      return (
        <div className={`${base} border-[#38D430]/20`}>
          <TrendingUp size={18} className="text-[#38D430]" />
        </div>
      );
    case "withdrawal":
      return (
        <div className={`${base} border-white/12`}>
          <CreditCard size={18} className="text-white/85" />
        </div>
      );
    default:
      return (
        <div className={`${base} border-white/12`}>
          <ReceiptText size={18} className="text-white/85" />
        </div>
      );
  }
}

function OpportunityMini({
  title,
  tag,
  icon,
}: {
  title: string;
  tag: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 hover:bg-white/[0.08] transition">
      <div className="flex items-start justify-between gap-3">
        <div className="p-2 rounded-xl bg-white/[0.08] text-white/90">{icon}</div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/80">
          {tag}
        </span>
      </div>
      <div className="mt-3">
        <div className="font-semibold">{title}</div>
      </div>
    </div>
  );
}
