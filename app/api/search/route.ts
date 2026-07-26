import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// PostgREST utilise `,`, `(` et `)` comme séparateurs structurels dans `.or()` :
// on les retire pour empêcher l'utilisateur d'injecter des conditions de filtre arbitraires.
function sanitizeForOrFilter(input: string): string {
  return input.replace(/[,()]/g, "").trim();
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const q = sanitizeForOrFilter(raw);
  if (q.length < 2) return NextResponse.json({ results: [] });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, company_name, country, segment, status")
    .or(`company_name.ilike.%${q}%,country.ilike.%${q}%,segment.ilike.%${q}%`)
    .limit(8);

  if (error) return NextResponse.json({ results: [] }, { status: 500 });
  return NextResponse.json({ results: data ?? [] });
}
