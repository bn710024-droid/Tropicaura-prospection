"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Prospect, ProspectStatus } from "@/types";
import ProspectCard from "./ProspectCard";
import ImportButton from "./ImportButton";
import EmailReviewModal, { type DraftEmail } from "./EmailReviewModal";

const COLUMNS: { status: ProspectStatus; title: string }[] = [
  { status: "new", title: "New" },
  { status: "qualified", title: "Qualified" },
  { status: "contacted", title: "Contacted" },
  { status: "replied", title: "Replied" },
  { status: "hot", title: "Hot 🔥" },
];

const BOARD_STATUSES = new Set<ProspectStatus>(["new", "qualified", "contacted", "replied", "hot"]);

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

  const grouped: Record<string, Prospect[]> = { new: [], qualified: [], contacted: [], replied: [], hot: [] };
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

  if (prospects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
        <Image
          src="/logo.png"
          alt="Tropic-Aura"
          width={112}
          height={112}
          className="h-28 w-28 rounded-2xl object-contain opacity-90"
        />
        <p className="mt-5 text-lg font-medium text-zinc-300">Importez vos premiers prospects</p>
        <p className="mt-1 mb-5 text-sm text-zinc-500">Un CSV d&apos;importateurs pour démarrer le pipeline.</p>
        <ImportButton />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-5 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div key={col.status} className="flex w-72 shrink-0 flex-col">
            <div className="mb-3 flex items-center gap-2 px-1">
              <h3 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">{col.title}</h3>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
                {grouped[col.status].length}
              </span>
            </div>
            <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
              {grouped[col.status].length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/5 px-3 py-5 text-center text-xs text-zinc-700">
                  —
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
