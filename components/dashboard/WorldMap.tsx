"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import type { CountryStat, CountryTier } from "@/lib/dashboard/queries";

// Topojson standard (Natural Earth 110m), chargé côté client par react-simple-maps.
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const TIER_COLOR: Record<CountryTier, string> = {
  prospected: "#f97316",
  negotiation: "#22c55e",
  offer_sent: "#3b82f6",
  client: "#ffd700",
};

const TIER_LABEL: Record<CountryTier, string> = {
  prospected: "Prospecté",
  negotiation: "Négociation active",
  offer_sent: "Devis envoyé",
  client: "Client",
};

interface GeoFeature {
  rsmKey: string;
  id: string;
  properties: { name: string };
}

export default function WorldMap({ countryStats }: { countryStats: CountryStat[] }) {
  const router = useRouter();
  const [hovered, setHovered] = useState<{ stat: CountryStat; x: number; y: number } | null>(null);

  const statsByIso = useMemo(() => {
    const map = new Map<number, CountryStat>();
    for (const stat of countryStats) {
      if (stat.isoNumeric !== null) map.set(stat.isoNumeric, stat);
    }
    return map;
  }, [countryStats]);

  return (
    <div
      className="relative"
      onMouseMove={(e) => {
        if (hovered) setHovered({ ...hovered, x: e.clientX, y: e.clientY });
      }}
    >
      <ComposableMap
        projectionConfig={{ scale: 148, center: [10, 15] }}
        className="h-[380px] w-full"
        style={{ width: "100%", height: "380px" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: GeoFeature[] }) =>
            geographies.map((geo) => {
              const stat = statsByIso.get(Number(geo.id));
              const fill = stat ? TIER_COLOR[stat.tier] : "#1a1a1a";
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) => {
                    if (stat) setHovered({ stat, x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => {
                    if (stat) router.push(`/prospects?country=${encodeURIComponent(stat.country)}`);
                  }}
                  style={{
                    default: {
                      fill,
                      stroke: "#090909",
                      strokeWidth: 0.5,
                      outline: "none",
                      transition: "fill 150ms ease",
                    },
                    hover: {
                      fill: stat ? fill : "#27272a",
                      stroke: "#090909",
                      strokeWidth: 0.5,
                      outline: "none",
                      cursor: stat ? "pointer" : "default",
                      opacity: stat ? 0.85 : 1,
                    },
                    pressed: { fill, stroke: "#090909", strokeWidth: 0.5, outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {hovered && (
        <div
          className="pointer-events-none fixed z-50 w-56 rounded-xl border border-border bg-popover p-3 shadow-2xl shadow-black/50"
          style={{ left: hovered.x + 16, top: hovered.y + 16 }}
        >
          <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-foreground">
            {hovered.stat.country}
          </p>
          <p className="mb-2 text-[11px] font-medium" style={{ color: TIER_COLOR[hovered.stat.tier] }}>
            {TIER_LABEL[hovered.stat.tier]}
          </p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Prospects</span>
              <span className="font-semibold text-foreground">{hovered.stat.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Négociations</span>
              <span className="font-semibold text-foreground">{hovered.stat.negotiation}</span>
            </div>
            <div className="flex justify-between">
              <span>Dernier contact</span>
              <span className="font-semibold text-foreground">
                {hovered.stat.lastContact
                  ? new Date(hovered.stat.lastContact).toLocaleDateString("fr-FR")
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {(Object.keys(TIER_LABEL) as CountryTier[]).map((tier) => (
          <div key={tier} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TIER_COLOR[tier] }} />
            {TIER_LABEL[tier]}
          </div>
        ))}
      </div>
    </div>
  );
}
