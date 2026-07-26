import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { updateContactSchema, zodDetails } from "@/lib/schemas";
import { logActivity } from "@/lib/activity";
import { type Contact } from "@/types";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID_RE.test(s);

type Params = { params: Promise<{ id: string }> };

// PATCH /api/contacts/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ ok: false, error: "id invalide" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const parsed = updateContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation échouée", details: zodDetails(parsed.error) },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.from("contacts").update(parsed.data).eq("id", id).select().maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: "Contact introuvable" }, { status: 404 });

  const contact = data as Contact;
  await logActivity({
    agent: "crm",
    action: "contact.update",
    prospectId: contact.prospect_id,
    meta: { contact_id: contact.id },
  });

  return NextResponse.json({ ok: true, data: contact });
}

// DELETE /api/contacts/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ ok: false, error: "id invalide" }, { status: 400 });

  const supabase = createServerClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("contacts")
    .select("id, prospect_id, full_name")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ ok: false, error: "Contact introuvable" }, { status: 404 });

  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const removed = existing as { id: string; prospect_id: string; full_name: string | null };
  await logActivity({
    agent: "crm",
    action: "contact.delete",
    prospectId: removed.prospect_id,
    meta: { contact_id: removed.id, full_name: removed.full_name },
  });

  return NextResponse.json({ ok: true, data: { id } });
}
