import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Route dynamique : exécutée à la requête (jamais au build), elle interroge la DB.
export const dynamic = "force-dynamic";

/**
 * P1-01 — appel test : prouve que l'API route parle à Supabase via le client
 * service-role. Renvoie le nombre de prospects (table créée par 0001_init.sql).
 * Tant que .env.local n'est pas rempli ou que la migration n'a pas été lancée,
 * renvoie { ok: false, error } — c'est l'étape de vérification live côté humain.
 */
export async function GET() {
  try {
    const supabase = createServerClient();
    const { error, count } = await supabase
      .from("prospects")
      .select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, prospects_count: count ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
