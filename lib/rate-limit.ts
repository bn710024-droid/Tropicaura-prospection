// Limiteur de débit en mémoire, fenêtre glissante par IP.
// Limite : réinitialisé à chaque cold start / redéploiement, et non partagé entre
// instances si l'app scale horizontalement (pas de Redis configuré). Suffisant pour
// dissuader le scraping/spam basique sur un outil interne à faible trafic ; pas une
// garantie distribuée. Documenté ici plutôt que présenté comme plus robuste qu'il ne l'est.
const buckets = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

// Purge périodique pour éviter une fuite mémoire sur les IP qui ne reviennent jamais.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  maxRequests: number = MAX_REQUESTS
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
