"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { TaskItem } from "@/lib/dashboard/queries";

const PRIORITY_COLOR: Record<string, string> = {
  high: "border-destructive/40 text-destructive",
  medium: "border-warning/40 text-warning",
  low: "border-border text-muted-foreground",
};

export default function TasksOpen({ tasks }: { tasks: TaskItem[] }) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());

  async function complete(id: string) {
    setPending((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      if (res.ok) setCompleted((prev) => new Set(prev).add(id));
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  const visible = tasks.filter((t) => !completed.has(t.id));

  if (visible.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Aucune tâche ouverte. 🎉</p>;
  }

  return (
    <ul className="space-y-2.5">
      {visible.map((task) => (
        <li key={task.id} className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => complete(task.id)}
            disabled={pending.has(task.id)}
            aria-label="Marquer comme terminée"
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border transition-colors hover:border-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {pending.has(task.id) && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{task.title ?? "Tâche sans titre"}</p>
            <div className="mt-0.5 flex items-center gap-2">
              {task.companyName && (
                <Link
                  href={`/prospects/${task.prospect_id}`}
                  className="truncate text-xs text-muted-foreground hover:text-primary hover:underline"
                >
                  {task.companyName}
                </Link>
              )}
              <span
                className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase ${
                  PRIORITY_COLOR[task.priority] ?? PRIORITY_COLOR.low
                }`}
              >
                {task.priority}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
