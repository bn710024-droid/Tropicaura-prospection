import { NextRequest, NextResponse } from "next/server";
import { isValidPassword, sessionToken, SESSION_COOKIE } from "@/lib/site-auth";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // Limite stricte (10/min) sur le login : c'est la cible d'un éventuel brute-force,
  // contrairement au reste de l'API où la limite générale (60/min) suffit.
  const { allowed, retryAfterSeconds } = checkRateLimit(`login:${ip}`, 10);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Trop de tentatives, réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const password = (body as { password?: unknown }).password;
  if (typeof password !== "string" || !(await isValidPassword(password))) {
    return NextResponse.json({ ok: false, error: "Mot de passe incorrect" }, { status: 401 });
  }

  const token = await sessionToken();
  if (!token) {
    return NextResponse.json({ ok: false, error: "SITE_PASSWORD non configuré côté serveur" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
