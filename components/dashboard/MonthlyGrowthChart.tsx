"use client";

import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import type { MonthlyPoint } from "@/lib/dashboard/queries";

export default function MonthlyGrowthChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1d1d1d" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "rgba(249,115,22,0.06)" }}
          contentStyle={{
            background: "#111111",
            border: "1px solid #1d1d1d",
            borderRadius: 10,
            fontSize: 12,
            color: "#fff",
          }}
          labelStyle={{ color: "#a1a1aa" }}
          formatter={(value) => [`${value} prospects`, ""]}
        />
        <defs>
          <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ffb347" />
          </linearGradient>
        </defs>
        <Bar dataKey="count" fill="url(#barFill)" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
