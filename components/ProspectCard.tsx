import Link from "next/link";
import type { Prospect } from "@/types";
import { countryFlag, countryName, statusBadgeClass, statusEmoji, statusLabel } from "@/lib/ui";

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function ProspectCard({ prospect: p }: { prospect: Prospect }) {
  const reminder = fmtDate(p.next_reminder_at);
  const overdue = p.next_reminder_at ? new Date(p.next_reminder_at) < new Date() : false;

  return (
    <Link
      href={`/prospects/${p.id}`}
      className="group block rounded-xl border border-white/[0.06] bg-zinc-900 p-4 transition-all duration-200 hover:scale-[1.01] hover:border-orange-500/30"
    >
      <p className="line-clamp-2 font-semibold text-white transition-colors group-hover:text-orange-400">
        {p.company_name}
      </p>
      <p className="mt-1 text-sm text-zinc-400">
        {countryFlag(p.country)} {countryName(p.country) || "—"}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(p.status)}`}>
          {statusEmoji(p.status)} {statusLabel(p.status)}
        </span>
      </div>

      {p.products.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {p.products.slice(0, 3).map((prod) => (
            <span key={prod} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">
              {prod}
            </span>
          ))}
          {p.products.length > 3 && <span className="text-[10px] text-zinc-600">+{p.products.length - 3}</span>}
        </div>
      )}

      {reminder && (
        <p className={`mt-3 text-xs font-medium ${overdue ? "text-red-400" : "text-zinc-500"}`}>
          🔔 Relance {reminder}
        </p>
      )}
    </Link>
  );
}
