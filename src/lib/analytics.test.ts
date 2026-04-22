import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing the module under test
vi.mock("@/lib/db", () => ({
  prisma: {
    session: {
      findMany: vi.fn(),
    },
    sessionMessage: {
      findMany: vi.fn(),
    },
  },
}));

import { getAnalyticsData } from "./analytics";
import { prisma } from "@/lib/db";
import { subDays } from "date-fns";

const mockPrisma = vi.mocked(prisma);

describe("getAnalyticsData", () => {
  const userId = "test-user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns zero-state when no sessions exist", async () => {
    mockPrisma.session.findMany.mockResolvedValue([]);
    mockPrisma.sessionMessage.findMany.mockResolvedValue([]);

    const result = await getAnalyticsData(userId, "7d");

    expect(result.overview.totalSessions).toBe(0);
    expect(result.overview.avgScore).toBeNull();
  });

  it("calculates deltas and topics correctly", async () => {
    const today = new Date();
    const tenDaysAgo = subDays(today, 10);

    mockPrisma.session.findMany
      .mockResolvedValueOnce([
        { id: "s1", createdAt: today, completedAt: today, score: 80, category: "technical", isDemo: false },
        { id: "s2", createdAt: today, completedAt: today, score: 80, category: "coding", isDemo: false },
      ] as unknown)
      .mockResolvedValueOnce([
        { id: "s1", createdAt: today, completedAt: today, score: 80, category: "technical", isDemo: false },
        { id: "s2", createdAt: today, completedAt: today, score: 80, category: "technical", isDemo: false },
        { id: "s3", createdAt: tenDaysAgo, completedAt: tenDaysAgo, score: 80, category: "technical", isDemo: false },
      ] as unknown);

    mockPrisma.sessionMessage.findMany.mockResolvedValue([
      { 
        criteria: { code_readability: 40 }, 
        score: 40,
        session: { category: "coding" }
      },
      { 
        criteria: { code_readability: 30 }, 
        score: 30,
        session: { category: "coding" }
      }
    ] as unknown);

    const result = await getAnalyticsData(userId, "2s");

    expect(result.overview.totalSessions).toBe(2);
    expect(result.overview.totalSessionsDelta).toBe(100);
    
    // Topic logic
    expect(result.topics.weak).toContainEqual(expect.objectContaining({
      criteriaKey: "code_readability",
      avgScore: 35,
      suggestedCategory: "coding"
    }));
  });

  it("calculates current streak correctly", async () => {
    const today = new Date("2024-04-22T12:00:00Z");
    vi.setSystemTime(today);

    const yesterday = subDays(today, 1);
    const twoDaysAgo = subDays(today, 2);

    mockPrisma.session.findMany
      .mockResolvedValueOnce([
        { id: "s1", createdAt: today, completedAt: today, score: 80, category: "technical", isDemo: false },
        { id: "s2", createdAt: yesterday, completedAt: yesterday, score: 80, category: "technical", isDemo: false },
        { id: "s3", createdAt: twoDaysAgo, completedAt: twoDaysAgo, score: 80, category: "technical", isDemo: false },
      ] as unknown);

    mockPrisma.sessionMessage.findMany.mockResolvedValue([]);
    const result = await getAnalyticsData(userId, "30d");
    expect(result.overview.currentStreak).toBe(3);
  });

  it("aggregates trend data correctly (Weekly grouping Mode)", async () => {
    const today = new Date();
    const seventyDaysAgo = subDays(today, 70);

    mockPrisma.session.findMany
      .mockResolvedValueOnce([
        { id: "s1", createdAt: today, completedAt: today, score: 80, category: "technical", isDemo: false },
        { id: "s2", createdAt: seventyDaysAgo, completedAt: seventyDaysAgo, score: 60, category: "technical", isDemo: false },
      ] as unknown);

    mockPrisma.sessionMessage.findMany.mockResolvedValue([]);
    const result = await getAnalyticsData(userId, "all");
    vi.useRealTimers();
    expect(result.trend.length).toBeGreaterThanOrEqual(1);
  });
});
