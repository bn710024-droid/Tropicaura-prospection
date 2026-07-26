import Link from "next/link";
import type { Prospect } from "@/types";
import { countryFlag, countryName, statusBadgeClass, statusEmoji, statusLabel } from "@/lib/ui";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProspectsTable({ prospects }: { prospects: Prospect[] }) {
  if (prospects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        Aucun prospect ne correspond à ces filtres.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-border bg-card text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            <th className="px-4 py-3">Entreprise</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Pays</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Dernier contact</th>
            <th className="px-4 py-3">Prochaine relance</th>
          </tr>
        </thead>
        <tbody>
          {prospects.map((p) => {
            const overdue = p.next_reminder_at ? new Date(p.next_reminder_at) < new Date() : false;
            return (
              <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-accent/50">
                <td className="px-4 py-3">
                  <Link href={`/prospects/${p.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                    {p.company_name}
                  </Link>
                  {p.website && <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.website}</p>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.contact_name ? (
                    <>
                      <p className="text-foreground">{p.contact_name}</p>
                      {p.contact_role && <p className="text-xs">{p.contact_role}</p>}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {countryFlag(p.country)} {countryName(p.country) || p.country || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(p.status)}`}>
                    {statusEmoji(p.status)} {statusLabel(p.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(p.last_contact_at)}</td>
                <td className={`px-4 py-3 font-medium ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                  {fmtDate(p.next_reminder_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
