"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { Bell, Plus } from "lucide-react";
import { DashboardSearch } from "./DashboardSearch";
import { useSearchParams } from "next/navigation";

export function DashboardTopbar({ searchPlaceholder }: { searchPlaceholder: string }) {
  const t = useTranslations("Navbar");
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";

  // Build a URL that sets ?tab=X while preserving the ?q= search param
  function tabHref(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    // Reset search when switching tabs so results don't bleed across
    if (tab !== "overview") params.delete("q");
    return `?${params.toString()}`;
  }

  return (
    <div className="flex h-14 items-center justify-between border-b border-border-subtle bg-surface-container/60 px-6 backdrop-blur-lg">
      {/* Left: page title + tabs */}
      <div className="flex items-center gap-6">
        <h2 className="text-base font-bold text-text-primary">{t("dashboard")}</h2>
        <nav className="flex items-center gap-1">
          <Link
            href={tabHref("overview")}
            replace
            className={`relative px-3 py-1 text-sm transition ${
              activeTab === "overview"
                ? "text-text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t("overview")}
          </Link>
          <Link
            href={tabHref("analytics")}
            replace
            className={`relative px-3 py-1 text-sm transition ${
              activeTab === "analytics"
                ? "text-text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t("analytics")}
          </Link>
        </nav>
      </div>

      {/* Right: search + bell + CTA */}
      <div className="flex items-center gap-3">
        <DashboardSearch placeholder={searchPlaceholder} />
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface-container/70 text-text-secondary backdrop-blur-[20px] transition hover:bg-surface-highest hover:text-text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <Link
          href="/session/new"
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-primary/60 bg-primary-container px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-primary-container/80 hover:shadow-glow"
        >
          <Plus className="h-4 w-4" />
          {t("newSession")}
        </Link>
      </div>
    </div>
  );
}
