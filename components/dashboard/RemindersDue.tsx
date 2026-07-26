import Link from "next/link";
import type { ReminderItem } from "@/lib/dashboard/queries";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function RemindersDue({ reminders }: { reminders: ReminderItem[] }) {
  if (reminders.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Aucun rappel en attente. 🎉</p>;
  }

  const now = new Date();

  return (
    <ul className="space-y-2.5">
      {reminders.map((r) => {
        const overdue = new Date(r.due_at) < now;
        return (
          <li key={r.id} className="flex items-start gap-3">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${overdue ? "bg-destructive" : "bg-warning"}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">{r.note}</p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                {r.companyName && (
                  <Link href={`/prospects/${r.prospect_id}`} className="hover:text-primary hover:underline">
                    {r.companyName}
                  </Link>
                )}
                <span className={overdue ? "font-semibold text-destructive" : ""}>
                  {overdue ? "En retard · " : ""}
                  {fmtDate(r.due_at)}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
