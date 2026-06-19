import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { Email, Prospect } from "@/types";
import { countryFlag, countryName, scoreColor, statusBadgeClass, statusLabel } from "@/lib/ui";
import { SCOUT, PLUME } from "@/lib/agents";
import ProspectActions from "@/components/ProspectActions";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Tag({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span className={`rounded-full border border-white/5 bg-zinc-800 px-2.5 py-1 text-xs font-medium ${tone}`}>
      {children}
    </span>
  );
}

function CriterionBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-zinc-500">{label}</span>
        <span className="font-medium text-zinc-300">
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-orange-500" style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}

function recommendation(score: number | null) {
  if (score === null)
    return { tone: "border-white/10 bg-white/5 text-zinc-400", text: "Pas encore qualifié — lancez SCOUT." };
  if (score >= 8)
    return { tone: "border-green-500/20 bg-green-500/10 text-green-400", text: "✅ Prospect prometteur — Rédiger un email personnalisé" };
  if (score >= 5)
    return { tone: "border-orange-500/20 bg-orange-500/10 text-orange-400", text: "⚠️ Potentiel moyen — À évaluer manuellement" };
  return { tone: "border-red-500/20 bg-red-500/10 text-red-400", text: "❌ Hors cible — Ne pas contacter" };
}

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = createServerClient();
  const { data } = await supabase.from("prospects").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const prospect = data as Prospect;

  const { data: emailsData } = await supabase
    .from("emails")
    .select("*")
    .eq("prospect_id", id)
    .order("created_at", { ascending: false });
  const emails = (emailsData ?? []) as Email[];

  const q = prospect.score_detail;
  const sc = scoreColor(prospect.score);
  const reco = recommendation(prospect.score);

  // Anneau de score SVG animé
  const R = 36;
  const circ = 2 * Math.PI * R;
  const target = circ * (1 - (prospect.score ?? 0) / 10);
  const ringVars = { "--ring-circ": `${circ}`, "--ring-target": `${target}` } as unknown as React.CSSProperties;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/prospects" className="text-sm text-zinc-500 transition-colors hover:text-orange-400">
        ← Pipeline
      </Link>

      {/* En-tête */}
      <header className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-zinc-900 p-6 shadow-lg shadow-black/20">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {countryFlag(prospect.country)} {prospect.company_name}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {countryName(prospect.country) || prospect.country || "—"}
            {prospect.segment ? ` · ${prospect.segment}` : ""}
          </p>
          {prospect.website && (
            <a
              href={prospect.website.startsWith("http") ? prospect.website : `https://${prospect.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-orange-400 hover:underline"
            >
              {prospect.website}
            </a>
          )}
          <div className="mt-2.5">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeClass(prospect.status)}`}>
              {statusLabel(prospect.status)}
            </span>
          </div>
        </div>

        {/* Anneau SVG */}
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 88 88" className="h-24 w-24 -rotate-90">
            <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
            <circle
              cx="44"
              cy="44"
              r={R}
              fill="none"
              stroke={sc.stroke}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={target}
              style={{ animation: "ring-fill 1.1s ease-out forwards", ...ringVars }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${sc.text}`}>{prospect.score ?? "—"}</span>
            <span className="text-[10px] text-zinc-600">/ 10</span>
          </div>
        </div>
      </header>

      {/* Analyse SCOUT */}
      <section className="mt-6 rounded-2xl border border-white/[0.06] bg-zinc-900 p-6 shadow-lg shadow-black/20">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-white">
          <span className="text-xl">{SCOUT.emoji}</span> Analyse de {SCOUT.name}
        </h2>
        {q ? (
          <div className="space-y-5">
            <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${reco.tone}`}>
              {reco.text}
              {q.reasoning && <p className="mt-1 text-xs font-normal opacity-80">{q.reasoning}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <CriterionBar label="Importateur fruits" value={q.detail.importer} max={3} />
              <CriterionBar label="Marché Europe" value={q.detail.europe} max={2} />
              <CriterionBar label="Taille / présence" value={q.detail.size} max={2} />
              <CriterionBar label="Mangue / tropicaux" value={q.detail.mango_tropical} max={3} />
            </div>

            {q.imported_categories.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-zinc-500">Catégories importées</p>
                <div className="flex flex-wrap gap-1.5">
                  {q.imported_categories.map((c) => (
                    <Tag key={c} tone="text-blue-400">
                      {c}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            {q.main_products_detected.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-zinc-500">Produits détectés</p>
                <div className="flex flex-wrap gap-1.5">
                  {q.main_products_detected.map((c) => (
                    <Tag key={c} tone="text-orange-400">
                      {c}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            {q.markets_detected.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-zinc-500">Segments de marché</p>
                <div className="flex flex-wrap gap-1.5">
                  {q.markets_detected.map((c) => (
                    <Tag key={c} tone="text-green-400">
                      {c}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-600">Pas encore d&apos;analyse. Lancez la qualification ci-dessous.</p>
        )}
      </section>

      {/* Emails */}
      <section className="mt-6 rounded-2xl border border-white/[0.06] bg-zinc-900 p-6 shadow-lg shadow-black/20">
        <h2 className="mb-4 font-semibold text-white">Emails</h2>
        {emails.length === 0 ? (
          <p className="text-sm text-zinc-600">Aucun email rédigé pour ce prospect.</p>
        ) : (
          <ul className="space-y-3">
            {emails.map((e) => (
              <li key={e.id} className="flex gap-3 rounded-xl border border-white/5 bg-zinc-950 p-3">
                <span className="text-xl" title={PLUME.name}>
                  {PLUME.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-zinc-100">{e.subject ?? "(sans objet)"}</p>
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                      {e.status ?? "draft"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{e.body}</p>
                  <p className="mt-1 text-[11px] text-zinc-600">{new Date(e.created_at).toLocaleString("fr-FR")}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Actions */}
      <section className="mt-6 rounded-2xl border border-white/[0.06] bg-zinc-900 p-6 shadow-lg shadow-black/20">
        <h2 className="mb-4 font-semibold text-white">Actions</h2>
        <ProspectActions prospect={prospect} />
      </section>
    </main>
  );
}
