import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase côté SERVEUR (service-role key).
 *
 * - `import "server-only"` fait ÉCHOUER le build si ce module est importé depuis
 *   un composant client → garde-fou contre toute fuite de la service-role key.
 * - La service-role key bypass RLS : usage API routes / code serveur UNIQUEMENT.
 *
 * Factory paresseuse : la validation des variables d'env ne se déclenche qu'à
 * l'appel (au runtime d'une requête), pas au chargement du module → le build
 * passe même avec un .env.local vide.
 */
export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Config Supabase (serveur) manquante : définissez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
