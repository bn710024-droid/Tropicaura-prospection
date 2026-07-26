import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Prospect } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  new: "Nouveau",
  verified: "Vérifié",
  qualified: "Qualifié",
  contacted: "Contacté",
  replied: "A répondu",
  hot: "Chaud",
  contacted_whatsapp: "WhatsApp",
  meeting_scheduled: "RDV planifié",
  quotation_sent: "Devis envoyé",
  sample_sent: "Échantillon",
  won: "Client",
  lost: "Perdu",
  dnc: "Ne pas contacter",
};

const STATUS_DOT: Record<string, string> = {
  new: "bg-blue-400",
  verified: "bg-blue-400",
  qualified: "bg-secondary",
  contacted: "bg-secondary",
  replied: "bg-secondary",
  hot: "bg-primary",
  contacted_whatsapp: "bg-primary",
  meeting_scheduled: "bg-primary",
  quotation_sent: "bg-blue-400",
  sample_sent: "bg-blue-400",
  won: "bg-success",
  lost: "bg-destructive",
  dnc: "bg-destructive",
};

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
            <th className="pb-2 pr-3 font-semibold">Statut</th>
            <th className="pb-2 font-semibold">Score</th>
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
              <td className="py-2.5 pr-3">
                <Badge variant="outline" className="gap-1.5 border-border font-normal text-foreground">
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[p.status] ?? "bg-muted-foreground"}`} />
                  {STATUS_LABEL[p.status] ?? p.status}
                </Badge>
              </td>
              <td className="py-2.5 text-muted-foreground">{p.score ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
