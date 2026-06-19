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
  // Dropdown limité aux transitions valides (machine à états P1-04), filtré sur la zone humaine.
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
        <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700">
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
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              🤖 Qualifier
            </button>
          )}
          {canDraft && (
            <button
              onClick={draftEmail}
              className="rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              ✍️ Rédiger email
            </button>
          )}
          {statusOptions.length > 0 && (
            <select
              defaultValue=""
              disabled={busy === "status"}
              onChange={(e) => changeStatus(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-orange-500 focus:outline-none"
            >
              <option value="" disabled>
                Changer le statut…
              </option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

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
