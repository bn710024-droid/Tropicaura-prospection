import Link from "next/link";
import type { CountryStat } from "@/lib/dashboard/queries";

export default function TopCountries({ countryStats }: { countryStats: CountryStat[] }) {
  const top = countryStats.slice(0, 7);

  if (top.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Aucun pays prospecté pour l&apos;instant.</p>;
  }

  const max = top[0].total;

  return (
    <ul className="space-y-3">
      {top.map((stat) => (
        <li key={stat.country}>
          <Link
            href={`/prospects?country=${encodeURIComponent(stat.country)}`}
            className="group block rounded-lg px-1 py-1 transition-colors hover:bg-accent"
          >
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium text-foreground">{stat.country}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{stat.total}</span> prospects
                {stat.negotiation > 0 && (
                  <>
                    {" · "}
                    <span className="font-semibold text-success">{stat.negotiation}</span> négo.
                  </>
                )}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all group-hover:bg-primary/80"
                style={{ width: `${Math.max((stat.total / max) * 100, 4)}%` }}
              />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
