import Image from "next/image";
import type { Prospect, ProspectStatus } from "@/types";
import { statusEmoji, statusLabel } from "@/lib/ui";
import ProspectCard from "./ProspectCard";
import ImportButton from "./ImportButton";

// "refused" (sortie négative) n'a pas de colonne dédiée sur le board — visible via les filtres de la liste.
const COLUMNS: ProspectStatus[] = [
  "new",
  "first_contact_sent",
  "response_received",
  "interested",
  "offer_sent",
  "negotiation",
  "first_order",
  "active_client",
];

export default function PipelineBoard({ prospects }: { prospects: Prospect[] }) {
  const grouped: Record<string, Prospect[]> = Object.fromEntries(COLUMNS.map((s) => [s, [] as Prospect[]]));
  for (const p of prospects) {
    if (grouped[p.status]) grouped[p.status].push(p);
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
    <div className="flex gap-5 overflow-x-auto pb-4">
      {COLUMNS.map((status) => (
        <div key={status} className="flex w-72 shrink-0 flex-col">
          <div className="mb-3 flex items-center gap-2 px-1">
            <h3 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
              {statusEmoji(status)} {statusLabel(status)}
            </h3>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
              {grouped[status].length}
            </span>
          </div>
          <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
            {grouped[status].length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/5 px-3 py-5 text-center text-xs text-zinc-700">—</p>
            ) : (
              grouped[status].map((p) => <ProspectCard key={p.id} prospect={p} />)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
