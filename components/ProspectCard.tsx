"use client";

import Link from "next/link";
import type { Prospect } from "@/types";
import { countryFlag, countryName, scoreColor, statusBadgeClass, statusLabel } from "@/lib/ui";
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

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <Link
      href={`/prospects/${p.id}`}
      className={`group relative block rounded-xl border bg-zinc-900 p-4 transition-all duration-200 hover:scale-[1.01] ${
        isHot
          ? "border-orange-500/40 shadow-lg shadow-orange-500/20"
          : "border-white/[0.06] hover:border-orange-500/30"
      }`}
    >
      {isHot && <span className="absolute top-3 right-3 text-base">🔥</span>}

      <p className="line-clamp-2 pr-5 font-semibold text-white transition-colors group-hover:text-orange-400">
        {p.company_name}
      </p>
      <p className="mt-1 text-sm text-zinc-400">
        {countryFlag(p.country)} {countryName(p.country) || "—"}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(p.status)}`}>
          {statusLabel(p.status)}
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sc.pill}`}>
          {p.score !== null ? `${p.score}/10` : "—"}
        </span>
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
                  onClick={stop(onQualify)}
                  className="rounded-full border border-orange-500/50 px-3 py-1.5 text-xs font-semibold text-orange-400 transition-colors hover:bg-orange-500/10"
                >
                  🤖 Qualifier
                </button>
              )}
              {canDraft && (
                <button
                  onClick={stop(onDraft)}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/5"
                >
                  ✍️ Rédiger
                </button>
              )}
            </div>
          )
        )}
      </div>
    </Link>
  );
}
