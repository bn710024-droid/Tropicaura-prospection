import "server-only";
import { createServerClient } from "@/lib/supabase/server";
import { countryNameToIsoNumeric } from "@/lib/countries";
import type { ActivityLog, Prospect, ProspectStatus, Task } from "@/types";

// Ordre forward-only réel de la machine à états (cf. lib/prospect-status.ts).
// Sert à calculer un funnel cumulatif honnête (statut courant >= rang du palier)
// et le palier le plus avancé atteint par pays.
const STATUS_RANK: Record<ProspectStatus, number> = {
  new: 1,
  verified: 2,
  qualified: 3,
  contacted: 4,
  replied: 5,
  hot: 6,
  contacted_whatsapp: 7,
  meeting_scheduled: 8,
  quotation_sent: 9,
  sample_sent: 10,
  won: 11,
  lost: 0,
  dnc: 0,
};

const NEGOTIATION_STATUSES: ProspectStatus[] = ["hot", "contacted_whatsapp", "meeting_scheduled"];
const OFFER_STATUSES: ProspectStatus[] = ["quotation_sent", "sample_sent"];

export type CountryTier = "prospected" | "negotiation" | "offer_sent" | "client";

export interface CountryStat {
  country: string;
  isoNumeric: number | null;
  total: number;
  negotiation: number;
  tier: CountryTier;
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

function tierForRank(rank: number): CountryTier {
  if (rank >= STATUS_RANK.won) return "client";
  if (rank >= STATUS_RANK.quotation_sent) return "offer_sent";
  if (rank >= STATUS_RANK.hot) return "negotiation";
  return "prospected";
}

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createServerClient();

  const [prospectsRes, activityRes, tasksRes] = await Promise.all([
    supabase.from("prospects").select("*").order("created_at", { ascending: false }).limit(1000),
    // agent="claude" = télémétrie technique (un log par appel API IA), pas un événement métier
    // lisible pour Babacar : on l'exclut du fil d'activité pour ne pas le noyer sous le bruit.
    supabase
      .from("activity_log")
      .select("*")
      .neq("agent", "claude")
      .order("created_at", { ascending: false })
      .limit(15),
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
  const negotiationCount = prospects.filter((p) => NEGOTIATION_STATUSES.includes(p.status)).length;
  const offerSentCount = prospects.filter((p) => OFFER_STATUSES.includes(p.status)).length;
  const wonCount = prospects.filter((p) => p.status === "won").length;
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
      const maxRank = Math.max(...list.map((p) => STATUS_RANK[p.status] ?? 0));
      const lastContact = list.reduce<string | null>((latest, p) => {
        if (!latest || p.updated_at > latest) return p.updated_at;
        return latest;
      }, null);
      return {
        country,
        isoNumeric: countryNameToIsoNumeric(country),
        total: list.length,
        negotiation: list.filter((p) => NEGOTIATION_STATUSES.includes(p.status)).length,
        tier: tierForRank(maxRank),
        lastContact,
      };
    })
    .sort((a, b) => b.total - a.total);

  // ── Funnel cumulatif (statut courant >= rang du palier, hors lost/dnc) ──
  const activeProspects = prospects.filter((p) => p.status !== "lost" && p.status !== "dnc");
  const funnelDefs: { key: string; label: string; minRank: number }[] = [
    { key: "prospects", label: "Prospects", minRank: STATUS_RANK.new },
    { key: "qualification", label: "Qualification", minRank: STATUS_RANK.qualified },
    { key: "contact", label: "Premier contact", minRank: STATUS_RANK.contacted },
    { key: "negociation", label: "Négociation", minRank: STATUS_RANK.hot },
    { key: "offre", label: "Offre envoyée", minRank: STATUS_RANK.quotation_sent },
    { key: "client", label: "Client", minRank: STATUS_RANK.won },
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
