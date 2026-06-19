import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { zodDetails } from "@/lib/schemas";
import { logActivity } from "@/lib/activity";
import type { Email } from "@/types";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const patchSchema = z
  .object({
    subject: z.string().optional(),
    body: z.string().optional(),
    status: z.string().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "Aucun champ à mettre à jour" });

// PATCH /api/emails/[id] — revue humaine : sauvegarde subject/body édités + status (ready_to_send).
// AUCUN envoi (Phase 2).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ ok: false, error: "id invalide" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation échouée", details: zodDetails(parsed.error) },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("emails")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: "Email introuvable" }, { status: 404 });

  const email = data as Email;
  await logActivity({
    agent: "crm",
    action: "email.update",
    prospectId: email.prospect_id,
    meta: { email_id: email.id, status: email.status },
  });

  return NextResponse.json({ ok: true, data: email });
}
