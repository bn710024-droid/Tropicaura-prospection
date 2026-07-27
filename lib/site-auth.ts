// Verrou d'accès simple (un seul mot de passe partagé), pas une authentification
// multi-utilisateur. Objectif : empêcher l'accès public non désiré une fois le CRM
// déployé, sans construire un système de comptes complet. Utilisable en Edge runtime
// (middleware) comme en Node (route API) : uniquement Web Crypto, aucune dépendance.
export const SESSION_COOKIE = "ta_session";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Jeton de session déterministe dérivé du mot de passe — jamais le mot de passe en clair dans le cookie. */
export async function sessionToken(): Promise<string | null> {
  const password = process.env.SITE_PASSWORD;
  if (!password) return null;
  return sha256Hex(`tropicaura-session:${password}`);
}

export async function isValidPassword(candidate: string): Promise<boolean> {
  const password = process.env.SITE_PASSWORD;
  if (!password) return false;
  return candidate === password;
}
