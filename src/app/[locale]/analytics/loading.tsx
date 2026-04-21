import { AnalyticsSkeleton } from "@/components/analytics/AnalyticsSkeleton";
import { DashboardTopbar } from "@/components/DashboardTopbar";

export default function AnalyticsLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      <DashboardTopbar searchPlaceholder="" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 md:px-8">
        <AnalyticsSkeleton />
      </main>
    </div>
  );
}
