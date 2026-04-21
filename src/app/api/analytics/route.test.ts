import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { auth } from "@/lib/auth";
import { getAnalyticsData } from "@/lib/analytics";
import { NextResponse } from "next/server";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock analytics lib
vi.mock("@/lib/analytics", () => ({
  getAnalyticsData: vi.fn(),
}));

describe("Analytics API Route (GET /api/analytics)", () => {
  const userId = "user_123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (url: string) => new Request(url);

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    
    const req = createRequest("http://localhost/api/analytics?range=7d");
    const response = await GET(req);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 if range is missing", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: userId } } as any);

    const req = createRequest("http://localhost/api/analytics");
    const response = await GET(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Invalid range");
  });

  it("returns 400 if range is invalid", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: userId } } as any);

    const req = createRequest("http://localhost/api/analytics?range=90d");
    const response = await GET(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Invalid range");
  });

  it("returns 200 and data if authenticated and range is valid", async () => {
    const mockData = { overview: { totalSessions: 5 }, trend: [], topics: {}, byCategory: [] };
    vi.mocked(auth).mockResolvedValue({ user: { id: userId } } as any);
    vi.mocked(getAnalyticsData).mockResolvedValue(mockData as any);

    const req = createRequest("http://localhost/api/analytics?range=30d");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockData);
    expect(getAnalyticsData).toHaveBeenCalledWith(userId, "30d");
  });

  it("returns 500 if data fetching fails", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: userId } } as any);
    vi.mocked(getAnalyticsData).mockRejectedValue(new Error("DB error"));

    const req = createRequest("http://localhost/api/analytics?range=all");
    const response = await GET(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to fetch analytics data");
  });
});
