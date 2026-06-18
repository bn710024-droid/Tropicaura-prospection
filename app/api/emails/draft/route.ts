import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { draftEmail } from "@/lib/ai/draft";
import { MissingApiKeyError } from "@/lib/ai/claude";
import { logActivity } from "@/lib/activity";
import { zodDetails } from "@/lib/schemas";
import type { Prospect } from "@/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ prospect_id: z.string().min(1) });

// POST /api/emails/draft  { prospect_id }
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation échouée", details: zodDetails(parsed.error) },
      { status: 400 }
    );
  }
  const prospectId = parsed.data.prospect_id;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", prospectId)
    .maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: "Prospect introuvable" }, { status: 404 });

  const prospect = data as Prospect;
  if (prospect.status !== "qualified" || !prospect.score_detail) {
    return NextResponse.json(
      { ok: false, error: "Prospect must be qualified first" },
      { status: 400 }
    );
  }

  try {
    const { result, inputTokens, outputTokens } = await draftEmail(prospect);

    const { data: email, error: insErr } = await supabase
      .from("emails")
      .insert({
        prospect_id: prospect.id,
        direction: "outbound",
        status: "draft",
        subject: result.subject,
        body: result.body,
      })
      .select()
      .single();
    if (insErr) return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });

    await logActivity({
      agent: "redaction",
      action: "draft",
      prospectId: prospect.id,
      meta: { prospect_id: prospect.id, tokens_used: inputTokens + outputTokens },
    });

    return NextResponse.json({ ok: true, data: email }, { status: 201 });
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
