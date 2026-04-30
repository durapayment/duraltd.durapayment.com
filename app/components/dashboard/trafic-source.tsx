"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card } from "@heroui/react";

const data = [
  { month: "Jan", organic: 1200, paid: 800 },
  { month: "Feb", organic: 15000, paid: 10000 },
  { month: "Mar", organic: 7000, paid: 6000 },
  { month: "Apr", organic: 14000, paid: 13000 },
  { month: "May", organic: 14000, paid: 7000 },
  { month: "Jun", organic: 9000, paid: 9000 },
  { month: "Jul", organic: 16000, paid: 9000 },
  { month: "Aug", organic: 16000, paid: 11000 },
  { month: "Sep", organic: 20000, paid: 5000 },
  { month: "Oct", organic: 16000, paid: 15000 },
  { month: "Nov", organic: 21000, paid: 19000 },
  { month: "Dec", organic: 14000, paid: 10000 },
];

const formatY = (value: number) => {
  if (value === 0) return "0";
  return `${value / 1000}k`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-md rounded-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === "organic" ? "Inflow" : "Outflows"}:{" "}
          {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function TrafficSource() {
  return (
    <div className="flex flex-col gap-4">
      {/* Stat */}
      <div>
        <p className="text-lg text-gray-900">231,856</p>
        <p className="text-xs text-gray-400 mt-0.5">Sessions</p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
        >
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickFormatter={formatY}
            ticks={[0, 5000, 10000, 15000, 20000]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="linear"
            dataKey="organic"
            stroke="#1d4ed8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#1d4ed8" }}
          />
          <Line
            type="linear"
            dataKey="paid"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#38bdf8" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
