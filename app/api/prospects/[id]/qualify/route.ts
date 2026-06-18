import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { qualifyProspect, fetchWebsiteText } from "@/lib/ai/qualify";
import { MissingApiKeyError } from "@/lib/ai/claude";
import { logActivity } from "@/lib/activity";
import type { Prospect } from "@/types";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/prospects/[id]/qualify?force=true
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ ok: false, error: "id invalide" }, { status: 400 });
  }
  const force = req.nextUrl.searchParams.get("force") === "true";

  const supabase = createServerClient();
  const { data, error } = await supabase.from("prospects").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: "Prospect introuvable" }, { status: 404 });

  const prospect = data as Prospect;
  if (prospect.score !== null && !force) {
    return NextResponse.json(
      { ok: false, error: "Already qualified, use ?force=true to re-qualify" },
      { status: 409 }
    );
  }

  // Récupération du texte du site (URL du prospect uniquement). Échec → on continue.
  let websiteText: string | null = null;
  let websiteUnreachable = false;
  if (prospect.website) {
    try {
      websiteText = await fetchWebsiteText(prospect.website);
    } catch {
      websiteUnreachable = true;
    }
  } else {
    websiteUnreachable = true;
  }

  try {
    const { result, inputTokens, outputTokens } = await qualifyProspect({
      companyName: prospect.company_name,
      websiteText,
      country: prospect.country,
      segment: prospect.segment,
      prospectId: prospect.id,
    });

    const { data: updated, error: updErr } = await supabase
      .from("prospects")
      .update({
        score: result.score,
        score_detail: result,
        status: "qualified",
        qualified_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (updErr) return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });

    await logActivity({
      agent: "qualification",
      action: "qualify",
      prospectId: id,
      meta: {
        score: result.score,
        website_unreachable: websiteUnreachable,
        tokens_used: inputTokens + outputTokens,
      },
    });

    return NextResponse.json({ ok: true, data: updated as Prospect });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json(
        { ok: false, error: "ANTHROPIC_API_KEY not configured" },
        { status: 503 }
      );
    }
    const message = err instanceof Error ? err.message : "Erreur IA";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
