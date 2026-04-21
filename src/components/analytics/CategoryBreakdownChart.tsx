"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CategoryBreakdownChartProps {
  data: { category: string; avgScore: number | null }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  technical: "#7c3aed",
  coding: "#06b6d4",
  system_design: "#f59e0b",
  behavioral: "#10b981",
};

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const t = useTranslations("Analytics");

  // Filter and format data
  const chartData = data
    .filter((d) => d.avgScore !== null)
    .map((d) => ({
      name: t(`category.${d.category}`),
      score: Math.round(d.avgScore!),
      originalCategory: d.category,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
            stroke="var(--border-subtle)"
            opacity={0.5}
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            hide
          />
          <YAxis
            dataKey="name"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
            width={100}
          />
          <Tooltip 
            cursor={{ fill: "var(--surface-highest)", opacity: 0.2 }}
            contentStyle={{ 
              backgroundColor: "var(--surface-container)", 
              borderColor: "var(--border-subtle)",
              borderRadius: "8px",
              color: "var(--text-primary)"
            }}
          />
          <Bar 
            dataKey="score" 
            radius={[0, 4, 4, 0]} 
            barSize={24}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={CATEGORY_COLORS[entry.originalCategory] || "var(--primary)"} 
                fillOpacity={0.6}
                stroke={CATEGORY_COLORS[entry.originalCategory] || "var(--primary)"}
                strokeWidth={1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
