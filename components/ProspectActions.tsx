"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Prospect } from "@/types";
import { allowedTransitions } from "@/lib/prospect-status";
import { statusEmoji, statusLabel } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import ProspectFormDialog from "./ProspectFormDialog";

export default function ProspectActions({ prospect }: { prospect: Prospect }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = allowedTransitions(prospect.status);

  async function changeStatus(to: string) {
    if (!to) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) setError(json.error ?? "Changement de statut refusé");
      else router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Supprimer ${prospect.company_name} ? Cette action est irréversible.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Suppression refusée");
        setBusy(false);
        return;
      }
      router.push("/prospects");
      router.refresh();
    } catch {
      setError("Erreur réseau");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ProspectFormDialog prospect={prospect} trigger={<Button variant="outline">Modifier</Button>} />

        {statusOptions.length > 0 && (
          <select
            defaultValue=""
            disabled={busy}
            onChange={(e) => changeStatus(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-primary focus:outline-none disabled:opacity-50"
          >
            <option value="" disabled>
              Changer le statut…
            </option>
            {statusOptions.map((s) => (
              <option key={s} value={s} className="bg-popover">
                {statusEmoji(s)} {statusLabel(s)}
              </option>
            ))}
          </select>
        )}

        <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={busy} onClick={remove}>
          Supprimer
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
