import { prisma } from "@/lib/db";
import { AnalyticsData, AnalyticsRange } from "@/types/analytics";
import { 
  format, 
  differenceInDays, 
  startOfWeek, 
  startOfMonth,
  startOfDay
} from "date-fns";

export function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const dayKey = (d: Date) => format(d, "yyyy-MM-dd");
  const uniqueDays = new Set(dates.map((d) => dayKey(d)));
  
  const today = startOfDay(new Date());
  let streak = 0;
  const check = new Date(today);

  // If didn't practice today, check if practiced yesterday to keep streak alive
  if (!uniqueDays.has(dayKey(check))) {
    check.setDate(check.getDate() - 1);
    if (!uniqueDays.has(dayKey(check))) return 0;
  }

  while (uniqueDays.has(dayKey(check))) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

export async function getGlobalStats(userId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalCount,
    globalStats,
    currentPeriodSessions,
    prevPeriodSessions,
    allCompletedSessions,
    allMessages
  ] = await Promise.all([
    prisma.session.count({ where: { userId, isDemo: false } }),
    prisma.session.aggregate({
      where: { userId, isDemo: false, completedAt: { not: null } },
      _avg: { score: true },
      _sum: { duration: true },
    }),
    prisma.session.findMany({
      where: { userId, isDemo: false, createdAt: { gte: thirtyDaysAgo } },
      select: { score: true, completedAt: true, duration: true },
    }),
    prisma.session.findMany({
      where: { userId, isDemo: false, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      select: { score: true, completedAt: true, duration: true },
    }),
    prisma.session.findMany({
      where: { userId, isDemo: false, completedAt: { not: null } },
      select: { completedAt: true },
      orderBy: { completedAt: "desc" },
    }),
    prisma.sessionMessage.findMany({
      where: {
        session: { userId, isDemo: false, completedAt: { not: null } },
        messageType: "evaluation",
        score: { not: null }
      },
      take: 50, // Get messages from roughly the last 10-15 sessions
      orderBy: { createdAt: "desc" },
      select: { criteria: true }
    })
  ]);

  const avgScore = globalStats._avg.score ?? 0;
  const totalMinutes = Math.round((globalStats._sum.duration ?? 0) / 60);

  const calcDelta = (current: number, prev: number): number | null => {
    if (prev === 0) return null;
    return Math.round(((current - prev) / prev) * 100);
  };

  const sessionsDelta = calcDelta(currentPeriodSessions.length, prevPeriodSessions.length);
  
  const currentCompleted = currentPeriodSessions.filter((s) => s.completedAt);
  const currentMinutes = Math.round(
    currentCompleted.reduce((sum, s) => sum + (s.duration ?? 0), 0) / 60,
  );

  const scorePercentile = avgScore > 0 ? Math.max(1, Math.round((1 - avgScore / 100) * 100)) : null;
  const streak = calculateStreak(allCompletedSessions.map(s => s.completedAt!));

  // Calculate weak criteria from last messages
  const criteriaTotals = new Map<string, { total: number; count: number }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (allMessages || []).forEach((m: any) => {
    const criteria = m.criteria as Record<string, number> | null;
    if (criteria) {
      Object.entries(criteria).forEach(([key, val]) => {
        const current = criteriaTotals.get(key) || { total: 0, count: 0 };
        criteriaTotals.set(key, { total: current.total + val, count: current.count + 1 });
      });
    }
  });

  const weakCriteria = Array.from(criteriaTotals.entries())
    .map(([key, data]) => ({
      key,
      avg: Math.round(data.total / data.count)
    }))
    .filter(c => c.avg < 70) // only include weak ones
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3);

  return {
    totalSessions: totalCount,
    avgScore,
    totalMinutes,
    sessionsDelta: sessionsDelta ?? 0,
    currentMinutes,
    scorePercentile,
    streak,
    weakCriteria
  };
}

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

  const uniqueDates = sessions.map((s) => s.completedAt as Date);
  overview.currentStreak = calculateStreak(uniqueDates);

  return {
    overview,
    trend,
    topics: { weak, strong },
    byCategory,
  };
}
