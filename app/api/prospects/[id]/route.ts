import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { updateProspectSchema, zodDetails } from "@/lib/schemas";
import { canTransition } from "@/lib/prospect-status";
import { logActivity } from "@/lib/activity";
import { type Prospect } from "@/types";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID_RE.test(s);

type Params = { params: Promise<{ id: string }> };

// GET /api/prospects/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ ok: false, error: "id invalide" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: "Prospect introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true, data: data as Prospect });
}

// PATCH /api/prospects/[id]  → maj champs + changement de statut validé.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ ok: false, error: "id invalide" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const parsed = updateProspectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation échouée", details: zodDetails(parsed.error) },
      { status: 400 }
    );
  }
  const updates = parsed.data;

  const supabase = createServerClient();
  const { data: current, error: fetchErr } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 });
  if (!current) return NextResponse.json({ ok: false, error: "Prospect introuvable" }, { status: 404 });

  const currentProspect = current as Prospect;
  const statusChanged = !!updates.status && updates.status !== currentProspect.status;

  if (statusChanged) {
    if (!canTransition(currentProspect.status, updates.status!)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Transition interdite : ${currentProspect.status} → ${updates.status}`,
        },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase
    .from("prospects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { ok: false, error: "Doublon : nom + pays déjà existant" },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  await logActivity({
    agent: "crm",
    action: statusChanged ? "prospect.status_change" : "prospect.update",
    prospectId: id,
    meta: statusChanged
      ? { from: currentProspect.status, to: updates.status }
      : { fields: Object.keys(updates) },
  });

  return NextResponse.json({ ok: true, data: data as Prospect });
}

// DELETE /api/prospects/[id]  (cascade : contacts/tasks/reminders).
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ ok: false, error: "id invalide" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("prospects")
    .select("id, company_name, country")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ ok: false, error: "Prospect introuvable" }, { status: 404 });

  const { error } = await supabase.from("prospects").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  await logActivity({
    agent: "crm",
    action: "prospect.delete",
    prospectId: id,
    meta: { company_name: (existing as { company_name: string }).company_name },
  });

  return NextResponse.json({ ok: true, data: { id } });
}
