"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { Bell, Plus } from "lucide-react";
import { DashboardSearch } from "./DashboardSearch";

export function DashboardTopbar({ searchPlaceholder }: { searchPlaceholder: string }) {
  const t = useTranslations("Navbar");

  return (
    <div className="flex h-14 items-center justify-between border-b border-border-subtle bg-surface-container/60 px-6 backdrop-blur-lg">
      {/* Left: page title + tabs */}
      <div className="flex items-center gap-6">
        <h2 className="text-base font-bold text-text-primary">Dashboard</h2>
        <nav className="flex items-center gap-1">
          <button className="relative px-3 py-1 text-sm text-text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary">
            Overview
          </button>
          <button className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary transition">
            Analytics
          </button>
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
