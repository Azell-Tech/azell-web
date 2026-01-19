// D:\Desarrollo\Azell\web\app\login\page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const LOGO_ISOLOGO_GREEN =
  "https://papaya-dieffenbachia-9f2990.netlify.app/Images/Azell_isologo-verde-8.png";

const DEMO_EMAIL = "demo@azell.mx";
const DEMO_PASS = "Azell2025!";

function setAzellCookie(value: string, days = 7) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `azell_session=${encodeURIComponent(
    value
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

type ApiUser = {
  id: number;
  email: string;
  name: string;
};

function getApiBase() {
  // define en .env.local => NEXT_PUBLIC_API_BASE_URL=https://<tu-api>.up.railway.app
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
}

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);

  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASS);

  const [name, setName] = useState("");
  const [keep, setKeep] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const title = useMemo(
    () => (mode === "login" ? "Inicia sesión" : "Crea tu cuenta"),
    [mode]
  );

  const subtitle = useMemo(
    () =>
      mode === "login"
        ? "Accede a tu portafolio y al control de tus inversiones."
        : "Configura tu acceso y comienza a invertir con Azell.",
    [mode]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Pequeña pausa para conservar sensación del mockup (sin afectar lógica)
      await new Promise((r) => setTimeout(r, 250));

      const apiBase = getApiBase();
      if (!apiBase) {
        setError("Falta configurar NEXT_PUBLIC_API_BASE_URL en .env.local.");
        return;
      }

      if (mode === "login") {
        const r = await fetch(`${apiBase}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        });

        if (!r.ok) {
          setError("Credenciales inválidas. Verifica tu correo y contraseña.");
          return;
        }

        const data = (await r.json()) as {
          user: ApiUser;
          mustChangePassword?: boolean;
        };

        const session = {
          userId: data.user.id,
          email: data.user.email,
          name: data.user.name,
          tenant: "Azell",
          keep,
          at: new Date().toISOString(),
          mustChangePassword: !!data.mustChangePassword,
        };

        // Storage (cliente)
        if (keep) localStorage.setItem("azell_session", JSON.stringify(session));
        else sessionStorage.setItem("azell_session", JSON.stringify(session));

        // Cookie (servidor/middleware)
        setAzellCookie(
          JSON.stringify({ ok: true, at: Date.now() }),
          keep ? 30 : 1
        );

        // Primer acceso: obliga cambio de contraseña
        if (data.mustChangePassword) {
          router.replace("/first-access");
          return;
        }

        router.replace("/");
        return;
      }

      // Registro sigue simulado (para demo).
      if (!name.trim()) {
        setError("Ingresa tu nombre.");
        return;
      }
      if (!email.trim()) {
        setError("Ingresa tu correo.");
        return;
      }
      if (!password) {
        setError("Crea una contraseña.");
        return;
      }

      const session = {
        userId: 0,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        tenant: "Azell",
        keep,
        at: new Date().toISOString(),
        mustChangePassword: false,
      };

      if (keep) localStorage.setItem("azell_session", JSON.stringify(session));
      else sessionStorage.setItem("azell_session", JSON.stringify(session));

      setAzellCookie(
        JSON.stringify({ ok: true, at: Date.now() }),
        keep ? 30 : 1
      );

      router.replace("/");
    } catch (err: any) {
      setError(
        err?.message ||
          "Error conectando con el API. Verifica que Railway esté arriba."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="az-bg">
      <div className="mx-auto min-h-screen max-w-6xl px-5 py-8 lg:py-10 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Desktop left */}
          <section className="hidden lg:block">
            <div className="flex items-center justify-between">
              <img
                src={LOGO_ISOLOGO_GREEN}
                alt="Azell"
                className="h-9 w-auto"
                draggable={false}
              />
              <span className="az-pill">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: "#38D430" }}
                />
                Acceso seguro
              </span>
            </div>

            <div className="mt-12">
              <h1 className="az-serif text-[44px] leading-[1.05] text-[#EFF0F1]">
                Scaling Business.
              </h1>

              <p className="mt-4 max-w-xl text-[15px] leading-6 text-white/75">
                Azell es una plataforma financiera diseñada para gestionar
                inversiones con claridad, control y una experiencia moderna.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-4 max-w-xl">
                <Feature
                  title="Rendimiento pactado"
                  desc="Productos estructurados con condiciones claras desde el inicio."
                />
                <Feature
                  title="Movimientos trazables"
                  desc="Seguimiento detallado de depósitos y flujos financieros."
                />
                <Feature
                  title="Operación auditable"
                  desc="Controles y registros listos para cumplimiento y crecimiento."
                />
                <Feature
                  title="Experiencia premium"
                  desc="Interfaz limpia, rápida y pensada para decisiones financieras."
                />
              </div>

              <div className="mt-10 text-xs text-white/55">
                © 2025 Azell. Todos los derechos reservados.
              </div>
            </div>
          </section>

          {/* Card */}
          <section className="w-full">
            <div className="az-card mx-auto w-full max-w-md overflow-hidden">
              <div className="px-6 pt-6">
                <div className="lg:hidden flex items-center justify-between mb-4">
                  <img
                    src={LOGO_ISOLOGO_GREEN}
                    alt="Azell"
                    className="h-8 w-auto"
                    draggable={false}
                  />
                  <span className="az-pill">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: "#38D430" }}
                    />
                    Acceso seguro
                  </span>
                </div>

                <div className="az-accent mb-5" />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[22px] font-extrabold text-[#101820]">
                      {title}
                    </h2>
                    <p className="mt-1 text-[13px] text-[rgba(16,24,32,.70)]">
                      {subtitle}
                    </p>
                  </div>

                  <div className="rounded-full border border-black/10 bg-white/70 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError(null);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${
                        mode === "login"
                          ? "bg-[#101820] text-[#EFF0F1]"
                          : "text-[#101820]/70 hover:bg-black/5"
                      }`}
                    >
                      Entrar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setError(null);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${
                        mode === "register"
                          ? "bg-[#101820] text-[#EFF0F1]"
                          : "text-[#101820]/70 hover:bg-black/5"
                      }`}
                    >
                      Crear
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-[12px] text-red-700">
                    {error}
                  </div>
                )}

                <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                  {mode === "register" && (
                    <div>
                      <label className="az-label block mb-2">Nombre</label>
                      <input
                        className="az-input"
                        placeholder="Tu nombre completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="az-label block mb-2">Correo</label>
                    <input
                      className="az-input"
                      placeholder="tu@correo.com"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="az-label block mb-2">Contraseña</label>
                    <div className="relative">
                      <input
                        className="az-input pr-20"
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-[#101820]"
                      >
                        {showPass ? "Ocultar" : "Ver"}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-[12px] text-[rgba(16,24,32,.72)]">
                      <input
                        type="checkbox"
                        className="az-check"
                        checked={keep}
                        onChange={(e) => setKeep(e.target.checked)}
                      />
                      Mantener sesión
                    </label>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-[12px] az-link"
                    >
                      Recuperar acceso
                    </a>
                  </div>

                  <button
                    className="az-btn az-btn-primary w-full"
                    type="submit"
                    disabled={loading}
                  >
                    {loading
                      ? "Procesando..."
                      : mode === "login"
                      ? "Entrar"
                      : "Crear cuenta"}
                  </button>

                  <p className="az-help text-center">
                    {mode === "login" ? (
                      <>
                        ¿Nuevo en Azell?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setMode("register");
                            setError(null);
                          }}
                          className="az-link font-semibold"
                        >
                          Crear cuenta
                        </button>
                      </>
                    ) : (
                      <>
                        ¿Ya tienes cuenta?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setMode("login");
                            setError(null);
                          }}
                          className="az-link font-semibold"
                        >
                          Iniciar sesión
                        </button>
                      </>
                    )}
                  </p>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-black/5 bg-white/60">
                <p className="text-[11px] text-[rgba(16,24,32,.60)] leading-4">
                  Azell opera bajo estándares de seguridad y control para la
                  gestión responsable de inversiones.
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

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-sm font-semibold text-white/90">{title}</div>
      <div className="mt-1 text-[12px] text-white/60 leading-4">{desc}</div>
    </div>
  );
}
