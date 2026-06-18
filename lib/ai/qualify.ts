import "server-only";
import { callClaude, parseJSON, type CallClaudeResult } from "@/lib/ai/claude";
import type { QualificationResult } from "@/types";

const QUALIFY_SYSTEM = `You are a B2B sourcing analyst specializing in fresh fruit and vegetable imports.
Analyze the prospect below and rate them 0-10 based on these criteria:
- Importer of fresh fruits or vegetables: 0-3
- Located in or serving European market (NL, FR, BE, DE priority): 0-2
- Company size and established presence: 0-2
- Connection to mangoes or tropical/exotic produce: 0-3
score MUST equal the sum of the 4 criteria scores.
Also identify:
- imported_categories: general categories they import (e.g. "tropical fruits", "citrus", "exotic vegetables", "stone fruits")
- main_products_detected: specific products visible on their website or profile (e.g. "mango", "pineapple", "avocado")
- markets_detected: market segments they serve (e.g. "wholesale", "retail", "foodservice", "processing")
Return valid JSON only.
Do not use markdown.
Do not use code fences.
Do not add explanations outside the JSON object.
Keep reasoning under 50 words.`;

const QUALIFY_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: { type: "integer" },
    detail: {
      type: "object",
      additionalProperties: false,
      properties: {
        importer: { type: "integer" },
        europe: { type: "integer" },
        size: { type: "integer" },
        mango_tropical: { type: "integer" },
      },
      required: ["importer", "europe", "size", "mango_tropical"],
    },
    imported_categories: { type: "array", items: { type: "string" } },
    main_products_detected: { type: "array", items: { type: "string" } },
    markets_detected: { type: "array", items: { type: "string" } },
    reasoning: { type: "string" },
  },
  required: [
    "score",
    "detail",
    "imported_categories",
    "main_products_detected",
    "markets_detected",
    "reasoning",
  ],
};

export interface QualifyInput {
  companyName: string;
  websiteText: string | null;
  country: string | null;
  segment: string | null;
  prospectId: string;
}

/** Récupère le texte d'un site (HTML strippé, ~8000 car. max, timeout 10s). Site du prospect uniquement. */
export async function fetchWebsiteText(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const target = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const res = await fetch(target, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TropicAuraBot/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return stripHtml(await res.text()).slice(0, 8000);
  } finally {
    clearTimeout(timer);
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clampInt(n: unknown, min: number, max: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 0;
  return Math.max(min, Math.min(max, v));
}

function toStringArray(x: unknown): string[] {
  return Array.isArray(x) ? x.filter((s): s is string => typeof s === "string") : [];
}

/** Validation serveur : borne le detail et RECALCULE score = somme du detail (plus fiable que le score brut). */
function normalize(raw: QualificationResult): QualificationResult {
  const detail = {
    importer: clampInt(raw.detail?.importer, 0, 3),
    europe: clampInt(raw.detail?.europe, 0, 2),
    size: clampInt(raw.detail?.size, 0, 2),
    mango_tropical: clampInt(raw.detail?.mango_tropical, 0, 3),
  };
  return {
    score: detail.importer + detail.europe + detail.size + detail.mango_tropical,
    detail,
    imported_categories: toStringArray(raw.imported_categories),
    main_products_detected: toStringArray(raw.main_products_detected),
    markets_detected: toStringArray(raw.markets_detected),
    reasoning: typeof raw.reasoning === "string" ? raw.reasoning : "",
  };
}

export async function qualifyProspect(
  input: QualifyInput
): Promise<{ result: QualificationResult } & Pick<CallClaudeResult, "inputTokens" | "outputTokens">> {
  const user = [
    `company_name: ${input.companyName}`,
    `country: ${input.country ?? "unknown"}`,
    `segment: ${input.segment ?? "unknown"}`,
    "",
    "website_text (extracted, may be empty):",
    input.websiteText ? input.websiteText : "(no website text available)",
  ].join("\n");

  const { text, inputTokens, outputTokens } = await callClaude({
    system: QUALIFY_SYSTEM,
    user,
    maxTokens: 1024,
    jsonSchema: QUALIFY_SCHEMA,
    prospectId: input.prospectId,
  });

  return { result: normalize(parseJSON<QualificationResult>(text)), inputTokens, outputTokens };
}
