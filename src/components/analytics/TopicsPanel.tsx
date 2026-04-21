"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { AnalyticsData } from "@/types/analytics";

interface TopicsPanelProps {
  topics: AnalyticsData["topics"];
}

const PRETTY_OVERRIDES: Record<string, string> = {
  big_o_complexity: "Big O Complexity",
  sql: "SQL",
  api: "API",
  rest: "REST",
};

function prettifyLabel(key: string): string {
  if (PRETTY_OVERRIDES[key]) return PRETTY_OVERRIDES[key];
  
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface TopicItemProps {
  topic: AnalyticsData["topics"]["weak"][0];
  type: "weak" | "strong";
}

function TopicItem({ topic, type }: TopicItemProps) {
  const t = useTranslations("Analytics");
  const isMuted = topic.sampleCount < 3;
  const barColor = type === "weak" ? "bg-error" : "bg-success";
  
  return (
    <div className={`group space-y-2 rounded-xl p-3 transition-colors hover:bg-surface-highest/5 ${isMuted ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-text-primary">
          {prettifyLabel(topic.criteriaKey)}
        </h4>
        <span className={`text-sm font-bold ${type === "weak" ? "text-error" : "text-success"}`}>
          {topic.avgScore}%
        </span>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-highest/20">
        <div 
          className={`h-full ${barColor} transition-all duration-1000`} 
          style={{ width: `${topic.avgScore}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] text-text-secondary">
          {isMuted && <Info className="h-3 w-3" />}
          {t("basedOn", { count: topic.sampleCount })}
        </span>
        {type === "weak" && (
          <Link 
            href={`/session/new${topic.suggestedCategory ? `?category=${topic.suggestedCategory}` : ""}`}
            className="flex items-center gap-1 text-[10px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100"
          >
            {t("practiceAgain")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function TopicsPanel({ topics }: TopicsPanelProps) {
  const t = useTranslations("Analytics");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Needs Work Panel */}
      <div className="flex flex-col rounded-2xl border border-border-subtle bg-surface-container/40 p-6 backdrop-blur-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary">{t("needsWork")}</h3>
          <p className="text-sm text-text-secondary">{t("needsWorkSub")}</p>
        </div>
        
        <div className="flex-1 space-y-2">
          {topics.weak.length > 0 ? (
            topics.weak.map((topic) => (
              <TopicItem key={topic.criteriaKey} topic={topic} type="weak" />
            ))
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border-subtle text-sm text-text-secondary">
              {t("noWeakAreas")}
            </div>
          )}
        </div>
      </div>

      {/* Strongest Areas Panel */}
      <div className="flex flex-col rounded-2xl border border-border-subtle bg-surface-container/40 p-6 backdrop-blur-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary">{t("strongestAreas")}</h3>
          <p className="text-sm text-text-secondary">{t("strongestAreasSub")}</p>
        </div>
        
        <div className="flex-1 space-y-2">
          {topics.strong.length > 0 ? (
            topics.strong.map((topic) => (
              <TopicItem key={topic.criteriaKey} topic={topic} type="strong" />
            ))
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border-subtle text-sm text-text-secondary">
              {t("noStrongAreas")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
