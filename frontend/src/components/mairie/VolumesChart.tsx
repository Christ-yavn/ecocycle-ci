"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export type MonthlyVolume = {
  mois: string;
  collecte: number;
  recycle: number;
};

export function VolumesChart({ data }: { data: MonthlyVolume[] }) {
  if (data.length === 0) {
    return (
      <p className="muted" style={{ margin: 0 }}>
        Aucune donnée de collecte sur les 6 derniers mois.
      </p>
    );
  }

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,37,27,0.08)" />
          <XAxis
            dataKey="mois"
            tick={{ fontSize: 12, fill: "#2c3b31", fontFamily: "Manrope" }}
            axisLine={{ stroke: "rgba(20,37,27,0.2)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#2c3b31", fontFamily: "Manrope" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(63,163,77,0.06)" }}
            contentStyle={{
              background: "#f3eee1",
              border: "1px solid rgba(20,37,27,0.15)",
              borderRadius: 8,
              fontFamily: "Manrope",
              fontSize: 13,
            }}
            formatter={(value) => [`${String(value)} kg`]}
          />
          <Legend
            wrapperStyle={{
              fontFamily: "Manrope",
              fontSize: 12,
              paddingTop: 8,
            }}
          />
          <Bar
            name="Collecté (kg)"
            dataKey="collecte"
            fill="#3fa34d"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
          <Bar
            name="Recyclé (kg)"
            dataKey="recycle"
            fill="#d9a441"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
