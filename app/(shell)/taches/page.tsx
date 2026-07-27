import { createServerClient } from "@/lib/supabase/server";
import type { Task } from "@/types";
import { Button } from "@/components/ui/button";
import TaskFormDialog from "@/components/TaskFormDialog";
import TasksList, { type TaskWithCompany } from "@/components/TasksList";

export const dynamic = "force-dynamic";

export default async function TachesPage() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("tasks")
    .select("*, prospects(company_name)")
    .order("status", { ascending: true })
    .order("priority", { ascending: false })
    .order("due_date", { ascending: true, nullsFirst: false });

  const tasks: TaskWithCompany[] = ((data ?? []) as (Task & { prospects: { company_name: string } | null })[]).map(
    ({ prospects, ...task }) => ({ ...task, companyName: prospects?.company_name ?? null })
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tâches</h1>
          <p className="mt-1 text-sm text-muted-foreground">Votre liste de choses à faire, liées à vos prospects.</p>
        </div>
        <TaskFormDialog trigger={<Button>+ Nouvelle tâche</Button>} />
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Aucune tâche pour l&apos;instant.
        </div>
      ) : (
        <TasksList tasks={tasks} />
      )}
    </div>
  );
}
