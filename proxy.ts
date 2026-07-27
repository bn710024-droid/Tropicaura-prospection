import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionToken } from "@/lib/site-auth";
import { checkRateLimit } from "@/lib/rate-limit";

const PUBLIC_PATHS = ["/login", "/api/login", "/api/health"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limiting sur l'API (le login a sa propre limite plus stricte, cf. app/api/login/route.ts).
  if (pathname.startsWith("/api/") && pathname !== "/api/login") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { allowed, retryAfterSeconds } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Trop de requêtes, réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const expected = await sessionToken();
  if (!expected) {
    // SITE_PASSWORD non configuré (typiquement en dev local) : verrou désactivé.
    return NextResponse.next();
  }

  if (req.cookies.get(SESSION_COOKIE)?.value === expected) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "Non authentifié" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png).*)"],
};
