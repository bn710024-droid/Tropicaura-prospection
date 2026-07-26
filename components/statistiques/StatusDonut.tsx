"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export interface DonutDatum {
  label: string;
  count: number;
  color: string;
}

export default function StatusDonut({ data }: { data: DonutDatum[] }) {
  const filtered = data.filter((d) => d.count > 0);
  if (filtered.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Pas encore de données.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={filtered} dataKey="count" nameKey="label" innerRadius={60} outerRadius={95} paddingAngle={2}>
          {filtered.map((d) => (
            <Cell key={d.label} fill={d.color} stroke="#090909" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#111111", border: "1px solid #1d1d1d", borderRadius: 10, fontSize: 12, color: "#fff" }}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
