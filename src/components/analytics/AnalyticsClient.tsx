"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { RangeSelector } from "./RangeSelector";
import { AnalyticsData } from "@/types/analytics";
import { ScoreTrendChart } from "./ScoreTrendChart";
import { CategoryBreakdownChart } from "./CategoryBreakdownChart";
import { TopicsPanel } from "./TopicsPanel";

interface AnalyticsClientProps {
  data: AnalyticsData;
  children?: React.ReactNode;
}

export function AnalyticsClient({ data, children }: AnalyticsClientProps) {
  const t = useTranslations("Analytics");
  const hasData = data.overview.totalSessions > 0;

  return (
    <div className="space-y-6">
      {/* Header with Selector and Breadcrumbs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-1 text-xs font-medium text-text-secondary">
            <Link href="/dashboard" className="transition hover:text-text-primary">
              {t("breadcrumb")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-text-primary">{t("title")}</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
            {t("title")}
          </h1>
          <p className="text-sm text-text-secondary">
            {t("subtitle", { count: data.overview.totalSessions })}
          </p>
        </div>
        <RangeSelector />
      </div>

      {/* KPI Cards (Children) */}
      {children}

      {!hasData ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-surface-container/20 p-12 text-center">
          <div className="rounded-full bg-surface-highest/50 p-4">
            <svg
              className="h-12 w-12 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="mt-6 text-lg font-semibold text-text-primary">
            {t("noDataTitle")}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-text-secondary">
            {t("noDataDesc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Trend Chart (2/3 width) */}
          <div className="rounded-2xl border border-border-subtle bg-surface-container/40 p-6 backdrop-blur-sm lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary">{t("scoreTrend")}</h3>
              <p className="text-sm text-text-secondary">{t("scoreTrendSub")}</p>
            </div>
            <ScoreTrendChart data={data.trend} />
          </div>

          {/* Category Chart (1/3 width) */}
          <div className="rounded-2xl border border-border-subtle bg-surface-container/40 p-6 backdrop-blur-sm">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary">{t("categories")}</h3>
              <p className="text-sm text-text-secondary">{t("categoriesSub")}</p>
            </div>
            <CategoryBreakdownChart data={data.byCategory} />
          </div>
        </div>
      )}

      {/* Weak/Strong Topics Panel */}
      {hasData && <TopicsPanel topics={data.topics} />}
    </div>
  );
}
