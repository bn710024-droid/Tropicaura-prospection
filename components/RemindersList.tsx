"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { Reminder } from "@/types";

export interface ReminderWithCompany extends Reminder {
  companyName: string | null;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function RemindersList({ reminders }: { reminders: ReminderWithCompany[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleDone(id: string, done: boolean) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce rappel ?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const now = new Date();
  const active = reminders.filter((r) => !r.done);
  const overdue = active.filter((r) => new Date(r.due_at) < now);
  const upcoming = active.filter((r) => new Date(r.due_at) >= now);
  const done = reminders.filter((r) => r.done);

  const groups: { key: string; label: string; items: ReminderWithCompany[]; tone?: string }[] = [
    { key: "overdue", label: "En retard", items: overdue, tone: "text-destructive" },
    { key: "upcoming", label: "À venir", items: upcoming },
    { key: "done", label: "Terminés", items: done },
  ];

  return (
    <div className="space-y-8">
      {groups.map((group) =>
        group.items.length === 0 ? null : (
          <div key={group.key}>
            <h2 className={`mb-3 text-sm font-semibold tracking-wider uppercase ${group.tone ?? "text-muted-foreground"}`}>
              {group.label} ({group.items.length})
            </h2>
            <ul className="space-y-2">
              {group.items.map((r) => (
                <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={r.done}
                      disabled={busyId === r.id}
                      onChange={(e) => toggleDone(r.id, e.target.checked)}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <div>
                      <p className={`text-sm font-medium ${r.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{r.note}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {r.companyName && (
                          <Link href={`/prospects/${r.prospect_id}`} className="hover:text-primary hover:underline">
                            {r.companyName}
                          </Link>
                        )}
                        <span className={group.key === "overdue" ? "font-semibold text-destructive" : ""}>{fmtDate(r.due_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(r.id)}
                    disabled={busyId === r.id}
                    aria-label="Supprimer"
                    className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  );
}
