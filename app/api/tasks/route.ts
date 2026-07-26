import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createTaskSchema, zodDetails } from "@/lib/schemas";
import { logActivity } from "@/lib/activity";
import { type Task } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/tasks  → toutes les tâches, jointure entreprise (page /taches).
export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, prospects(id, company_name)")
    .order("status", { ascending: true })
    .order("priority", { ascending: false })
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation échouée", details: zodDetails(parsed.error) },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.from("tasks").insert(parsed.data).select().single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const task = data as Task;
  await logActivity({ agent: "crm", action: "task.create", prospectId: task.prospect_id, meta: { task_id: task.id, title: task.title } });

  return NextResponse.json({ ok: true, data: task }, { status: 201 });
}
