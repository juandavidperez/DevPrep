// src/types/analytics.ts
export const VALID_RANGES = ["5s", "10s", "20s", "all"] as const;
export type AnalyticsRange = typeof VALID_RANGES[number];

export interface AnalyticsData {
  overview: {
    totalSessions: number;
    totalSessionsDelta: number | null;
    avgScore: number | null;      // null when no completed sessions
    avgScoreDelta: number | null; // percentage change vs prior period
    totalMinutes: number;         // Estimated or calculated practice time
    totalMinutesDelta: number | null;
    currentStreak: number;
  };
  trend: {
    date: string;                 // "YYYY-MM-DD" UTC
    sessions: number;
    avgScore: number | null;
  }[];
  topics: {
    weak: { criteriaKey: string; avgScore: number; sampleCount: number; suggestedCategory?: string }[];
    strong: { criteriaKey: string; avgScore: number; sampleCount: number; suggestedCategory?: string }[];
  };
  byCategory: {
    category: string;
    avgScore: number | null;
    avgScoreDelta: number | null;
    completedSessions: number;
  }[];
}
