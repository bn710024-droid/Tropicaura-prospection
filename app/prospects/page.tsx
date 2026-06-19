import { createServerClient } from "@/lib/supabase/server";
import { type Prospect } from "@/types";
import AgentTeam from "@/components/AgentTeam";
import ImportButton from "@/components/ImportButton";
import PipelineBoard from "@/components/PipelineBoard";

export const dynamic = "force-dynamic";

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent}`}>{value}</p>
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
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-2xl font-extrabold tracking-tight">
              <span className="text-orange-500">Tropic</span>
              <span className="text-[#1A1A1A]">-Aura</span>
            </p>
            <h1 className="text-sm text-gray-500">Tropicaura Prospection — pipeline export assisté par IA</h1>
          </div>
        </div>
      </header>

      <div className="mb-6">
        <AgentTeam />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi label="Prospects" value={total} accent="text-[#1A1A1A]" />
        <Kpi label="Qualifiés" value={qualified} accent="text-green-600" />
        <Kpi label="Hot leads" value={hot} accent="text-orange-500" />
        <Kpi label="Emails rédigés" value={emails} accent="text-blue-600" />
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          Importer des prospects
        </h2>
        <ImportButton />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">Pipeline</h2>
        <PipelineBoard prospects={prospects} />
      </section>
    </main>
  );
}
