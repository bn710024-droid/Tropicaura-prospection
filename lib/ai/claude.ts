import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { logActivity } from "@/lib/activity";

const MODEL = "claude-sonnet-4-6";

/** Levée quand ANTHROPIC_API_KEY est absente → les routes IA renvoient 503. */
export class MissingApiKeyError extends Error {
  constructor(message = "ANTHROPIC_API_KEY not configured") {
    super(message);
    this.name = "MissingApiKeyError";
  }
}

export interface CallClaudeArgs {
  system: string;
  user: string;
  maxTokens?: number;
  /** Schéma JSON → structured outputs (output_config.format). JSON garanti conforme. */
  jsonSchema?: Record<string, unknown>;
  /** Pour tracer l'appel dans activity_log. */
  prospectId?: string | null;
}

export interface CallClaudeResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Lecteur JSON robuste : nettoie d'éventuels fences ```json``` avant JSON.parse.
 * Avec structured outputs la sortie est déjà du JSON valide ; ce helper sert de
 * filet (et de lecteur de la réponse texte).
 */
export function parseJSON<T>(raw: string): T {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return JSON.parse(s) as T;
}

export async function callClaude(args: CallClaudeArgs): Promise<CallClaudeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();

  const { system, user, maxTokens = 1024, jsonSchema, prospectId } = args;

  // maxRetries: 0 → on gère nous-mêmes le retry unique (429/500/529).
  const client = new Anthropic({ apiKey, maxRetries: 0 });

  // InternalServerError couvre tous les 5xx (500 et 529/overloaded).
  const isRetryable = (e: unknown) =>
    e instanceof Anthropic.RateLimitError ||
    e instanceof Anthropic.InternalServerError;

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
        ...(jsonSchema
          ? { output_config: { format: { type: "json_schema", schema: jsonSchema } } }
          : {}),
      });

      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");

      await logActivity({
        agent: "claude",
        action: "api_call",
        prospectId: prospectId ?? null,
        meta: {
          model: MODEL,
          input_tokens: res.usage.input_tokens,
          output_tokens: res.usage.output_tokens,
        },
      });

      return {
        text,
        inputTokens: res.usage.input_tokens,
        outputTokens: res.usage.output_tokens,
      };
    } catch (err) {
      lastErr = err;
      if (isRetryable(err) && attempt === 0) continue;
      throw err;
    }
  }
  throw lastErr;
}
