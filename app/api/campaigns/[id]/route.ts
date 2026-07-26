import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { updateCampaignSchema, zodDetails } from "@/lib/schemas";
import { logActivity } from "@/lib/activity";
import { type Campaign } from "@/types";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID_RE.test(s);

type Params = { params: Promise<{ id: string }> };

// PATCH /api/campaigns/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ ok: false, error: "id invalide" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const parsed = updateCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation échouée", details: zodDetails(parsed.error) },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.from("campaigns").update(parsed.data).eq("id", id).select().maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: "Campagne introuvable" }, { status: 404 });

  await logActivity({ agent: "crm", action: "campaign.update", meta: { campaign_id: id } });

  return NextResponse.json({ ok: true, data: data as Campaign });
}

// DELETE /api/campaigns/[id]  (prospects.campaign_id → set null via FK on delete set null)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ ok: false, error: "id invalide" }, { status: 400 });

  const supabase = createServerClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ ok: false, error: "Campagne introuvable" }, { status: 404 });

  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  await logActivity({ agent: "crm", action: "campaign.delete", meta: { campaign_id: id, name: (existing as { name: string }).name } });

  return NextResponse.json({ ok: true, data: { id } });
}
