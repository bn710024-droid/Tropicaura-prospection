import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createContactSchema, zodDetails } from "@/lib/schemas";
import { logActivity } from "@/lib/activity";
import { type Contact } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/contacts  → tous les contacts, jointure entreprise (page /contacts).
export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*, prospects(id, company_name, country, status, last_contact_at, next_reminder_at)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

// POST /api/contacts  → ajoute un contact à une entreprise (prospect_id).
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation échouée", details: zodDetails(parsed.error) },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.from("contacts").insert(parsed.data).select().single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const contact = data as Contact;
  await logActivity({
    agent: "crm",
    action: "contact.create",
    prospectId: contact.prospect_id,
    meta: { contact_id: contact.id, full_name: contact.full_name },
  });

  return NextResponse.json({ ok: true, data: contact }, { status: 201 });
}
