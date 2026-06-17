import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase côté NAVIGATEUR (anon key).
 *
 * N'utilise QUE les variables NEXT_PUBLIC_* — jamais la service-role key.
 * Tant qu'aucune policy RLS n'est ajoutée (Phase 1), ce client ne peut rien lire :
 * l'accès aux données passe exclusivement par le client serveur (service-role).
 *
 * Factory paresseuse : la validation des variables d'env ne se déclenche qu'à
 * l'appel, pas au chargement du module → ne casse pas le build avec un .env vide.
 */
export function createBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Config Supabase (navigateur) manquante : définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local."
    );
  }

  return createClient(url, anonKey);
}
