"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { Task, TaskStatus } from "@/types";

export interface TaskWithCompany extends Task {
  companyName: string | null;
}

const PRIORITY_COLOR: Record<string, string> = {
  high: "border-destructive/40 text-destructive",
  medium: "border-warning/40 text-warning",
  low: "border-border text-muted-foreground",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TasksList({ tasks }: { tasks: TaskWithCompany[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setStatus(id: string, status: TaskStatus) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette tâche ?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const groups: { key: TaskStatus; label: string }[] = [
    { key: "open", label: "À faire" },
    { key: "in_progress", label: "En cours" },
    { key: "done", label: "Terminées" },
  ];

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const items = tasks.filter((t) => t.status === group.key);
        if (items.length === 0) return null;
        return (
          <div key={group.key}>
            <h2 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              {group.label} ({items.length})
            </h2>
            <ul className="space-y-2">
              {items.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.status === "done"}
                      disabled={busyId === task.id}
                      onChange={(e) => setStatus(task.id, e.target.checked ? "done" : "open")}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <div>
                      <p className={`text-sm font-medium ${task.status === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {task.title ?? "Tâche sans titre"}
                      </p>
                      {task.description && <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {task.companyName && (
                          <Link href={`/prospects/${task.prospect_id}`} className="hover:text-primary hover:underline">
                            {task.companyName}
                          </Link>
                        )}
                        <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase ${PRIORITY_COLOR[task.priority]}`}>
                          {task.priority}
                        </span>
                        {task.due_date && <span>Échéance {fmtDate(task.due_date)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {group.key !== "in_progress" && task.status === "open" && (
                      <button
                        onClick={() => setStatus(task.id, "in_progress")}
                        disabled={busyId === task.id}
                        className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        En cours
                      </button>
                    )}
                    <button
                      onClick={() => remove(task.id)}
                      disabled={busyId === task.id}
                      aria-label="Supprimer"
                      className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
