"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export interface BarDatum {
  label: string;
  count: number;
}

export default function TopBarChart({ data }: { data: BarDatum[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Pas encore de données.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 34, 120)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1d1d1d" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={110}
          tick={{ fill: "#e4e4e7", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(249,115,22,0.06)" }}
          contentStyle={{ background: "#111111", border: "1px solid #1d1d1d", borderRadius: 10, fontSize: 12, color: "#fff" }}
          formatter={(value) => [`${value}`, "Prospects"]}
        />
        <defs>
          <linearGradient id="topBarFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ffb347" />
          </linearGradient>
        </defs>
        <Bar dataKey="count" fill="url(#topBarFill)" radius={[0, 6, 6, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
