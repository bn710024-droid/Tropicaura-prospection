"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Users, Globe2, Handshake, FileText, Trophy, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { MonthlyPoint } from "@/lib/dashboard/queries";

interface KpiCardsProps {
  totalProspects: number;
  countriesCount: number;
  negotiationCount: number;
  offerSentCount: number;
  wonCount: number;
  conversionRate: number;
  monthlyGrowth: MonthlyPoint[];
}

export default function KpiCards({
  totalProspects,
  countriesCount,
  negotiationCount,
  offerSentCount,
  wonCount,
  conversionRate,
  monthlyGrowth,
}: KpiCardsProps) {
  const thisMonth = monthlyGrowth.at(-1)?.count ?? 0;
  const lastMonth = monthlyGrowth.at(-2)?.count ?? 0;
  const growthPct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  const cards = [
    {
      label: "Total prospects",
      value: totalProspects,
      icon: Users,
      trend: growthPct !== null ? `${growthPct >= 0 ? "+" : ""}${growthPct}% ce mois` : `${thisMonth} ce mois`,
      trendUp: growthPct === null || growthPct >= 0,
      sparkline: monthlyGrowth,
    },
    {
      label: "Pays prospectés",
      value: countriesCount,
      icon: Globe2,
    },
    {
      label: "En négociation",
      value: negotiationCount,
      icon: Handshake,
    },
    {
      label: "Offres envoyées",
      value: offerSentCount,
      icon: FileText,
    },
    {
      label: "Clients gagnés",
      value: wonCount,
      icon: Trophy,
    },
    {
      label: "Taux de conversion",
      value: `${(conversionRate * 100).toFixed(1)}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
        >
          <Card className="group relative overflow-hidden border-border bg-card p-4 transition-colors hover:border-primary/30">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <card.icon className="h-4 w-4" />
            </div>
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{card.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
            {"trend" in card && (
              <p className={`mt-1 text-xs font-medium ${card.trendUp ? "text-success" : "text-destructive"}`}>
                {card.trend}
              </p>
            )}
            {"sparkline" in card && card.sparkline && (
              <div className="absolute right-0 bottom-0 h-10 w-24 opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={card.sparkline}>
                    <defs>
                      <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="var(--primary)"
                      strokeWidth={1.5}
                      fill="url(#sparkFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
