import "server-only";
import { createServerClient } from "@/lib/supabase/server";
import { countryNameToIsoNumeric } from "@/lib/countries";
import type { ActivityLog, Prospect, ProspectStatus, Task } from "@/types";

// Ordre forward-only réel du cycle export (cf. lib/prospect-status.ts).
// Sert à calculer un funnel cumulatif honnête (statut courant >= rang du palier)
// et le statut le plus avancé atteint par pays. "refused" (sortie négative) reste
// hors classement (0) : un pays 100% refusé retombe sur son propre statut, pas un rang fictif.
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

export interface CountryStat {
  country: string;
  isoNumeric: number | null;
  total: number;
  negotiation: number;
  /** Statut le plus avancé atteint par un prospect de ce pays — pilote la couleur sur la carte. */
  topStatus: ProspectStatus;
  lastContact: string | null;
}

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
}

export interface MonthlyPoint {
  month: string; // "2026-01"
  label: string; // "Jan"
  count: number;
}

export interface ActivityItem {
  id: string;
  agent: string | null;
  action: string | null;
  companyName: string | null;
  createdAt: string;
}

export interface TaskItem extends Task {
  companyName: string | null;
}

export interface DashboardData {
  totalProspects: number;
  countriesCount: number;
  negotiationCount: number;
  offerSentCount: number;
  wonCount: number;
  conversionRate: number;
  countryStats: CountryStat[];
  funnel: FunnelStage[];
  monthlyGrowth: MonthlyPoint[];
  recentActivity: ActivityItem[];
  tasksOpen: TaskItem[];
  recentProspects: Prospect[];
}

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createServerClient();

  const [prospectsRes, activityRes, tasksRes] = await Promise.all([
    supabase.from("prospects").select("*").order("created_at", { ascending: false }).limit(1000),
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(15),
    // FK réelle prospects(...) → jointure PostgREST directe (activity_log n'en a pas, cf. plus bas).
    supabase
      .from("tasks")
      .select("*, prospects(company_name)")
      .eq("status", "open")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const prospects = (prospectsRes.data ?? []) as Prospect[];
  const activity = (activityRes.data ?? []) as ActivityLog[];
  const tasksJoined = (tasksRes.data ?? []) as (Task & { prospects: { company_name: string } | null })[];

  // ── KPI globaux ──
  const totalProspects = prospects.length;
  const countriesSet = new Set(prospects.map((p) => p.country).filter((c): c is string => Boolean(c)));
  const negotiationCount = prospects.filter((p) => p.status === "negotiation").length;
  const offerSentCount = prospects.filter((p) => p.status === "offer_sent").length;
  const wonCount = prospects.filter((p) => p.status === "active_client").length;
  const conversionRate = totalProspects > 0 ? wonCount / totalProspects : 0;

  // ── Statistiques par pays (carte + top pays) ──
  const byCountry = new Map<string, Prospect[]>();
  for (const p of prospects) {
    if (!p.country) continue;
    const list = byCountry.get(p.country) ?? [];
    list.push(p);
    byCountry.set(p.country, list);
  }
  const countryStats: CountryStat[] = Array.from(byCountry.entries())
    .map(([country, list]) => {
      const topStatus = list.reduce<ProspectStatus>(
        (top, p) => (STATUS_RANK[p.status] > STATUS_RANK[top] ? p.status : top),
        list[0].status
      );
      const lastContact = list.reduce<string | null>((latest, p) => {
        if (!p.last_contact_at) return latest;
        if (!latest || p.last_contact_at > latest) return p.last_contact_at;
        return latest;
      }, null);
      return {
        country,
        isoNumeric: countryNameToIsoNumeric(country),
        total: list.length,
        negotiation: list.filter((p) => p.status === "negotiation").length,
        topStatus,
        lastContact,
      };
    })
    .sort((a, b) => b.total - a.total);

  // ── Funnel cumulatif (statut courant >= rang du palier, hors refus) ──
  const activeProspects = prospects.filter((p) => p.status !== "refused");
  const funnelDefs: { key: string; label: string; minRank: number }[] = [
    { key: "prospects", label: "Prospects", minRank: STATUS_RANK.new },
    { key: "premier_contact", label: "Premier contact", minRank: STATUS_RANK.first_contact_sent },
    { key: "reponse", label: "Réponse reçue", minRank: STATUS_RANK.response_received },
    { key: "interesse", label: "Intéressé", minRank: STATUS_RANK.interested },
    { key: "offre", label: "Offre envoyée", minRank: STATUS_RANK.offer_sent },
    { key: "negociation", label: "Négociation", minRank: STATUS_RANK.negotiation },
    { key: "client", label: "Client actif", minRank: STATUS_RANK.active_client },
  ];
  const funnel: FunnelStage[] = funnelDefs.map((stage) => ({
    key: stage.key,
    label: stage.label,
    count: activeProspects.filter((p) => STATUS_RANK[p.status] >= stage.minRank).length,
  }));

  // ── Évolution mensuelle (6 derniers mois, prospects créés) ──
  const now = new Date();
  const monthlyGrowth: MonthlyPoint[] = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = prospects.filter((p) => p.created_at.startsWith(monthKey)).length;
    return { month: monthKey, label: MONTH_LABELS[d.getMonth()], count };
  });

  // ── Activité récente (jointure manuelle : activity_log n'a pas de FK vers prospects) ──
  const prospectIds = Array.from(new Set(activity.map((a) => a.prospect_id).filter((id): id is string => Boolean(id))));
  const namesById = new Map<string, string>();
  if (prospectIds.length > 0) {
    const { data: named } = await supabase.from("prospects").select("id, company_name").in("id", prospectIds);
    for (const row of named ?? []) namesById.set(row.id, row.company_name);
  }
  const recentActivity: ActivityItem[] = activity.map((a) => ({
    id: a.id,
    agent: a.agent,
    action: a.action,
    companyName: a.prospect_id ? (namesById.get(a.prospect_id) ?? null) : null,
    createdAt: a.created_at,
  }));

  const tasksOpen: TaskItem[] = tasksJoined.map(({ prospects: joinedProspect, ...task }) => ({
    ...task,
    companyName: joinedProspect?.company_name ?? null,
  }));

  const recentProspects = prospects.slice(0, 8);

  return {
    totalProspects,
    countriesCount: countriesSet.size,
    negotiationCount,
    offerSentCount,
    wonCount,
    conversionRate,
    countryStats,
    funnel,
    monthlyGrowth,
    recentActivity,
    tasksOpen,
    recentProspects,
  };
}
