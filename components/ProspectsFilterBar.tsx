"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PROSPECT_STATUSES } from "@/types";
import { statusEmoji, statusLabel } from "@/lib/ui";

export default function ProspectsFilterBar({
  countries,
  products,
}: {
  countries: string[];
  products: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (q === current) return;
    const timeout = setTimeout(() => setParam("q", q), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const selectClass =
    "rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une entreprise…"
          className="border-border bg-card pl-9"
        />
      </div>

      <select
        className={selectClass}
        value={searchParams.get("country") ?? ""}
        onChange={(e) => setParam("country", e.target.value)}
      >
        <option value="">Tous les pays</option>
        {countries.map((c) => (
          <option key={c} value={c} className="bg-popover">
            {c}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={searchParams.get("product") ?? ""}
        onChange={(e) => setParam("product", e.target.value)}
      >
        <option value="">Tous les produits</option>
        {products.map((p) => (
          <option key={p} value={p} className="bg-popover">
            {p}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={searchParams.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
      >
        <option value="">Tous les statuts</option>
        {PROSPECT_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-popover">
            {statusEmoji(s)} {statusLabel(s)}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={searchParams.get("sort") ?? "recent"}
        onChange={(e) => setParam("sort", e.target.value)}
      >
        <option value="recent" className="bg-popover">
          Plus récents
        </option>
        <option value="oldest" className="bg-popover">
          Plus anciens
        </option>
        <option value="reminder" className="bg-popover">
          Relance la plus proche
        </option>
      </select>
    </div>
  );
}
