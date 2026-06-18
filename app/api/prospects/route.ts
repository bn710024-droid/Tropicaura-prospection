import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createProspectSchema, listQuerySchema, zodDetails } from "@/lib/schemas";
import { logActivity } from "@/lib/activity";
import { type Prospect } from "@/types";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 200;

// GET /api/prospects?status=&minScore=&limit=  → liste triée par score desc.
export async function GET(req: NextRequest) {
  const parsed = listQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Paramètres invalides", details: zodDetails(parsed.error) },
      { status: 400 }
    );
  }
  const { status, minScore, limit } = parsed.data;

  const supabase = createServerClient();
  let query = supabase
    .from("prospects")
    .select("*")
    .order("score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit ?? DEFAULT_LIMIT);

  if (status) query = query.eq("status", status);
  if (minScore !== undefined) query = query.gte("score", minScore);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, data: data as Prospect[] });
}

// POST /api/prospects  → création (statut 'new' par défaut).
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createProspectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation échouée", details: zodDetails(parsed.error) },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const insertRow = { ...parsed.data, status: parsed.data.status ?? "new" };
  const { data, error } = await supabase
    .from("prospects")
    .insert(insertRow)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { ok: false, error: "Doublon : un prospect avec ce nom et ce pays existe déjà" },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const prospect = data as Prospect;
  await logActivity({
    agent: "crm",
    action: "prospect.create",
    prospectId: prospect.id,
    meta: { company_name: prospect.company_name, country: prospect.country },
  });

  return NextResponse.json({ ok: true, data: prospect }, { status: 201 });
}
