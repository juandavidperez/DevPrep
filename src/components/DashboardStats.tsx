"use client";

import React from "react";
import { Target, TrendingUp, Clock, Flame } from "lucide-react";
import { useTranslations } from "next-intl";
import { StatCard } from "./StatCard";

interface DashboardStatsProps {
  totalCount: number;
  sessionsDelta: number;
  avgScore: number;
  scorePercentile: number | null;
  totalMinutes: number;
  currentMinutes: number;
  streak: number;
}

export function DashboardStats({
  totalCount,
  sessionsDelta,
  avgScore,
  scorePercentile,
  totalMinutes,
  currentMinutes,
  streak,
}: DashboardStatsProps) {
  const t = useTranslations("Dashboard");

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label={t("stats.sessions")}
        value={totalCount}
        icon={Target}
        delta={sessionsDelta}
        deltaLabel={sessionsDelta >= 0 ? t("stats.deltaIncrease") : t("stats.deltaDecrease")}
      />
      <StatCard
        label={t("stats.avgScore")}
        value={avgScore > 0 ? `${Math.round(avgScore)}%` : "– –"}
        icon={TrendingUp}
        subtext={
          scorePercentile !== null
            ? t("stats.scoreSubtext", { percentile: scorePercentile })
            : t("stats.scoreSubtext", { percentile: 0 })
        }
      />
      <StatCard
        label={t("stats.practiceTime")}
        value={totalMinutes > 0 ? `${totalMinutes}m` : "– –"}
        icon={Clock}
        subtext={t("stats.timeSubtext", { count: currentMinutes })}
      />
      <StatCard
        label={t("stats.streak")}
        value={streak > 0 ? `${streak}d` : "– –"}
        icon={Flame}
        subtext={streak > 0 ? t("stats.streakActive") : t("stats.streakStart")}
        className="text-orange-500"
      />
    </div>
  );
}
