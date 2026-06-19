"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Prospect, ProspectStatus } from "@/types";
import { allowedTransitions } from "@/lib/prospect-status";
import { statusLabel } from "@/lib/ui";
import { SCOUT, PLUME } from "@/lib/agents";
import EmailReviewModal, { type DraftEmail } from "./EmailReviewModal";

// Statuts pilotables manuellement (zone humaine) + sorties lost/dnc.
const HUMAN_STATUSES: ProspectStatus[] = [
  "contacted_whatsapp",
  "meeting_scheduled",
  "quotation_sent",
  "sample_sent",
  "won",
  "lost",
  "dnc",
];

export default function ProspectActions({ prospect }: { prospect: Prospect }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"qualify" | "draft" | "status" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftEmail | null>(null);

  const canQualify = prospect.status === "new" || prospect.status === "verified";
  const canDraft = prospect.status === "qualified";
  const statusOptions = allowedTransitions(prospect.status).filter((s) => HUMAN_STATUSES.includes(s));

  async function qualify() {
    setBusy("qualify");
    setError(null);
    try {
      const res = await fetch(`/api/prospects/${prospect.id}/qualify`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) setError(json.error ?? "Échec de la qualification");
      else router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(null);
    }
  }

  async function draftEmail() {
    setBusy("draft");
    setError(null);
    try {
      const res = await fetch(`/api/emails/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect_id: prospect.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) setError(json.error ?? "Échec de la rédaction");
      else setDraft({ id: json.data.id, subject: json.data.subject ?? "", body: json.data.body ?? "" });
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(null);
    }
  }

  async function changeStatus(to: string) {
    if (!to) return;
    setBusy("status");
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
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {busy === "qualify" || busy === "draft" ? (
        <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-400">
          <span className="animate-pulse text-base">{busy === "qualify" ? SCOUT.emoji : PLUME.emoji}</span>
          <span className="animate-pulse">
            {busy === "qualify" ? "SCOUT analyse le site…" : "PLUME rédige l'email…"}
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {canQualify && (
            <button
              onClick={qualify}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              🤖 Qualifier
            </button>
          )}
          {canDraft && (
            <button
              onClick={draftEmail}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:border-white/20 hover:bg-white/10"
            >
              ✍️ Rédiger email
            </button>
          )}
          {statusOptions.length > 0 && (
            <select
              defaultValue=""
              disabled={busy === "status"}
              onChange={(e) => changeStatus(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 text-sm text-zinc-300 transition-colors focus:border-orange-500 focus:outline-none"
            >
              <option value="" disabled>
                Changer le statut…
              </option>
              {statusOptions.map((s) => (
                <option key={s} value={s} className="bg-[#141414]">
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {draft && (
        <EmailReviewModal
          email={draft}
          onClose={() => setDraft(null)}
          onApproved={() => {
            setDraft(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
