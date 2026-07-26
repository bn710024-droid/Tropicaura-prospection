import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { updateReminderSchema, zodDetails } from "@/lib/schemas";
import { logActivity } from "@/lib/activity";
import { type Reminder } from "@/types";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID_RE.test(s);

type Params = { params: Promise<{ id: string }> };

// PATCH /api/reminders/[id]  — case à cocher (done) ou modification (note/due_at).
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ ok: false, error: "id invalide" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const parsed = updateReminderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation échouée", details: zodDetails(parsed.error) },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.from("reminders").update(parsed.data).eq("id", id).select().maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: "Rappel introuvable" }, { status: 404 });

  const reminder = data as Reminder;
  await logActivity({ agent: "crm", action: "reminder.update", prospectId: reminder.prospect_id, meta: { reminder_id: reminder.id } });

  return NextResponse.json({ ok: true, data: reminder });
}

// DELETE /api/reminders/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ ok: false, error: "id invalide" }, { status: 400 });

  const supabase = createServerClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("reminders")
    .select("id, prospect_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ ok: false, error: "Rappel introuvable" }, { status: 404 });

  const { error } = await supabase.from("reminders").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const removed = existing as { id: string; prospect_id: string };
  await logActivity({ agent: "crm", action: "reminder.delete", prospectId: removed.prospect_id, meta: { reminder_id: removed.id } });

  return NextResponse.json({ ok: true, data: { id } });
}
