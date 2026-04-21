"use client";

import React from "react";
import { 
  Target, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  Flame
} from "lucide-react";
import { useTranslations } from "next-intl";
import { AnalyticsData } from "@/types/analytics";
import { StatCard } from "@/components/StatCard";

interface AnalyticsKPIsProps {
  data: AnalyticsData;
}

export function AnalyticsKPIs({ data }: AnalyticsKPIsProps) {
  const t = useTranslations("Analytics");
  const { overview, byCategory } = data;

  // Identify Best and Worst categories
  const validCategories = byCategory.filter(c => c.avgScore !== null);
  const sorted = [...validCategories].sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0));
  
  const strongest = sorted[0];
  const weakest = sorted.length > 1 ? sorted[sorted.length - 1] : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Avg Score */}
      <StatCard
        label={t("globalAverage")}
        value={overview.avgScore !== null ? `${Math.round(overview.avgScore)}%` : "—"}
        icon={Target}
        delta={overview.avgScoreDelta}
        deltaLabel={t("vsPrior")}
      />

      {/* 2. Total Sessions */}
      <StatCard
        label={t("totalSessions")}
        value={overview.totalSessions}
        icon={BarChart3}
        delta={overview.totalSessionsDelta}
        deltaLabel={t("vsPrior")}
      />

      {/* 3. Strongest Category */}
      <StatCard
        label={t("strongestArea")}
        value={strongest ? t(`category.${strongest.category}`) : "—"}
        subtext={strongest ? `Score: ${Math.round(strongest.avgScore!)}%` : t("completeSessions")}
        icon={TrendingUp}
        delta={strongest?.avgScoreDelta}
        deltaLabel={t("vsPrior")}
      />

      {/* 4. Weakest or Streak */}
      {weakest ? (
        <StatCard
          label={t("focusArea")}
          value={t(`category.${weakest.category}`)}
          subtext={`Score: ${Math.round(weakest.avgScore!)}%`}
          icon={AlertTriangle}
          delta={weakest.avgScoreDelta}
          deltaLabel={t("vsPrior")}
        />
      ) : (
        <StatCard
          label={t("streak")}
          value={t("days", { count: overview.currentStreak })}
          icon={Flame}
          subtext={overview.currentStreak > 0 ? t("keepGoing") : t("startToday")}
          className="text-orange-500"
        />
      )}
    </div>
  );
}
