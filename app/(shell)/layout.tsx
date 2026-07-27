import { createServerClient } from "@/lib/supabase/server";
import AppShell from "@/components/dashboard/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";

// Layout du groupe de routes authentifiées (tout sauf /login) : sidebar + topbar.
// /login vit hors de ce groupe pour ne jamais afficher le chrome de l'app avant connexion.
export default async function ShellLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = createServerClient();
  const { count: openTasksCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  return (
    <TooltipProvider delay={200}>
      <AppShell openTasksCount={openTasksCount ?? 0}>{children}</AppShell>
    </TooltipProvider>
  );
}
