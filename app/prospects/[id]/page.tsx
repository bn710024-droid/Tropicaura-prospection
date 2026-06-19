import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { Email, Prospect } from "@/types";
import { countryFlag, scoreColor, statusBadgeClass, statusLabel } from "@/lib/ui";
import { SCOUT, PLUME } from "@/lib/agents";
import ProspectActions from "@/components/ProspectActions";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
      {children}
    </span>
  );
}

function CriterionBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-[#1A1A1A]">
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-orange-500" style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}

function recommendation(score: number | null) {
  if (score === null)
    return { tone: "bg-gray-50 text-gray-600 border-gray-200", text: "Pas encore qualifié — lancez SCOUT." };
  if (score >= 8)
    return { tone: "bg-green-50 text-green-700 border-green-200", text: "✅ Prospect prometteur — Rédiger un email personnalisé" };
  if (score >= 5)
    return { tone: "bg-orange-50 text-orange-700 border-orange-200", text: "⚠️ Potentiel moyen — À évaluer manuellement" };
  return { tone: "bg-red-50 text-red-700 border-red-200", text: "❌ Hors cible — Ne pas contacter" };
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Link href="/prospects" className="text-sm text-gray-500 hover:text-orange-600">
        ← Retour au pipeline
      </Link>

      {/* En-tête */}
      <header className="mt-3 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            {countryFlag(prospect.country)} {prospect.company_name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {prospect.country ?? "—"}
            {prospect.segment ? ` · ${prospect.segment}` : ""}
          </p>
          {prospect.website && (
            <a
              href={prospect.website.startsWith("http") ? prospect.website : `https://${prospect.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-blue-600 hover:underline"
            >
              {prospect.website}
            </a>
          )}
          <div className="mt-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeClass(prospect.status)}`}>
              {statusLabel(prospect.status)}
            </span>
          </div>
        </div>
        <div className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full ring-4 ${sc.ring}`}>
          <span className={`text-2xl font-bold ${sc.text}`}>{prospect.score ?? "—"}</span>
          <span className="text-[10px] text-gray-400">/ 10</span>
        </div>
      </header>

      {/* Analyse de SCOUT */}
      <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-[#1A1A1A]">
          <span className="text-xl">{SCOUT.emoji}</span> Analyse de {SCOUT.name}
        </h2>
        {q ? (
          <div className="space-y-4">
            <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${reco.tone}`}>
              {reco.text}
              {q.reasoning && <p className="mt-1 text-xs font-normal opacity-80">{q.reasoning}</p>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <CriterionBar label="Importateur fruits" value={q.detail.importer} max={3} />
              <CriterionBar label="Marché Europe" value={q.detail.europe} max={2} />
              <CriterionBar label="Taille / présence" value={q.detail.size} max={2} />
              <CriterionBar label="Mangue / tropicaux" value={q.detail.mango_tropical} max={3} />
            </div>

            {q.imported_categories.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">Catégories importées</p>
                <div className="flex flex-wrap gap-1.5">{q.imported_categories.map((c) => <Tag key={c}>{c}</Tag>)}</div>
              </div>
            )}
            {q.main_products_detected.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">Produits détectés</p>
                <div className="flex flex-wrap gap-1.5">{q.main_products_detected.map((c) => <Tag key={c}>{c}</Tag>)}</div>
              </div>
            )}
            {q.markets_detected.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">Segments de marché</p>
                <div className="flex flex-wrap gap-1.5">{q.markets_detected.map((c) => <Tag key={c}>{c}</Tag>)}</div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Pas encore d&apos;analyse. Lancez la qualification ci-dessous.</p>
        )}
      </section>

      {/* Emails */}
      <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold text-[#1A1A1A]">Emails</h2>
        {emails.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun email rédigé pour ce prospect.</p>
        ) : (
          <ul className="space-y-3">
            {emails.map((e) => (
              <li key={e.id} className="flex gap-3 rounded-xl border border-gray-100 p-3">
                <span className="text-xl" title={PLUME.name}>
                  {PLUME.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-[#1A1A1A]">{e.subject ?? "(sans objet)"}</p>
                    <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                      {e.status ?? "draft"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">{e.body}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{new Date(e.created_at).toLocaleString("fr-FR")}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Actions */}
      <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold text-[#1A1A1A]">Actions</h2>
        <ProspectActions prospect={prospect} />
      </section>
    </main>
  );
}
