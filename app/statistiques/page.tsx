import { createServerClient } from "@/lib/supabase/server";
import type { Prospect, ProspectStatus } from "@/types";
import { PROSPECT_STATUSES } from "@/types";
import { statusColorHex, statusLabel } from "@/lib/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TopBarChart from "@/components/statistiques/TopBarChart";
import StatusDonut from "@/components/statistiques/StatusDonut";
import MonthlyGrowthChart from "@/components/dashboard/MonthlyGrowthChart";

export const dynamic = "force-dynamic";

const STATUS_RANK: Record<ProspectStatus, number> = {
  new: 1,
  first_contact_sent: 2,
  response_received: 3,
  interested: 4,
  offer_sent: 5,
  negotiation: 6,
  first_order: 7,
  active_client: 8,
  refused: 0,
};

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

export default async function StatistiquesPage() {
  const supabase = createServerClient();
  const { data } = await supabase.from("prospects").select("*").limit(2000);
  const prospects = (data ?? []) as Prospect[];

  const total = prospects.length;
  const countries = new Set(prospects.map((p) => p.country).filter(Boolean)).size;
  const contacted = prospects.filter((p) => STATUS_RANK[p.status] >= STATUS_RANK.first_contact_sent).length;
  const responded = prospects.filter((p) => STATUS_RANK[p.status] >= STATUS_RANK.response_received).length;
  const clients = prospects.filter((p) => p.status === "active_client").length;
  const responseRate = contacted > 0 ? Math.round((responded / contacted) * 100) : 0;
  const conversionRate = total > 0 ? Math.round((clients / total) * 100) : 0;

  const byCountry = new Map<string, number>();
  for (const p of prospects) {
    if (!p.country) continue;
    byCountry.set(p.country, (byCountry.get(p.country) ?? 0) + 1);
  }
  const topCountries = Array.from(byCountry.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const byProduct = new Map<string, number>();
  for (const p of prospects) {
    for (const prod of p.products) byProduct.set(prod, (byProduct.get(prod) ?? 0) + 1);
  }
  const topProducts = Array.from(byProduct.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const statusData = PROSPECT_STATUSES.map((s) => ({
    label: statusLabel(s),
    count: prospects.filter((p) => p.status === s).length,
    color: statusColorHex(s),
  }));

  const now = new Date();
  const monthlyGrowth = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = prospects.filter((p) => p.created_at.startsWith(monthKey)).length;
    return { month: monthKey, label: MONTH_LABELS[d.getMonth()], count };
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Statistiques</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tableau de bord analytique en temps réel.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Total prospects" value={total} />
        <Kpi label="Pays prospectés" value={countries} />
        <Kpi label="Taux de réponse" value={`${responseRate}%`} />
        <Kpi label="Taux de conversion" value={`${conversionRate}%`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDonut data={statusData} />
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Évolution mensuelle (12 mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyGrowthChart data={monthlyGrowth} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Top 10 pays</CardTitle>
          </CardHeader>
          <CardContent>
            <TopBarChart data={topCountries} />
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Top 10 produits</CardTitle>
          </CardHeader>
          <CardContent>
            <TopBarChart data={topProducts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
