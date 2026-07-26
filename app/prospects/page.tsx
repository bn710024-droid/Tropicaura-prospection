import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { type Prospect } from "@/types";
import AgentTeam from "@/components/AgentTeam";
import ImportButton from "@/components/ImportButton";
import PipelineBoard from "@/components/PipelineBoard";

export const dynamic = "force-dynamic";

function Kpi({
  label,
  value,
  valueClass,
  glow,
}: {
  label: string;
  value: number;
  valueClass: string;
  glow: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-zinc-900 p-5 shadow-lg shadow-black/20 transition-all duration-200 hover:scale-[1.01] ${glow}`}
    >
      <p className="text-xs font-medium tracking-wider text-zinc-500 uppercase">{label}</p>
      <p className={`mt-2 text-4xl font-bold tracking-tight ${valueClass}`}>{value}</p>
    </div>
  );
}

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country } = await searchParams;
  const supabase = createServerClient();

  let prospectsQuery = supabase
    .from("prospects")
    .select("*")
    .order("score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (country) prospectsQuery = prospectsQuery.eq("country", country);

  const [prospectsRes, emailsRes] = await Promise.all([
    prospectsQuery,
    supabase.from("emails").select("*", { count: "exact", head: true }).eq("direction", "outbound"),
  ]);

  const prospects = (prospectsRes.data ?? []) as Prospect[];
  const total = prospects.length;
  const qualified = prospects.filter((p) => p.score !== null).length;
  const hot = prospects.filter((p) => p.status === "hot").length;
  const emails = emailsRes.count ?? 0;

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">Prospects</h1>
            {country && (
              <Link
                href="/prospects"
                className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400 transition-colors hover:bg-orange-500/20"
              >
                {country}
                <span className="text-orange-400/60">✕</span>
              </Link>
            )}
          </div>
          <p className="shrink-0 text-xs text-zinc-400 sm:text-sm">
            <span className="font-semibold text-green-400">{qualified}</span> qualifiés
            <span className="mx-1.5 text-zinc-700">·</span>
            <span className="font-semibold text-orange-400">{hot}</span> hot
            <span className="mx-1.5 text-zinc-700">·</span>
            <span className="font-semibold text-blue-400">{emails}</span> emails
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Équipe IA */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold tracking-wider text-zinc-500 uppercase">Mon équipe IA</h2>
          <AgentTeam />
        </section>

        {/* KPI */}
        <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi label="Prospects" value={total} valueClass="text-white" glow="hover:border-white/15" />
          <Kpi
            label="Qualifiés"
            value={qualified}
            valueClass="text-green-400"
            glow="hover:border-green-500/30 hover:shadow-green-500/10"
          />
          <Kpi
            label="Hot leads"
            value={hot}
            valueClass="text-orange-400"
            glow="hover:border-orange-500/30 hover:shadow-orange-500/10"
          />
          <Kpi
            label="Emails rédigés"
            value={emails}
            valueClass="text-blue-400"
            glow="hover:border-blue-500/30 hover:shadow-blue-500/10"
          />
        </section>

        {/* Import (masqué quand vide : l'état vide du pipeline propose déjà l'import) */}
        {total > 0 && (
          <section className="mb-8">
            <ImportButton />
          </section>
        )}

        {/* Pipeline */}
        <section id="pipeline">
          <h2 className="mb-4 text-sm font-semibold tracking-wider text-zinc-500 uppercase">Pipeline</h2>
          <PipelineBoard prospects={prospects} />
        </section>
      </main>
    </>
  );
}
