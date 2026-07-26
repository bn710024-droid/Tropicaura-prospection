import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { type Prospect } from "@/types";
import ImportButton from "@/components/ImportButton";
import ProspectFormDialog from "@/components/ProspectFormDialog";
import ProspectsFilterBar from "@/components/ProspectsFilterBar";
import ProspectsTable from "@/components/ProspectsTable";
import PipelineBoard from "@/components/PipelineBoard";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface SearchParams {
  country?: string;
  product?: string;
  status?: string;
  q?: string;
  sort?: string;
  view?: string;
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

export default async function ProspectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const supabase = createServerClient();

  const { data: allData } = await supabase.from("prospects").select("*").order("created_at", { ascending: false }).limit(1000);
  const all = (allData ?? []) as Prospect[];

  const countries = Array.from(new Set(all.map((p) => p.country).filter((c): c is string => !!c))).sort();
  const products = Array.from(new Set(all.flatMap((p) => p.products))).sort();

  let filtered = all;
  if (params.country) filtered = filtered.filter((p) => p.country === params.country);
  if (params.product) filtered = filtered.filter((p) => p.products.includes(params.product!));
  if (params.status) filtered = filtered.filter((p) => p.status === params.status);
  if (params.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter((p) => p.company_name.toLowerCase().includes(q));
  }

  const sort = params.sort ?? "recent";
  filtered = [...filtered].sort((a, b) => {
    if (sort === "oldest") return a.created_at.localeCompare(b.created_at);
    if (sort === "reminder") {
      if (!a.next_reminder_at) return 1;
      if (!b.next_reminder_at) return -1;
      return a.next_reminder_at.localeCompare(b.next_reminder_at);
    }
    return b.created_at.localeCompare(a.created_at);
  });

  const view = params.view === "pipeline" ? "pipeline" : "list";
  const viewHref = (v: string) => {
    const entries = Object.entries(params).filter((entry): entry is [string, string] => !!entry[1]);
    const qp = new URLSearchParams(entries);
    qp.set("view", v);
    return `/prospects?${qp.toString()}`;
  };

  const interested = all.filter((p) => p.status === "interested").length;
  const negotiation = all.filter((p) => p.status === "negotiation").length;
  const activeClients = all.filter((p) => p.status === "active_client").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Prospects</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gérez et suivez tous vos prospects export.</p>
        </div>
        <ProspectFormDialog trigger={<Button>+ Nouveau prospect</Button>} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Total prospects" value={all.length} />
        <Kpi label="Intéressés" value={interested} />
        <Kpi label="En négociation" value={negotiation} />
        <Kpi label="Clients actifs" value={activeClients} />
      </div>

      <ImportButton />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ProspectsFilterBar countries={countries} products={products} />
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          <Link
            href={viewHref("list")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === "list" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Liste
          </Link>
          <Link
            href={viewHref("pipeline")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === "pipeline" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pipeline
          </Link>
        </div>
      </div>

      {view === "list" ? <ProspectsTable prospects={filtered} /> : <PipelineBoard prospects={filtered} />}
    </div>
  );
}
