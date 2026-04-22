"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { parseISO } from "date-fns";
import { useFormatter } from "next-intl";

interface ScoreTrendChartProps {
  data: { date: string; avgScore: number | null }[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  const format = useFormatter();
  
  if (active && payload && payload.length) {
    let dateLabel = label;
    try {
      // Use next-intl formatter for localized date
      dateLabel = format.dateTime(parseISO(label), {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      // Fallback to label if parsing fails
    }

    return (
      <div className="rounded-lg border border-border-subtle bg-surface-container/80 p-3 shadow-xl backdrop-blur-md">
        <p className="text-xs font-semibold text-text-secondary">
          {dateLabel}
        </p>
        <p className="mt-1 text-lg font-bold text-primary">
          {Math.round(payload[0].value)}%
        </p>
      </div>
    );
  }
  return null;
};

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  const chartFormat = useFormatter();

  // Filter out null scores for the chart
  const chartData = data.filter((d) => d.avgScore !== null);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border-subtle)"
            opacity={0.5}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
            minTickGap={30}
            tickFormatter={(str) => {
              try {
                // Determine format based on key length (YYYY-MM-DD vs YYYY-MM)
                const date = parseISO(str);
                if (str.length <= 7) { // Monthly
                  return chartFormat.dateTime(date, { month: "short", year: "2-digit" });
                }
                return chartFormat.dateTime(date, { month: "short", day: "numeric" });
              } catch {
                return str;
              }
            }}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="avgScore"
            stroke="var(--primary)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorScore)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
