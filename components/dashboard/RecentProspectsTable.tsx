import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Prospect } from "@/types";
import { statusBadgeClass, statusEmoji, statusLabel } from "@/lib/ui";

export default function RecentProspectsTable({ prospects }: { prospects: Prospect[] }) {
  if (prospects.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Aucun prospect pour l&apos;instant.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            <th className="pb-2 pr-3 font-semibold">Entreprise</th>
            <th className="pb-2 pr-3 font-semibold">Pays</th>
            <th className="pb-2 pr-3 font-semibold">Segment</th>
            <th className="pb-2 font-semibold">Statut</th>
          </tr>
        </thead>
        <tbody>
          {prospects.map((p) => (
            <tr key={p.id} className="border-b border-border/60 last:border-0">
              <td className="py-2.5 pr-3">
                <Link href={`/prospects/${p.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                  {p.company_name}
                </Link>
              </td>
              <td className="py-2.5 pr-3 text-muted-foreground">{p.country ?? "—"}</td>
              <td className="py-2.5 pr-3 text-muted-foreground">{p.segment ?? "—"}</td>
              <td className="py-2.5">
                <Badge variant="outline" className={`gap-1 font-normal ${statusBadgeClass(p.status)}`}>
                  {statusEmoji(p.status)} {statusLabel(p.status)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
