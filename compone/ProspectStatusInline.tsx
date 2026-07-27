"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Prospect } from "@/types";
import { allowedTransitions } from "@/lib/prospect-status";
import { statusBadgeClass, statusEmoji, statusLabel } from "@/lib/ui";

/**
 * Badge de statut cliquable pour usage dans les tableaux (liste des prospects).
 * Affiche le badge normal ; au clic, le transforme en <select> pour changer
 * le statut sans quitter la liste ni ouvrir la fiche complète.
 */
export default function ProspectStatusInline({ prospect }: { prospect: Prospect }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const statusOptions = allowedTransitions(prospect.status);

  async function changeStatus(to: string) {
    if (!to || to === prospect.status) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        router.refresh();
      }
    } finally {
      setBusy(false);
      setEditing(false);
    }
  }

  if (editing && statusOptions.length > 0) {
    return (
      <select
        autoFocus
        disabled={busy}
        defaultValue=""
        onChange={(e) => changeStatus(e.target.value)}
        onBlur={() => setEditing(false)}
        className="rounded-full border border-border bg-popover px-2 py-0.5 text-xs"
      >
        <option value="" disabled>
          Changer…
        </option>
        <option value={prospect.status}>
          {statusEmoji(prospect.status)} {statusLabel(prospect.status)} (actuel)
        </option>
        {statusOptions.map((s) => (
          <option key={s} value={s}>
            {statusEmoji(s)} {statusLabel(s)}
          </option>
        ))}
      </select>
    );
  }

  return (
    <button
      type="button"
      disabled={statusOptions.length === 0}
      onClick={() => setEditing(true)}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-opacity ${statusBadgeClass(
        prospect.status
      )} ${statusOptions.length > 0 ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
      title={statusOptions.length > 0 ? "Cliquer pour changer le statut" : undefined}
    >
      {statusEmoji(prospect.status)} {statusLabel(prospect.status)}
    </button>
  );
}
