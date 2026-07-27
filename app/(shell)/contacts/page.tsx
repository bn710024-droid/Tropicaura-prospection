import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import type { Contact, Prospect } from "@/types";
import { countryFlag, countryName, statusBadgeClass, statusEmoji, statusLabel } from "@/lib/ui";

export const dynamic = "force-dynamic";

interface ContactWithProspect extends Contact {
  prospects: Pick<Prospect, "id" | "company_name" | "country" | "status" | "last_contact_at" | "next_reminder_at"> | null;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = createServerClient();

  const { data } = await supabase
    .from("contacts")
    .select("*, prospects(id, company_name, country, status, last_contact_at, next_reminder_at)")
    .order("created_at", { ascending: false })
    .limit(1000);

  let contacts = (data ?? []) as ContactWithProspect[];
  if (q) {
    const needle = q.toLowerCase();
    contacts = contacts.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(needle) ||
        c.prospects?.company_name?.toLowerCase().includes(needle)
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Contacts</h1>
        <p className="mt-1 text-sm text-muted-foreground">Toutes les personnes enregistrées, tous prospects confondus.</p>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher un contact ou une entreprise…"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
      </form>

      {contacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          {q ? "Aucun contact ne correspond à cette recherche." : "Aucun contact enregistré. Ajoutez-en depuis une fiche prospect."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Entreprise</th>
                <th className="px-4 py-3">Fonction</th>
                <th className="px-4 py-3">Pays</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Dernier contact</th>
                <th className="px-4 py-3">Prochaine relance</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-accent/50">
                  <td className="px-4 py-3 font-medium text-foreground">{c.full_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {c.prospects ? (
                      <Link href={`/prospects/${c.prospects.id}`} className="text-primary hover:underline">
                        {c.prospects.company_name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.role_title ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.prospects?.country ? `${countryFlag(c.prospects.country)} ${countryName(c.prospects.country) || c.prospects.country}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.whatsapp ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.prospects?.last_contact_at)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.prospects?.next_reminder_at)}</td>
                  <td className="px-4 py-3">
                    {c.prospects?.status ? (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(c.prospects.status)}`}>
                        {statusEmoji(c.prospects.status)} {statusLabel(c.prospects.status)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
