"use client";

import React from "react";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

export function DeltaBadge({ value, label }: { value: number | null; label: string }) {
  if (value === null) return null;
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs ${
        isPositive
          ? "bg-emerald-400/10 text-emerald-400"
          : "bg-red-400/10 text-red-400"
      }`}
    >
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : ""}
      {value}% {label}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: number | null;
  deltaLabel?: string;
  subtext?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  subtext,
  className = "",
}: StatCardProps) {
  return (
    <div className={`rounded-xl border border-border-subtle bg-surface-container/70 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-[20px] ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          {label}
        </span>
        <Icon className="h-4 w-4 text-text-secondary" />
      </div>
      <p className="mt-4 font-mono text-4xl font-bold text-text-primary">{value}</p>
      <div className="mt-3 min-h-[20px]">
        {delta !== undefined && delta !== null ? (
          <DeltaBadge value={delta} label={deltaLabel ?? ""} />
        ) : subtext ? (
          <p className="text-xs text-text-secondary">{subtext}</p>
        ) : null}
      </div>
    </div>
  );
}
