import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAnalyticsData } from "@/lib/analytics";
import { AnalyticsClient } from "@/components/analytics/AnalyticsClient";
import { AnalyticsKPIs } from "@/components/analytics/AnalyticsKPIs";
import { AnalyticsSkeleton } from "@/components/analytics/AnalyticsSkeleton";
import { DashboardTopbar } from "@/components/DashboardTopbar";
import { AnalyticsRange } from "@/types/analytics";
import { getTranslations } from "next-intl/server";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { range } = await searchParams;
  const validatedRange = (range as AnalyticsRange) || "10s";
  const t = await getTranslations("Navbar");

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      <DashboardTopbar searchPlaceholder="" />
      
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 md:px-8">
        <Suspense fallback={<AnalyticsSkeleton />}>
          <AnalyticsDataFetcher userId={session.user.id} range={validatedRange} />
        </Suspense>
      </main>
    </div>
  );
}

async function AnalyticsDataFetcher({
  userId,
  range,
}: {
  userId: string;
  range: AnalyticsRange;
}) {
  const data = await getAnalyticsData(userId, range);

  return (
    <AnalyticsClient data={data}>
      <AnalyticsKPIs data={data} />
    </AnalyticsClient>
  );
}
