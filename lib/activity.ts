import "server-only";
import { createServerClient } from "@/lib/supabase/server";

export interface ActivityInput {
  agent: string;
  action: string;
  prospectId?: string | null;
  meta?: Record<string, unknown> | null;
}

/**
 * Écrit une ligne dans activity_log (audit de chaque mutation).
 *
 * Best-effort : un échec d'écriture du log ne doit JAMAIS faire échouer la
 * mutation métier qui l'a déclenché → on logge l'erreur en console sans throw.
 */
export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("activity_log").insert({
      agent: input.agent,
      action: input.action,
      prospect_id: input.prospectId ?? null,
      meta: input.meta ?? null,
    });
    if (error) {
      console.error("[activity_log] échec insertion:", error.message);
    }
  } catch (err) {
    console.error("[activity_log] erreur inattendue:", err);
  }
}
