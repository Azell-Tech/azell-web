"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const LOGO_ISOLOGO_GREEN =
  "https://papaya-dieffenbachia-9f2990.netlify.app/Images/Azell_isologo-verde-8.png";

type Session = {
  userId: number;
  email: string;
  name: string;
  tenant: string;
  keep: boolean;
  at: string;
  mustChangePassword?: boolean;
};

function getSession(): Session | null {
  const s =
    localStorage.getItem("azell_session") ||
    sessionStorage.getItem("azell_session");
  return s ? JSON.parse(s) : null;
}

function saveSession(sess: Session) {
  const keep = !!sess.keep;
  if (keep) localStorage.setItem("azell_session", JSON.stringify(sess));
  else sessionStorage.setItem("azell_session", JSON.stringify(sess));
}

function getApiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
}

export default function FirstAccessPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subtitle = useMemo(
    () => "Por seguridad, debes establecer una nueva contraseña para continuar.",
    []
  );

  useEffect(() => {
    const s = getSession();
    if (!s?.userId) {
      router.replace("/login");
      return;
    }
    setSession(s);
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);

    if (!session?.userId) return;

    if (newPass.length < 8) {
      setError("La nueva contraseña debe tener mínimo 8 caracteres.");
      return;
    }
    if (newPass !== newPass2) {
      setError("La confirmación no coincide.");
      return;
    }

    const apiBase = getApiBase();
    if (!apiBase) {
      setError("Falta configurar NEXT_PUBLIC_API_BASE_URL en .env.local.");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch(`${apiBase}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.userId,
          oldPassword: oldPass,
          newPassword: newPass,
        }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        setError(data?.message || "No fue posible cambiar la contraseña.");
        return;
      }

      const updated: Session = { ...session, mustChangePassword: false };
      saveSession(updated);
      setOkMsg("Contraseña actualizada. Redirigiendo...");

      setTimeout(() => router.replace("/"), 600);
    } catch (err: any) {
      setError(err?.message || "Error conectando con el API.");
    } finally {
      setLoading(false);
    }
  }

  if (!session) return null;

  return (
    <div className="az-bg">
      <div className="mx-auto min-h-screen max-w-6xl px-5 py-8 lg:py-10 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <section className="hidden lg:block">
            <div className="flex items-center justify-between">
              <img src={LOGO_ISOLOGO_GREEN} alt="Azell" className="h-9 w-auto" draggable={false} />
              <span className="az-pill">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#38D430" }} />
                Primer acceso
              </span>
            </div>

            <div className="mt-12">
              <h1 className="az-serif text-[44px] leading-[1.05] text-[#EFF0F1]">
                Seguridad primero.
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-6 text-white/75">
                Estamos habilitando tu acceso de forma controlada. Este cambio aplica una única vez.
              </p>
              <div className="mt-10 text-xs text-white/55">
                © 2025 Azell. Todos los derechos reservados.
              </div>
            </div>
          </section>

          <section className="w-full">
            <div className="az-card mx-auto w-full max-w-md overflow-hidden">
              <div className="px-6 pt-6">
                <div className="lg:hidden flex items-center justify-between mb-4">
                  <img src={LOGO_ISOLOGO_GREEN} alt="Azell" className="h-8 w-auto" draggable={false} />
                  <span className="az-pill">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#38D430" }} />
                    Primer acceso
                  </span>
                </div>

                <div className="az-accent mb-5" />

                <h2 className="text-[22px] font-extrabold text-[#101820]">
                  Cambiar contraseña
                </h2>
                <p className="mt-1 text-[13px] text-[rgba(16,24,32,.70)]">
                  {subtitle}
                </p>

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-[12px] text-red-700">
                    {error}
                  </div>
                )}
                {okMsg && (
                  <div className="mt-4 rounded-2xl border border-green-600/20 bg-green-600/5 px-4 py-3 text-[12px] text-green-700">
                    {okMsg}
                  </div>
                )}

                <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                  <div>
                    <label className="az-label block mb-2">Contraseña actual</label>
                    <input
                      className="az-input"
                      type="password"
                      placeholder="••••••••"
                      value={oldPass}
                      onChange={(e) => setOldPass(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="az-label block mb-2">Nueva contraseña</label>
                    <input
                      className="az-input"
                      type="password"
                      placeholder="mínimo 8 caracteres"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="az-label block mb-2">Confirmar nueva contraseña</label>
                    <input
                      className="az-input"
                      type="password"
                      placeholder="repite la nueva contraseña"
                      value={newPass2}
                      onChange={(e) => setNewPass2(e.target.value)}
                    />
                  </div>

                  <button
                    className="az-btn az-btn-primary w-full"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Actualizando..." : "Actualizar y continuar"}
                  </button>

                  <p className="az-help text-center">
                    Usuario: <span className="font-semibold">{session.email}</span>
                  </p>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-black/5 bg-white/60">
                <p className="text-[11px] text-[rgba(16,24,32,.60)] leading-4">
                  Por seguridad, evita reutilizar contraseñas y no compartas tus credenciales.
                </p>
              </div>
            </div>

            <div className="lg:hidden mt-6 text-center text-xs text-white/55">
              © 2025 Azell. Todos los derechos reservados.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
