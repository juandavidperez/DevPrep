import { prisma } from "@/lib/db";
import { AnalyticsData, AnalyticsRange } from "@/types/analytics";
import { 
  format, 
  differenceInDays, 
  startOfWeek, 
  startOfMonth,
  startOfDay
} from "date-fns";

export async function getAnalyticsData(userId: string, range: AnalyticsRange): Promise<AnalyticsData> {
  const now = new Date();
  let limit: number | undefined;
  if (range.endsWith("s")) {
    limit = parseInt(range.slice(0, -1));
  }

  // 1. Fetch Sessions
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      isDemo: false,
      completedAt: { not: null },
      score: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // For metrics and deltas, we'll use a 2x window of sessions if a limit is set
  const metricsSessions = limit 
    ? await prisma.session.findMany({
        where: { userId, isDemo: false, completedAt: { not: null }, score: { not: null } },
        orderBy: { createdAt: "desc" },
        take: limit * 2,
      })
    : sessions;

  const currentSessions = sessions.reverse(); // For trend we want chronological order
  const priorSessions = limit && metricsSessions.length > limit
    ? metricsSessions.slice(limit).reverse()
    : [];

  const getMetrics = (sess: typeof sessions) => {
    const completed = sess.filter((s) => s.completedAt && s.score !== null);
    const totalSessions = sess.length;
    const avgScore = completed.length > 0
      ? completed.reduce((acc, s) => acc + (s.score || 0), 0) / completed.length
      : null;
    const totalMinutes = sess.length * 5;
    return { totalSessions, avgScore, totalMinutes, completed };
  };

  const currentMetrics = getMetrics(currentSessions);
  const priorMetrics = getMetrics(priorSessions);

  // Helper for delta calculation (percentage change)
  const calculateDelta = (curr: number | null, prior: number | null) => {
    if (curr === null || prior === null || prior === 0) return null;
    return Math.round(((curr - prior) / prior) * 100);
  };

  const overview = {
    totalSessions: currentMetrics.totalSessions,
    totalSessionsDelta: calculateDelta(currentMetrics.totalSessions, priorMetrics.totalSessions),
    avgScore: currentMetrics.avgScore,
    avgScoreDelta: calculateDelta(currentMetrics.avgScore, priorMetrics.avgScore),
    totalMinutes: currentMetrics.totalMinutes,
    totalMinutesDelta: calculateDelta(currentMetrics.totalMinutes, priorMetrics.totalMinutes),
    currentStreak: 0, // Calculated below
  };

  // 2. Trend Grouping
  let trend: AnalyticsData["trend"] = [];

  if (limit) {
    // For session-based ranges, show each session individually to track progress precisely
    trend = currentSessions.map((s) => ({
      date: s.createdAt.toISOString(),
      sessions: 1,
      avgScore: s.score,
    }));
  } else {
    // For "All" or date-based ranges, use smart grouping
    let groupingMode: "daily" | "weekly" | "monthly" = "daily";
    if (currentSessions.length > 0) {
      const span = differenceInDays(now, currentSessions[0].createdAt);
      if (span > 365) groupingMode = "monthly";
      else if (span > 60) groupingMode = "weekly";
    }

    const trendMap = new Map<string, { sessions: number; scores: number[] }>();
    currentSessions.forEach((s) => {
      let groupKey: string;
      if (groupingMode === "monthly") {
        groupKey = format(startOfMonth(s.createdAt), "yyyy-MM");
      } else if (groupingMode === "weekly") {
        groupKey = format(startOfWeek(s.createdAt), "yyyy-MM-dd");
      } else {
        groupKey = format(s.createdAt, "yyyy-MM-dd");
      }

      const entry = trendMap.get(groupKey) || { sessions: 0, scores: [] };
      entry.sessions += 1;
      if (s.completedAt && s.score !== null) {
        entry.scores.push(s.score);
      }
      trendMap.set(groupKey, entry);
    });

    trend = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      sessions: data.sessions,
      avgScore: data.scores.length > 0 
        ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length 
        : null,
    }));
  }

  // 3. By Category (Current vs Prior Score)
  const categoriesList = ["technical", "coding", "system_design", "behavioral"];
  const byCategory = categoriesList.map((cat) => {
    const currentCatSessions = currentMetrics.completed.filter((s) => s.category === cat);
    const priorCatSessions = priorMetrics.completed.filter((s) => s.category === cat);
    
    const currentAvg = currentCatSessions.length > 0
        ? currentCatSessions.reduce((acc, s) => acc + (s.score || 0), 0) / currentCatSessions.length
        : null;
    const priorAvg = priorCatSessions.length > 0
        ? priorCatSessions.reduce((acc, s) => acc + (s.score || 0), 0) / priorCatSessions.length
        : null;

    return {
      category: cat,
      avgScore: currentAvg,
      avgScoreDelta: calculateDelta(currentAvg, priorAvg),
      completedSessions: currentCatSessions.length,
    };
  });

  // 4. Topics (SessionMessage Criteria) - From Current period only
  const currentSessionIds = currentSessions.map((s) => s.id);
  const messages = await prisma.sessionMessage.findMany({
    where: {
      sessionId: { in: currentSessionIds },
      score: { not: null },
    },
    include: {
      session: {
        select: { category: true }
      }
    }
  });

  // Topic Metadata structure
  interface TopicMeta {
    total: number;
    count: number;
    catCounts: Map<string, number>;
  }

  const topicsMap = new Map<string, TopicMeta>();
  messages.forEach((m) => {
    const criteria = m.criteria as Record<string, number> | null;
    const category = m.session.category;

    if (criteria) {
      Object.entries(criteria).forEach(([key, value]) => {
        const entry = topicsMap.get(key) || { 
          total: 0, 
          count: 0, 
          catCounts: new Map<string, number>() 
        };
        
        entry.total += value;
        entry.count += 1;
        
        // Track category frequency for suggestedCategory
        const catCount = entry.catCounts.get(category) || 0;
        entry.catCounts.set(category, catCount + 1);
        
        topicsMap.set(key, entry);
      });
    }
  });

  const allTopics = Array.from(topicsMap.entries()).map(([criteriaKey, data]) => {
    // Find most frequent category
    let maxCount = -1;
    let suggestedCategory: string | undefined;

    data.catCounts.forEach((count, cat) => {
      if (count > maxCount) {
        maxCount = count;
        suggestedCategory = cat;
      }
    });

    return {
      criteriaKey,
      avgScore: Math.round(data.total / data.count),
      sampleCount: data.count,
      suggestedCategory,
    };
  });

  const weak = allTopics.filter((t) => t.avgScore < 60 && t.sampleCount >= 2).sort((a, b) => a.avgScore - b.avgScore);
  const strong = allTopics.filter((t) => t.avgScore >= 75 && t.sampleCount >= 2).sort((a, b) => b.avgScore - a.avgScore);

  // 5. Streak Algorithm (Independent of range)
  const allCompletedSessions = await prisma.session.findMany({
    where: { userId, isDemo: false, completedAt: { not: null } },
    select: { completedAt: true },
    orderBy: { completedAt: "desc" },
  });

  const uniqueDates = Array.from(
    new Set(allCompletedSessions.map((s) => format(s.completedAt!, "yyyy-MM-dd")))
  ).map((d) => new Date(d));

  if (uniqueDates.length > 0) {
    const today = startOfDay(new Date());
    const lastActive = uniqueDates[0];
    const diff = differenceInDays(today, lastActive);

    if (diff <= 1) { 
      overview.currentStreak = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        if (differenceInDays(uniqueDates[i], uniqueDates[i + 1]) === 1) {
          overview.currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  return {
    overview,
    trend,
    topics: { weak, strong },
    byCategory,
  };
}
