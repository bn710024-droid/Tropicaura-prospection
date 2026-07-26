import { UserPlus, Upload, Sparkles, Mail, RefreshCw, Pencil, Trash2, Activity as ActivityIcon } from "lucide-react";
import type { ActivityItem } from "@/lib/dashboard/queries";

const ACTION_META: Record<string, { label: string; icon: typeof ActivityIcon }> = {
  "prospect.create": { label: "Nouveau prospect ajouté", icon: UserPlus },
  "prospect.import": { label: "Import CSV de prospects", icon: Upload },
  qualify: { label: "Qualification IA effectuée", icon: Sparkles },
  draft: { label: "Email rédigé par l'IA", icon: Mail },
  "prospect.status_change": { label: "Statut mis à jour", icon: RefreshCw },
  "prospect.update": { label: "Fiche prospect modifiée", icon: Pencil },
  "prospect.delete": { label: "Prospect supprimé", icon: Trash2 },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

export default function RecentActivity({ activity }: { activity: ActivityItem[] }) {
  if (activity.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Aucune activité pour l&apos;instant.</p>;
  }

  return (
    <ul className="space-y-4">
      {activity.map((item) => {
        const meta = (item.action && ACTION_META[item.action]) || { label: item.action ?? "Activité", icon: ActivityIcon };
        const Icon = meta.icon;
        return (
          <li key={item.id} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">{meta.label}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.companyName ?? "—"} · {timeAgo(item.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
