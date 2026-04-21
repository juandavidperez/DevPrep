import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAnalyticsData } from "@/lib/analytics";
import { AnalyticsRange, VALID_RANGES } from "@/types/analytics";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") as AnalyticsRange | null;

  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Validation
  if (!range || !VALID_RANGES.includes(range)) {
    return NextResponse.json(
      { error: `Invalid range. Must be one of: ${VALID_RANGES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const data = await getAnalyticsData(session.user.id, range);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[ANALYTICS_API_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
