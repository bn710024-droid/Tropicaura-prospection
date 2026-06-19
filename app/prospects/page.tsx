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
      className={`rounded-2xl border border-white/5 bg-[#141414] p-5 transition-all duration-200 hover:-translate-y-0.5 ${glow}`}
    >
      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{label}</p>
      <p className={`mt-2 text-4xl font-bold tracking-tight ${valueClass}`}>{value}</p>
    </div>
  );
}

export default async function ProspectsPage() {
  const supabase = createServerClient();
  const [prospectsRes, emailsRes] = await Promise.all([
    supabase
      .from("prospects")
      .select("*")
      .order("score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("emails").select("*", { count: "exact", head: true }).eq("direction", "outbound"),
  ]);

  const prospects = (prospectsRes.data ?? []) as Prospect[];
  const total = prospects.length;
  const qualified = prospects.filter((p) => p.score !== null).length;
  const hot = prospects.filter((p) => p.status === "hot").length;
  const emails = emailsRes.count ?? 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header minimal */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold tracking-tight">
            <span className="text-zinc-50">Tropic</span>
            <span className="text-orange-500">—</span>
            <span className="text-zinc-50">Aura</span>
          </p>
          <p className="mt-0.5 text-sm text-zinc-500">Pipeline export assisté par IA</p>
        </div>
        <ImportButton />
      </header>

      {/* Équipe IA */}
      <section className="mb-6">
        <AgentTeam />
      </section>

      {/* KPI */}
      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Prospects" value={total} valueClass="text-zinc-50" glow="hover:border-white/10" />
        <Kpi
          label="Qualifiés"
          value={qualified}
          valueClass="text-green-400"
          glow="hover:border-green-500/30 hover:shadow-[0_0_28px_-10px_rgba(34,197,94,0.6)]"
        />
        <Kpi
          label="Hot leads"
          value={hot}
          valueClass="text-orange-500"
          glow="hover:border-orange-500/30 hover:shadow-[0_0_28px_-10px_rgba(249,115,22,0.6)]"
        />
        <Kpi
          label="Emails rédigés"
          value={emails}
          valueClass="text-blue-400"
          glow="hover:border-blue-500/30 hover:shadow-[0_0_28px_-10px_rgba(59,130,246,0.6)]"
        />
      </section>

      {/* Pipeline */}
      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-zinc-500 uppercase">Pipeline</h2>
        <PipelineBoard prospects={prospects} />
      </section>
    </main>
  );
}
