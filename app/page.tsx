// D:\Desarrollo\Azell\web\app\page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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

function normalizeKey(v: any) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function isPendingStatus(v: any) {
  const k = normalizeKey(v);
  return (
    k === "enproceso" ||
    k === "enprogreso" ||
    k === "proceso" ||
    k === "pendiente" ||
    k === "pending" ||
    k === "processing" ||
    k === "inprocess" ||
    k === "inprogress"
  );
}

function isAppliedStatus(v: any) {
  const k = normalizeKey(v);
  return k === "aplicado" || k === "aplicada" || k === "applied" || k === "completed";
}

/**
 * FIX CLAVE:
 * En tu BD el retiro también aparece en `transactions` con `type` VACÍO,
 * pero con description "Solicitud de retiro" y reference "WDR-...."
 */
function isWithdrawalLike(t: any) {
  const typeK = normalizeKey(t?.type);
  if (typeK === "withdrawal" || typeK === "withdraw" || typeK === "retiro") return true;

  // fallback cuando `type` viene vacío
  const desc = normalizeKey(t?.description);
  const ref = String(t?.reference || "").trim().toUpperCase();

  if (!typeK && (desc.includes("retiro") || ref.startsWith("WDR"))) return true;

  return false;
}

function formatBonusPct(v: any) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  const pct = n > 0 && n <= 1 ? n * 100 : n;
  return `${Math.round(pct * 100) / 100}%`;
}

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

type Txn = {
  id: number | string;
  type: "deposit" | "investment" | "yield" | "fee" | "withdrawal" | string;
  description: string;
  date: string;
  reference: string;
  status: "Aplicado" | "En proceso" | string;
  amount: number;
  productId?: number | string | null;
  product_id?: number | string | null; // por si el backend lo manda así
  txn_date?: string; // por si el backend lo manda así
};

type Product = {
  id: number | string;
  name: string;
  subtitle?: string | null;
  status: string;
  term?: string | null;
  rate?: string | null;

  invested?: number | null;

  startDate?: string | null;
  maturity?: string | null;

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

async function fetchJsonSafe(input: RequestInfo, init?: RequestInit) {
  const r = await fetch(input, init);
  const text = await r.text().catch(() => "");
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }
  return { ok: r.ok, status: r.status, data };
}

