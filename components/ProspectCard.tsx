"use client";

import Link from "next/link";
import type { Prospect } from "@/types";
import { countryFlag, scoreColor, statusBadgeClass, statusLabel } from "@/lib/ui";
import { SCOUT, PLUME } from "@/lib/agents";

interface Props {
  prospect: Prospect;
  busy: "qualify" | "draft" | null;
  onQualify: () => void;
  onDraft: () => void;
}

export default function ProspectCard({ prospect: p, busy, onQualify, onDraft }: Props) {
  const sc = scoreColor(p.score);
  const isHot = p.status === "hot";
  const canQualify = p.status === "new" || p.status === "verified";
  const canDraft = p.status === "qualified"; // l'API draft exige exactement "qualified"

  return (
    <div
      className={`group rounded-2xl border bg-[#141414] p-4 transition-all duration-200 hover:-translate-y-0.5 ${
        isHot
          ? "border-orange-500/40 shadow-[0_0_24px_-6px_rgba(249,115,22,0.35)]"
          : "border-white/5 hover:border-orange-500/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/prospects/${p.id}`}
          className="line-clamp-2 font-semibold text-zinc-50 transition-colors hover:text-orange-400"
        >
          {isHot && "🔥 "}
          {p.company_name}
        </Link>
        <span className="shrink-0 text-lg" title={p.country ?? ""}>
          {countryFlag(p.country)}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(p.status)}`}>
          {statusLabel(p.status)}
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sc.pill}`}>
          {p.score !== null ? `${p.score}/10` : "—"}
        </span>
        {p.segment && <span className="text-[11px] text-zinc-600">{p.segment}</span>}
      </div>

      <div className="mt-3.5">
        {busy ? (
          <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-xs font-medium text-orange-400">
            <span className="animate-pulse text-base">{busy === "qualify" ? SCOUT.emoji : PLUME.emoji}</span>
            <span className="animate-pulse">
              {busy === "qualify" ? "SCOUT analyse le site…" : "PLUME rédige l'email…"}
            </span>
          </div>
        ) : (
          (canQualify || canDraft) && (
            <div className="flex flex-wrap gap-2 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
              {canQualify && (
                <button
                  onClick={onQualify}
                  className="rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-600"
                >
                  🤖 Qualifier
                </button>
              )}
              {canDraft && (
                <button
                  onClick={onDraft}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-100 transition-colors hover:border-white/20 hover:bg-white/10"
                >
                  ✍️ Rédiger
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
