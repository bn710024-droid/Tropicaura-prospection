import "server-only";
import { callClaude, parseJSON, type CallClaudeResult } from "@/lib/ai/claude";
import { OFFER } from "@/lib/offer";
import type { DraftResult, Prospect } from "@/types";

const DRAFT_SYSTEM = `You are a B2B export sales specialist for Tropic-Aura B.C., a Senegalese fresh produce exporter.
Write a personalized cold email to the prospect below.
Rules:
- Maximum 150 words
- Write in the prospect's business language (NL/DE → English, FR → French, BE → French or English based on region)
- Include ONE specific detail from the prospect's business (shows you researched them)
- Mention the relevant products from our catalog based on what they import
- Include incoterm (FOB Dakar) and certifications
- Professional tone, no superlatives, no "best in class" language
- End with a clear call to action (request for their requirements or a brief call)

Product selection guidance:
- If the prospect already imports mango (main_products_detected contains "mango") -> offer mango directly.
- If the prospect imports tropical produce but not mango -> angle "diversify your Senegalese sourcing".
- Adapt tone to markets_detected: wholesale -> volume/price; retail -> quality/caliber/presentation; foodservice -> consistency/packaging.

Availability:
- availableNow:true -> "currently available", "ready for immediate shipment".
- availableNow:false + prospectingEnabled:true -> "we are preparing our upcoming campaign", "securing supply for the season".

Return valid JSON only:
{ "subject": "<email subject line>", "body": "<email body>" }`;

const DRAFT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
  },
  required: ["subject", "body"],
};

export async function draftEmail(
  prospect: Prospect
): Promise<{ result: DraftResult } & Pick<CallClaudeResult, "inputTokens" | "outputTokens">> {
  const q = prospect.score_detail; // QualificationResult | null
  const products = OFFER.products.filter((p) => p.prospectingEnabled);

  const offerForPrompt = {
    company: OFFER.company,
    origin: OFFER.origin,
    incoterm: OFFER.incoterm,
    certifications: OFFER.certifications,
    products,
  };

  const user = [
    "PROSPECT:",
    `company_name: ${prospect.company_name}`,
    `country: ${prospect.country ?? "unknown"}`,
    `segment: ${prospect.segment ?? "unknown"}`,
    `website: ${prospect.website ?? "unknown"}`,
    "",
    "QUALIFICATION (from prior analysis):",
    q
      ? JSON.stringify({
          imported_categories: q.imported_categories,
          main_products_detected: q.main_products_detected,
          markets_detected: q.markets_detected,
          reasoning: q.reasoning,
        })
      : "(none)",
    "",
    "OUR OFFER (only prospectable products):",
    JSON.stringify(offerForPrompt),
  ].join("\n");

  const { text, inputTokens, outputTokens } = await callClaude({
    system: DRAFT_SYSTEM,
    user,
    maxTokens: 1024,
    jsonSchema: DRAFT_SCHEMA,
    prospectId: prospect.id,
  });

  return { result: parseJSON<DraftResult>(text), inputTokens, outputTokens };
}
