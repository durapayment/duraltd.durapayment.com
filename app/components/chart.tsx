"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, Label, ListBox, Select } from "@heroui/react";

const data = [
  { day: "01", value: 30 },
  { day: "02", value: 50 },
  { day: "03", value: 18 },
  { day: "04", value: 15 },
  { day: "05", value: 43 },
  { day: "06", value: 25 },
  { day: "07", value: 22 },
  { day: "08", value: 8 },
  { day: "09", value: 5 },
  { day: "10", value: 42 },
  { day: "11", value: 38 },
  { day: "12", value: 30 },
];

const stats = [
  { label: "Weekly Sales", value: "₦28,441" },
  { label: "Daily Sales", value: "₦4,063" },
  { label: "Total Sales", value: "278" },
];

export default function SalesPerformance() {
  return (
    <div className="max-w-lg ">
      <div className="flex flex-col gap-4">
        {/* Stats rows */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map(({ label, value }) => (
            <div key={label}>
              <div className="flex items-center gap-1.5">
                <span className="text-lg">{value}</span>
                <span className="text-green-600 text-xs font-medium">
                  ↑ 3.3%
                </span>
              </div>
              <span className="text-gray-400 text-xs">{label}</span>
            </div>
          ))}
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barCategoryGap="30%">
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              ticks={[0, 20, 40, 60]}
              width={24}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill="#3b82f6" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
