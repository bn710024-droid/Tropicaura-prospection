import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createReminderSchema, zodDetails } from "@/lib/schemas";
import { logActivity } from "@/lib/activity";
import { type Reminder } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/reminders  → tous les rappels, jointure entreprise (page /rappels).
export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("reminders")
    .select("*, prospects(id, company_name)")
    .order("due_at", { ascending: true });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

// POST /api/reminders
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createReminderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation échouée", details: zodDetails(parsed.error) },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.from("reminders").insert(parsed.data).select().single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const reminder = data as Reminder;
  await logActivity({ agent: "crm", action: "reminder.create", prospectId: reminder.prospect_id, meta: { reminder_id: reminder.id } });

  return NextResponse.json({ ok: true, data: reminder }, { status: 201 });
}
