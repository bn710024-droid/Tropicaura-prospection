import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createCampaignSchema, zodDetails } from "@/lib/schemas";
import { logActivity } from "@/lib/activity";
import { type Campaign } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/campaigns
export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data: data as Campaign[] });
}

// POST /api/campaigns
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation échouée", details: zodDetails(parsed.error) },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.from("campaigns").insert(parsed.data).select().single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const campaign = data as Campaign;
  await logActivity({ agent: "crm", action: "campaign.create", meta: { campaign_id: campaign.id, name: campaign.name } });

  return NextResponse.json({ ok: true, data: campaign }, { status: 201 });
}
