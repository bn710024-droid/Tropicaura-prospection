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
      className={`rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        isHot ? "border-orange-400 ring-1 ring-orange-200" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/prospects/${p.id}`}
          className="line-clamp-2 font-semibold text-[#1A1A1A] hover:text-orange-600 hover:underline"
        >
          {isHot && "🔥 "}
          {p.company_name}
        </Link>
        <span className="shrink-0 text-lg" title={p.country ?? ""}>
          {countryFlag(p.country)}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(p.status)}`}>
          {statusLabel(p.status)}
        </span>
        {p.segment && <span className="text-[11px] text-gray-400">{p.segment}</span>}
      </div>

      {/* Score */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-gray-500">Score SCOUT</span>
          <span className={`font-bold ${sc.text}`}>{p.score !== null ? `${p.score}/10` : "—"}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div className={`h-full rounded-full ${sc.bar}`} style={{ width: `${((p.score ?? 0) / 10) * 100}%` }} />
        </div>
      </div>

      {/* Actions / loading */}
      <div className="mt-4">
        {busy ? (
          <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
            <span className="animate-pulse text-base">{busy === "qualify" ? SCOUT.emoji : PLUME.emoji}</span>
            <span className="animate-pulse">
              {busy === "qualify" ? "SCOUT analyse le site…" : "PLUME rédige l'email…"}
            </span>
          </div>
        ) : (
          (canQualify || canDraft) && (
            <div className="flex flex-wrap gap-2">
              {canQualify && (
                <button
                  onClick={onQualify}
                  className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
                >
                  🤖 Qualifier
                </button>
              )}
              {canDraft && (
                <button
                  onClick={onDraft}
                  className="rounded-lg bg-[#1A1A1A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-black"
                >
                  ✍️ Rédiger email
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
