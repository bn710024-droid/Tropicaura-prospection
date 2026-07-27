import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import type { Prospect } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export default async function RapportsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const now = new Date();
  const selected = month && /^\d{4}-\d{2}$/.test(month) ? month : monthKey(now);
  const [year, mo] = selected.split("-").map(Number);
  const rangeStart = new Date(year, mo - 1, 1);
  const rangeEnd = new Date(year, mo, 1);

  const supabase = createServerClient();
  const [{ data: prospectsInMonth }, { data: statusChanges }, { data: remindersInMonth }] = await Promise.all([
    supabase
      .from("prospects")
      .select("*")
      .gte("created_at", rangeStart.toISOString())
      .lt("created_at", rangeEnd.toISOString()),
    supabase
      .from("activity_log")
      .select("meta")
      .eq("action", "prospect.status_change")
      .gte("created_at", rangeStart.toISOString())
      .lt("created_at", rangeEnd.toISOString()),
    supabase
      .from("reminders")
      .select("id, done")
      .eq("done", true)
      .gte("due_at", rangeStart.toISOString())
      .lt("due_at", rangeEnd.toISOString()),
  ]);

  const companiesAdded = (prospectsInMonth ?? []) as Prospect[];
  const countriesTouched = new Set(companiesAdded.map((p) => p.country).filter(Boolean)).size;

  const changes = (statusChanges ?? []) as { meta: { to?: string } | null }[];
  const countTo = (target: string) => changes.filter((c) => c.meta?.to === target).length;
  const responsesReceived = countTo("response_received");
  const interested = countTo("interested");
  const newClients = countTo("active_client");
  const remindersCompleted = (remindersInMonth ?? []).length;

  // 12 derniers mois pour le sélecteur.
  const options = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { key: monthKey(d), label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Rapports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Résumé mensuel de votre activité de prospection.</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <Link
            key={o.key}
            href={`/rapports?month=${o.key}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              o.key === selected
                ? "border-primary/30 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </Link>
        ))}
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            {MONTH_NAMES[mo - 1]} {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Entreprises ajoutées" value={companiesAdded.length} />
            <Stat label="Pays touchés" value={countriesTouched} />
            <Stat label="Réponses obtenues" value={responsesReceived} />
            <Stat label="Prospects intéressés" value={interested} />
            <Stat label="Nouveaux clients" value={newClients} />
            <Stat label="Relances effectuées" value={remindersCompleted} />
          </div>
        </CardContent>
      </Card>

      {companiesAdded.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Entreprises ajoutées ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {companiesAdded.map((p) => (
                <li key={p.id} className="flex justify-between text-muted-foreground">
                  <Link href={`/prospects/${p.id}`} className="text-foreground hover:text-primary hover:underline">
                    {p.company_name}
                  </Link>
                  <span>{p.country ?? "—"}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        « Relances effectuées » compte les rappels marqués terminés dont l&apos;échéance tombait ce mois-ci — une
        approximation, faute d&apos;horodatage exact de complétion.
      </p>
    </div>
  );
}
