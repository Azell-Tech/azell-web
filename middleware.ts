import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Rutas públicas (no requieren sesión)
 */
const PUBLIC_PATHS = ["/login", "/_next", "/favicon.ico", "/assets"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir públicos
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Cookie de sesión (simulada)
  const session = req.cookies.get("azell_session")?.value;

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
