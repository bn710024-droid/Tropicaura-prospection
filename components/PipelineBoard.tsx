"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Prospect, ProspectStatus } from "@/types";
import ProspectCard from "./ProspectCard";
import EmailReviewModal, { type DraftEmail } from "./EmailReviewModal";

const COLUMNS: { status: ProspectStatus; title: string }[] = [
  { status: "new", title: "Nouveaux" },
  { status: "qualified", title: "Qualifiés" },
  { status: "contacted", title: "Contactés" },
  { status: "replied", title: "Ont répondu" },
  { status: "hot", title: "Chauds 🔥" },
];

const BOARD_STATUSES = new Set<ProspectStatus>([
  "new",
  "qualified",
  "contacted",
  "replied",
  "hot",
]);

// verified regroupé sous "new" ; statuts terminaux / zone humaine non affichés sur le board.
function columnOf(s: ProspectStatus): ProspectStatus | null {
  if (s === "verified") return "new";
  return BOARD_STATUSES.has(s) ? s : null;
}

export default function PipelineBoard({ prospects }: { prospects: Prospect[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"qualify" | "draft" | null>(null);
  const [draft, setDraft] = useState<DraftEmail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const grouped: Record<string, Prospect[]> = {
    new: [],
    qualified: [],
    contacted: [],
    replied: [],
    hot: [],
  };
  for (const p of prospects) {
    const c = columnOf(p.status);
    if (c) grouped[c].push(p);
  }

  async function qualify(p: Prospect) {
    setError(null);
    setBusyId(p.id);
    setBusyAction("qualify");
    try {
      const res = await fetch(`/api/prospects/${p.id}/qualify`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) setError(`${p.company_name} : ${json.error ?? "échec de la qualification"}`);
      else router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  async function draftEmail(p: Prospect) {
    setError(null);
    setBusyId(p.id);
    setBusyAction("draft");
    try {
      const res = await fetch(`/api/emails/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect_id: p.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) setError(`${p.company_name} : ${json.error ?? "échec de la rédaction"}`);
      else setDraft({ id: json.data.id, subject: json.data.subject ?? "", body: json.data.body ?? "" });
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div
            key={col.status}
            className="flex w-72 shrink-0 flex-col rounded-2xl border border-white/5 bg-white/[0.02] p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-zinc-200">{col.title}</h3>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-400">
                {grouped[col.status].length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {grouped[col.status].length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/5 px-3 py-6 text-center text-xs text-zinc-600">
                  Aucun prospect
                </p>
              ) : (
                grouped[col.status].map((p) => (
                  <ProspectCard
                    key={p.id}
                    prospect={p}
                    busy={busyId === p.id ? busyAction : null}
                    onQualify={() => qualify(p)}
                    onDraft={() => draftEmail(p)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

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
