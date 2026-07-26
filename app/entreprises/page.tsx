import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import type { Prospect } from "@/types";
import { countryFlag, countryName, statusBadgeClass, statusEmoji, statusLabel } from "@/lib/ui";

export const dynamic = "force-dynamic";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function EntreprisesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = createServerClient();

  const [{ data: prospectsData }, { data: contactsData }, { data: remindersData }] = await Promise.all([
    supabase.from("prospects").select("*").order("company_name", { ascending: true }).limit(1000),
    supabase.from("contacts").select("id, prospect_id"),
    supabase.from("reminders").select("id, prospect_id"),
  ]);

  let companies = (prospectsData ?? []) as Prospect[];
  if (q) {
    const needle = q.toLowerCase();
    companies = companies.filter((c) => c.company_name.toLowerCase().includes(needle));
  }

  const contactCounts = new Map<string, number>();
  for (const row of contactsData ?? []) {
    contactCounts.set(row.prospect_id, (contactCounts.get(row.prospect_id) ?? 0) + 1);
  }
  const reminderCounts = new Map<string, number>();
  for (const row of remindersData ?? []) {
    reminderCounts.set(row.prospect_id, (reminderCounts.get(row.prospect_id) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Entreprises</h1>
        <p className="mt-1 text-sm text-muted-foreground">Annuaire des entreprises prospectées.</p>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher une entreprise…"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
      </form>

      {companies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          {q ? "Aucune entreprise ne correspond à cette recherche." : "Aucune entreprise pour l'instant."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {companies.map((c) => (
            <Link
              key={c.id}
              href={`/prospects/${c.id}`}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-black/20"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-foreground transition-colors group-hover:text-primary">{c.company_name}</h2>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(c.status)}`}>
                  {statusEmoji(c.status)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {countryFlag(c.country)} {countryName(c.country) || c.country || "—"}
                {c.city ? ` · ${c.city}` : ""}
              </p>
              {c.address && <p className="mt-1 text-xs text-muted-foreground">{c.address}</p>}

              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {c.phone && <p>📞 {c.phone}</p>}
                {c.email && <p>✉️ {c.email}</p>}
                {c.website && <p className="truncate">🌐 {c.website}</p>}
              </div>

              {c.products.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.products.slice(0, 4).map((p) => (
                    <span key={p} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {p}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>{contactCounts.get(c.id) ?? 0} contact(s)</span>
                <span>{reminderCounts.get(c.id) ?? 0} relance(s)</span>
                <span>{fmtDate(c.last_contact_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
