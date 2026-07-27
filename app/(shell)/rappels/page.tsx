import { createServerClient } from "@/lib/supabase/server";
import type { Reminder } from "@/types";
import { Button } from "@/components/ui/button";
import ReminderFormDialog from "@/components/ReminderFormDialog";
import RemindersList, { type ReminderWithCompany } from "@/components/RemindersList";

export const dynamic = "force-dynamic";

export default async function RappelsPage() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("reminders")
    .select("*, prospects(company_name)")
    .order("due_at", { ascending: true });

  const reminders: ReminderWithCompany[] = ((data ?? []) as (Reminder & { prospects: { company_name: string } | null })[]).map(
    ({ prospects, ...r }) => ({ ...r, companyName: prospects?.company_name ?? null })
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Rappels</h1>
          <p className="mt-1 text-sm text-muted-foreground">Vos relances commerciales — indépendantes des tâches.</p>
        </div>
        <ReminderFormDialog trigger={<Button>+ Nouveau rappel</Button>} />
      </div>

      {reminders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Aucun rappel pour l&apos;instant.
        </div>
      ) : (
        <RemindersList reminders={reminders} />
      )}
    </div>
  );
}
