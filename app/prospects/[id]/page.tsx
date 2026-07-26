import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { Prospect } from "@/types";
import { countryFlag, countryName, statusBadgeClass, statusEmoji, statusLabel } from "@/lib/ui";
import ProspectActions from "@/components/ProspectActions";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = createServerClient();
  const { data } = await supabase.from("prospects").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const prospect = data as Prospect;

  const overdue = prospect.next_reminder_at ? new Date(prospect.next_reminder_at) < new Date() : false;
  const website = prospect.website?.startsWith("http") ? prospect.website : prospect.website ? `https://${prospect.website}` : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/prospects" className="text-sm text-muted-foreground transition-colors hover:text-primary">
        ← Prospects
      </Link>

      <header className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {countryFlag(prospect.country)} {prospect.company_name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {countryName(prospect.country) || prospect.country || "—"}
              {prospect.city ? ` · ${prospect.city}` : ""}
              {prospect.segment ? ` · ${prospect.segment}` : ""}
            </p>
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-primary hover:underline"
              >
                {prospect.website}
              </a>
            )}
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${statusBadgeClass(prospect.status)}`}>
            {statusEmoji(prospect.status)} {statusLabel(prospect.status)}
          </span>
        </div>

        {prospect.products.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {prospect.products.map((p) => (
              <span key={p} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {p}
              </span>
            ))}
          </div>
        )}
      </header>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/20">
        <h2 className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du contact" value={prospect.contact_name} />
          <Field label="Fonction" value={prospect.contact_role} />
          <Field label="Téléphone" value={prospect.phone} />
          <Field label="WhatsApp" value={prospect.whatsapp} />
          <Field label="Email" value={prospect.email} />
          <Field label="Adresse" value={prospect.address} />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/20">
        <h2 className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">Suivi</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Ajouté le" value={fmtDate(prospect.created_at)} />
          <Field label="Dernier contact" value={fmtDate(prospect.last_contact_at)} />
          <Field
            label="Prochaine relance"
            value={
              prospect.next_reminder_at ? (
                <span className={overdue ? "font-semibold text-destructive" : ""}>
                  {overdue ? "⚠️ " : ""}
                  {fmtDate(prospect.next_reminder_at)}
                </span>
              ) : (
                "—"
              )
            }
          />
        </div>
      </section>

      {prospect.notes && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/20">
          <h2 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">Notes</h2>
          <p className="text-sm whitespace-pre-wrap text-foreground">{prospect.notes}</p>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/20">
        <h2 className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">Actions</h2>
        <ProspectActions prospect={prospect} />
      </section>
    </main>
  );
}