function withTimeout<T>(p: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Tiempo de espera agotado.")), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export default function Page() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<DashboardResp | null>(null);

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
    confirmStep: boolean;
  }>({
    open: false,
    product: null,
    amount: "",
    busy: false,
    error: null,
    ok: false,
    confirmStep: false,
  });

  const [cancelBusy, setCancelBusy] = useState<Record<string, boolean>>({});

  const closeWithdraw = () =>
    setWithdraw({
      open: false,
      product: null,
      amount: "",
      busy: false,
      error: null,
      ok: false,
      confirmStep: false,
    });

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    setSession(s);
  }, [router]);

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
          fetchJsonSafe(`${apiBase}/dashboard/${session.userId}`, { cache: "no-store" }),
          fetchJsonSafe(`${apiBase}/products?status=Disponible`, { cache: "no-store" }),
        ]);

        if (!rDash.ok) throw new Error("Error cargando dashboard");

        const data = (rDash.data || {}) as DashboardResp;

        setDash({
          summary: (data as any).summary || {},
          products: Array.isArray((data as any).products) ? (data as any).products : [],
          transactions: Array.isArray((data as any).transactions) ? (data as any).transactions : [],
        });

        if (rAvail.ok) {
          const prod = (Array.isArray(rAvail.data) ? rAvail.data : []) as Product[];
          const onlyDisponible = prod.filter((p) => isStatus((p as any)?.status, "Disponible"));
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
  const transactionsAll = (dash?.transactions || []) as Txn[];

  const activeProducts = useMemo(
    () => products.filter((p) => isStatus(p.status, "Activo")),
    [products]
  );

  const txns = useMemo(() => {
    const sorted = [...transactionsAll].sort((a, b) => {
      const da = new Date(String(a.date || a.txn_date).slice(0, 10)).getTime() || 0;
      const db = new Date(String(b.date || b.txn_date).slice(0, 10)).getTime() || 0;
      if (db !== da) return db - da;
      return String(b.id).localeCompare(String(a.id));
    });
    return sorted;
  }, [transactionsAll]);

  // ---------- retiros por producto (aplicados / en proceso) ----------
  const withdrawalsByProduct = useMemo(() => {
    const map: Record<
      string,
      {
        pendingSum: number;
        appliedSum: number;
        pending: Array<{ id: string; reference: string; date: string; amountAbs: number; status: string }>;
      }
    > = {};

    const seen = new Set<string>();

    for (const t of transactionsAll) {
      if (!isWithdrawalLike(t)) continue;

      const pidRaw = (t.productId ?? (t as any).product_id) as any;
      const pid =
        pidRaw !== undefined && pidRaw !== null && String(pidRaw).trim() !== ""
          ? String(pidRaw)
          : "unknown";

      if (!map[pid]) map[pid] = { pendingSum: 0, appliedSum: 0, pending: [] };

      const amtAbs = Math.abs(safeNum((t as any).amount));
      const status = String((t as any).status || "");
      const ref = String((t as any).reference || `WDR-${(t as any).id}`);
      const date = String((t as any).date || (t as any).txn_date || "");

      // dedupe básico (si alguna vez recibes el mismo retiro repetido)
      const key = `${pid}|${ref}|${amtAbs}|${normalizeKey(status)}|${String(date).slice(0, 10)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (isPendingStatus(status)) {
        map[pid].pendingSum += amtAbs;
        map[pid].pending.push({
          id: String((t as any).id),
          reference: ref,
          date,
          amountAbs: amtAbs,
          status,
        });
      } else if (isAppliedStatus(status)) {
        map[pid].appliedSum += amtAbs;
      }
    }

    for (const k of Object.keys(map)) {
      map[k].pending.sort((a, b) => {
        const da = new Date(String(a.date).slice(0, 10)).getTime() || 0;
        const db = new Date(String(b.date).slice(0, 10)).getTime() || 0;
        return db - da;
      });
    }

    return map;
  }, [transactionsAll]);

  const investedGross = useMemo(() => {
    return activeProducts.reduce((acc, p) => acc + safeNum(p.invested), 0);
  }, [activeProducts]);

  const withdrawalsAppliedTotal = useMemo(() => {
    return activeProducts.reduce((acc, p) => {
      const pid = String(p.id);
      const w = withdrawalsByProduct[pid];
      return acc + (w?.appliedSum || 0);
    }, 0);
  }, [activeProducts, withdrawalsByProduct]);

  const yieldAppliedTotal = useMemo(() => {
    return transactionsAll.reduce((acc, t) => {
      if (normalizeKey((t as any).type) !== "yield") return acc;
      return acc + safeNum((t as any).amount);
    }, 0);
  }, [transactionsAll]);

  const netWorth = useMemo(() => {
    const saldo = Math.max(0, investedGross - withdrawalsAppliedTotal);
    return saldo + Math.max(0, yieldAppliedTotal);
  }, [investedGross, withdrawalsAppliedTotal, yieldAppliedTotal]);

  const ytd = useMemo(() => {
    const year = new Date().getFullYear();
    const ytdYield = transactionsAll.reduce((acc, t) => {
      const d = String((t as any).date || (t as any).txn_date || "").slice(0, 10);
      const y = Number(d.split("-")[0]);
      if (normalizeKey((t as any).type) === "yield" && y === year) return acc + safeNum((t as any).amount);
      return acc;
    }, 0);

    const base = Math.max(0, investedGross - withdrawalsAppliedTotal) || 0;
    if (!base) return 0;
    return clamp(ytdYield / base, 0, 0.999);
  }, [transactionsAll, investedGross, withdrawalsAppliedTotal]);

  const progressBars = useMemo(() => {
    return activeProducts.map((p) => {
      const pid = String(p.id);

      const startRaw =
        p.startDate ||
        (p as any).start_date ||
        (p as any).startDate ||
        null;

      const endRaw =
        p.maturity ||
        (p as any).maturity_date ||
        (p as any).maturityDate ||
        null;

      const start = startRaw ? String(startRaw).slice(0, 10) : null;
      const end = endRaw ? String(endRaw).slice(0, 10) : null;

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

    const rDash = await fetchJsonSafe(`${apiBase}/dashboard/${session.userId}`, { cache: "no-store" });
    if (!rDash.ok) return;

    const data = (rDash.data || {}) as DashboardResp;
    setDash({
      summary: (data as any).summary || {},
      products: Array.isArray((data as any).products) ? (data as any).products : [],
      transactions: Array.isArray((data as any).transactions) ? (data as any).transactions : [],
    });
  }

  function productPendingSum(p: Product) {
    const pid = String(p.id);
    return withdrawalsByProduct[pid]?.pendingSum || 0;
  }

  function productAppliedSum(p: Product) {
    const pid = String(p.id);
    return withdrawalsByProduct[pid]?.appliedSum || 0;
  }

  function productSaldo(p: Product) {
    const invested = safeNum(p.invested);
    const applied = productAppliedSum(p);
    return Math.max(0, invested - applied);
  }

  function productDisponibleParaRetiro(p: Product) {
    const saldo = productSaldo(p);
    const pending = productPendingSum(p);
    return Math.max(0, saldo - pending);
  }

  function openWithdraw(p: Product) {
    setWithdraw({
      open: true,
      product: p,
      amount: "",
      busy: false,
      error: null,
      ok: false,
      confirmStep: false,
    });
  }

  const successCloseTimer = useRef<any>(null);
  useEffect(() => {
    return () => {
      if (successCloseTimer.current) clearTimeout(successCloseTimer.current);
    };
  }, []);

  async function submitWithdrawConfirmed() {
    if (!session?.userId) return;

    const apiBase = getApiBase();
    if (!apiBase) {
      setWithdraw((w) => ({
        ...w,
        error: "Falta configurar NEXT_PUBLIC_API_BASE_URL.",
        busy: false,
        confirmStep: false,
      }));
      return;
    }

    const p = withdraw.product;
    if (!p?.id) {
      setWithdraw((w) => ({ ...w, error: "Selecciona un producto.", busy: false, confirmStep: false }));
      return;
    }

    const amountNum = Number(String(withdraw.amount).replace(/[^\d.]/g, ""));
    if (!amountNum || amountNum <= 0) {
      setWithdraw((w) => ({ ...w, error: "Ingresa un monto válido.", busy: false, confirmStep: false }));
      return;
    }

    const disponible = productDisponibleParaRetiro(p);
    if (disponible <= 0) {
      setWithdraw((w) => ({
        ...w,
        error: "No tienes saldo disponible para retiro en este producto.",
        busy: false,
        confirmStep: false,
      }));
      return;
    }

    if (amountNum > disponible) {
      setWithdraw((w) => ({
        ...w,
        error: `El monto debe ser menor o igual al disponible (${money(disponible)}).`,
        busy: false,
        confirmStep: false,
      }));
      return;
    }

    setWithdraw((w) => ({ ...w, busy: true, error: null, ok: false }));

    try {
      const call = fetchJsonSafe(`${apiBase}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.userId,
          amount: amountNum,
          productId: p.id,
        }),
      });

      const res = await withTimeout(call, 15000);

      if (!res.ok) {
        const msg =
          (typeof res.data === "object" && (res.data as any)?.message) ||
          (typeof res.data === "string" && res.data) ||
          "Error registrando retiro.";
        throw new Error(msg);
      }

      setWithdraw((w) => ({ ...w, busy: false, ok: true, confirmStep: false }));

      await refreshDashboard();

      successCloseTimer.current = setTimeout(() => {
        closeWithdraw();
      }, 900);
    } catch (e: any) {
      setWithdraw((w) => ({
        ...w,
        busy: false,
        error: e?.message || "No se pudo registrar el retiro.",
        confirmStep: false,
      }));
    }
  }

  async function requestWithdraw() {
    const p = withdraw.product;
    if (!p) return;

    const amountNum = Number(String(withdraw.amount).replace(/[^\d.]/g, ""));
    if (!amountNum || amountNum <= 0) {
      setWithdraw((w) => ({ ...w, error: "Ingresa un monto válido." }));
      return;
    }

    const disponible = productDisponibleParaRetiro(p);
    if (amountNum > disponible) {
      setWithdraw((w) => ({
        ...w,
        error: `El monto debe ser menor o igual al disponible (${money(disponible)}).`,
      }));
      return;
    }

    setWithdraw((w) => ({ ...w, error: null, confirmStep: true }));
  }

  async function cancelWithdrawal(p: Product, reqId: string) {
    if (!session?.userId) return;
    const apiBase = getApiBase();
    if (!apiBase) return;

    const key = `${String(p.id)}:${reqId}`;
    setCancelBusy((m) => ({ ...m, [key]: true }));

    try {
      const a = await fetchJsonSafe(`${apiBase}/withdraw/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.userId, requestId: reqId, productId: p.id }),
      });

      if (a.ok) {
        await refreshDashboard();
        return;
      }

      const b = await fetchJsonSafe(`${apiBase}/withdraw/${reqId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.userId }),
      });

      if (b.ok) {
        await refreshDashboard();
        return;
      }

      const c = await fetchJsonSafe(`${apiBase}/withdrawal_requests/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Rechazado", userId: session.userId }),
      });

      if (!c.ok) {
        throw new Error(
          (typeof c.data === "object" && (c.data as any)?.message) ||
            "No fue posible cancelar con el API actual."
        );
      }

      await refreshDashboard();
    } catch (e: any) {
      setModal({
        open: true,
        title: "No se pudo cancelar",
        message:
          e?.message ||
          "El backend no expone un endpoint de cancelación compatible. Ajusta la ruta en el front o habilita el endpoint.",
      });
    } finally {
      setCancelBusy((m) => ({ ...m, [key]: false }));
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

              {withdraw.product && (
                <div className="mt-3 text-sm text-white/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Pendiente en proceso:</span>
                    <span className="font-semibold text-white/90">
                      ${money(productPendingSum(withdraw.product))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Retiros aplicados:</span>
                    <span className="font-semibold text-white/90">
                      ${money(productAppliedSum(withdraw.product))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Máximo disponible:</span>
                    <span className="font-semibold text-[#38D430]">
                      ${money(productDisponibleParaRetiro(withdraw.product))}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-xs text-white/60 mb-2">Monto a retirar</label>
                <input
                  inputMode="decimal"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none"
                  placeholder="Ej. 50000"
                  value={withdraw.amount}
                  onChange={(e) =>
                    setWithdraw((w) => ({ ...w, amount: e.target.value, error: null }))
                  }
                  disabled={withdraw.busy}
                />
              </div>

              {withdraw.error && (
                <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {withdraw.error}
                </div>
              )}

              {withdraw.ok && (
                <div className="mt-3 rounded-2xl border border-[#38D430]/25 bg-[#38D430]/10 px-4 py-3 text-sm text-[#C7F7C5]">
                  Solicitud registrada. Quedó en proceso.
                </div>
              )}

              {withdraw.confirmStep && withdraw.product && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                  <div className="text-sm font-semibold text-white">Confirmación</div>
                  <div className="mt-1 text-sm text-white/70 leading-5">
                    Vas a solicitar un retiro de{" "}
                    <span className="text-white font-semibold">
                      ${money(Number(String(withdraw.amount).replace(/[^\d.]/g, "")) || 0)}
                    </span>{" "}
                    del producto{" "}
                    <span className="text-white font-semibold">{withdraw.product.name}</span>.
                  </div>
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => setWithdraw((w) => ({ ...w, confirmStep: false }))}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/15 text-white hover:bg-white/10 transition font-semibold"
                      disabled={withdraw.busy}
                    >
                      Volver
                    </button>
                    <button
                      onClick={submitWithdrawConfirmed}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#38D430] text-black font-semibold hover:opacity-90 transition"
                      disabled={withdraw.busy}
                    >
                      {withdraw.busy ? "Procesando..." : "Sí, retirar"}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  onClick={closeWithdraw}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/15 text-white hover:bg-white/10 transition font-semibold"
                  disabled={withdraw.busy}
                >
                  Cerrar
                </button>

                <button
                  onClick={requestWithdraw}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#38D430] text-black font-semibold hover:opacity-90 transition"
                  disabled={withdraw.busy || withdraw.confirmStep}
                >
                  Confirmar
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
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
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
                      Capital + rendimiento aplicado (no proyección).
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
                        ${money(Math.max(0, investedGross - withdrawalsAppliedTotal))}
                      </span>
                      <span className="text-white/35"> · </span>
                      Rendimiento aplicado:{" "}
                      <span className="text-[#38D430] font-semibold">
                        ${money(Math.max(0, yieldAppliedTotal))}
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

                {progressBars.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {progressBars.map((b) => {
                      const p = activeProducts.find((x) => String(x.id) === String(b.id));
                      if (!p) return null;

                      const rendMatch = String(p.rate || "").match(/(\d+(\.\d+)?)/);
                      const rend = rendMatch ? Number(rendMatch[1]) : 0;

                      const pendingList = withdrawalsByProduct[String(p.id)]?.pending || [];
                      const pendingSum = productPendingSum(p);

                      const saldo = productSaldo(p);
                      const disponible = productDisponibleParaRetiro(p);

                      return (
                        <div
                          key={b.id}
                          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5"
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
                            <Kpi icon={<Wallet size={16} />} label="Saldo" value={`$${money(saldo)}`} accent />
                            <Kpi icon={<LineChart size={16} />} label="Rendimiento" value={`$${money(0)}`} />
                            <Kpi icon={<Calendar size={16} />} label="Plazo" value={p.term || "—"} />
                            <Kpi icon={<BadgeCheck size={16} />} label="Tasa" value={`${rend}%`} accent />

                            <Kpi
                              icon={<CreditCard size={16} />}
                              label="Bono no retiro"
                              value={formatBonusPct(p.noWithdrawBonus)}
                            />

                            <div className="rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-2.5 lg:col-span-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-white/75 text-sm truncate">Retiros en proceso</div>
                                <div className="text-[#38D430] font-semibold">${money(pendingSum)}</div>
                              </div>
                              <div className="mt-1 text-xs text-white/60">
                                Disponible para retiro:{" "}
                                <span className="text-white font-semibold">${money(disponible)}</span>
                              </div>

                              {pendingList.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {pendingList.slice(0, 3).map((w) => {
                                    const key = `${String(p.id)}:${w.id}`;
                                    const busy = !!cancelBusy[key];
                                    return (
                                      <div
                                        key={w.id}
                                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 flex items-center justify-between gap-3"
                                      >
                                        <div className="min-w-0">
                                          <div className="text-sm text-white/85 truncate">
                                            {w.reference} · ${money(w.amountAbs)}
                                          </div>
                                          <div className="text-xs text-white/55">
                                            {formatDate(w.date)} · En proceso
                                          </div>
                                        </div>

                                        <button
                                          onClick={() => cancelWithdrawal(p, w.id)}
                                          disabled={busy}
                                          className="shrink-0 px-3 py-1.5 rounded-lg border border-white/15 text-white/90 hover:bg-white/10 transition text-sm font-semibold"
                                        >
                                          {busy ? "Cancelando..." : "Cancelar"}
                                        </button>
                                      </div>
                                    );
                                  })}
                                  {pendingList.length > 3 && (
                                    <div className="text-xs text-white/55">
                                      +{pendingList.length - 3} solicitudes más en proceso.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

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
                                onClick={() => openWithdraw(p)}
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

          {/* Oportunidades */}
          <div className="lg:col-span-4 self-start rounded-3xl bg-[#242B33] text-white border border-black/5 shadow-[0_10px_26px_rgba(16,24,32,0.10)] overflow-hidden">
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

                <div className="mt-4 space-y-2.5 max-h-[520px] overflow-auto pr-1">
                  {available.length ? (
                    available.slice(0, 8).map((p) => (
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

        {/* Movimientos */}
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
              {txns.slice(0, 20).map((t) => {
                const amt = safeNum((t as any).amount);
                const isNeg = amt < 0;

                return (
                  <div
                    key={String((t as any).id)}
                    className="px-5 sm:px-6 py-3 hover:bg-white/[0.04] transition"
                  >
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-8 flex items-start gap-3 min-w-0">
                        <TxnIcon type={(t as any).type as any} />
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{(t as any).description}</div>
                          <div className="text-sm text-white/60">
                            {formatDate((t as any).date || (t as any).txn_date)}{" "}
                            <span className="text-white/30">·</span>{" "}
                            <span className="text-white/65">{(t as any).reference}</span>{" "}
                            <span className="text-white/30">·</span>{" "}
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border ${
                                isAppliedStatus((t as any).status)
                                  ? "bg-[#38D430]/15 text-[#38D430] border-[#38D430]/25"
                                  : "bg-white/10 text-white/80 border-white/15"
                              }`}
                            >
                              {(t as any).status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-4 text-right">
                        <div className="text-[18px] font-semibold tracking-tight">
                          <span className={isNeg ? "text-white" : "text-[#38D430]"}>
                            {isNeg ? "−" : "+"} ${money(Math.abs(amt))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
    <div className="rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-white/75 text-sm truncate">{label}</div>
        <div className="p-2 rounded-xl bg-white/[0.08] text-white/90">{icon}</div>
      </div>
      <div className={`mt-1 text-lg font-semibold ${accent ? "text-[#38D430]" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function TxnIcon({ type }: { type: Txn["type"] }) {
  const base =
    "w-10 h-10 rounded-2xl flex items-center justify-center border bg-white/[0.04]";
  switch (normalizeKey(type)) {
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 hover:bg-white/[0.08] transition">
      <div className="flex items-start justify-between gap-3">
        <div className="p-2 rounded-xl bg-white/[0.08] text-white/90">{icon}</div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/80">
          {tag}
        </span>
      </div>
      <div className="mt-2">
        <div className="font-semibold">{title}</div>
      </div>
    </div>
  );
}
