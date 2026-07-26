import { createServerClient } from "@/lib/supabase/server";
import type { Campaign, Prospect } from "@/types";
import { Button } from "@/components/ui/button";
import CampaignFormDialog from "@/components/CampaignFormDialog";

export const dynamic = "force-dynamic";

const STAGE_RANK: Record<string, number> = {
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

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function CampagnesPage() {
  const supabase = createServerClient();
  const [{ data: campaignsData }, { data: prospectsData }] = await Promise.all([
    supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
    supabase.from("prospects").select("*").not("campaign_id", "is", null),
  ]);

  const campaigns = (campaignsData ?? []) as Campaign[];
  const prospects = (prospectsData ?? []) as Prospect[];

  const byCampaign = new Map<string, Prospect[]>();
  for (const p of prospects) {
    if (!p.campaign_id) continue;
    const list = byCampaign.get(p.campaign_id) ?? [];
    list.push(p);
    byCampaign.set(p.campaign_id, list);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Campagnes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organisez vos poussées de prospection par produit et par marché.</p>
        </div>
        <CampaignFormDialog trigger={<Button>+ Nouvelle campagne</Button>} />
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Aucune campagne pour l&apos;instant.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {campaigns.map((camp) => {
            const list = byCampaign.get(camp.id) ?? [];
            const found = list.length;
            const contacted = list.filter((p) => STAGE_RANK[p.status] >= STAGE_RANK.first_contact_sent).length;
            const replied = list.filter((p) => STAGE_RANK[p.status] >= STAGE_RANK.response_received).length;
            const interested = list.filter((p) => STAGE_RANK[p.status] >= STAGE_RANK.interested).length;
            const clients = list.filter((p) => p.status === "active_client").length;
            const responseRate = contacted > 0 ? Math.round((replied / contacted) * 100) : 0;
            const target = camp.target_company_count ?? 0;

            return (
              <div key={camp.id} className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/20">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{camp.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(camp.start_date)} → {fmtDate(camp.end_date)}
                    </p>
                  </div>
                  {responseRate > 0 && (
                    <span className="rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                      {responseRate}% de réponse
                    </span>
                  )}
                </div>

                {camp.objective_text && <p className="mt-2 text-sm text-muted-foreground">{camp.objective_text}</p>}

                {(camp.target_products.length > 0 || camp.target_countries.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {camp.target_products.map((p) => (
                      <span key={p} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {p}
                      </span>
                    ))}
                    {camp.target_countries.map((c) => (
                      <span key={c} className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {target > 0 && (
                  <div className="mt-4">
                    <ProgressBar value={found} max={target} label={`Entreprises trouvées / objectif ${target}`} />
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                  <ProgressBar value={found} max={Math.max(found, 1)} label="Trouvées" />
                  <ProgressBar value={contacted} max={Math.max(found, 1)} label="Contactées" />
                  <ProgressBar value={replied} max={Math.max(found, 1)} label="Réponses" />
                  <ProgressBar value={interested} max={Math.max(found, 1)} label="Intéressés" />
                  <ProgressBar value={clients} max={Math.max(found, 1)} label="Clients" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
