"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Bookmark,
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", translationKey: "dashboard", icon: LayoutDashboard },
  { href: "/history", translationKey: "history", icon: History },
  { href: "/bookmarks", translationKey: "bookmarks", icon: Bookmark },
  { href: "/settings", translationKey: "settings", icon: Settings },
];

const STORAGE_KEY = "sidebar-collapsed";

// ── Shared inner content ───────────────────────────────────────────────────────

function SidebarContent({
  session: userSession,
  t,
  isActive,
  onNavClick,
  collapsed = false,
  onToggle,
}: {
  session: NonNullable<ReturnType<typeof useSession>["data"]>;
  t: ReturnType<typeof useTranslations>;
  isActive: (href: string) => boolean;
  onNavClick?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <>
      {/* Logo + toggle */}
      <div
        className={clsx(
          "flex items-center gap-2 py-6",
          collapsed ? "flex-col px-2" : "px-5"
        )}
      >
        <Link
          href="/dashboard"
          className={clsx(
            "flex min-w-0 items-center overflow-hidden",
            collapsed ? "gap-0" : "gap-3"
          )}
          onClick={onNavClick}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-container shadow-glow">
            <span className="font-mono text-xs font-bold text-white">DP</span>
          </div>
          <div
            className={clsx(
              "overflow-hidden transition-all duration-300 ease-in-out",
              collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
            )}
          >
            <p className="whitespace-nowrap text-sm font-bold leading-none text-text-primary">
              Dev<span className="text-primary">Prep</span>
            </p>
            <p className="mt-0.5 whitespace-nowrap text-[10px] uppercase tracking-widest text-text-secondary">
              {t("workspace")}
            </p>
          </div>
        </Link>

        {onToggle && (
          <button
            onClick={onToggle}
            className={clsx(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-all duration-300 hover:bg-surface-highest hover:text-text-primary",
              collapsed ? "rotate-180" : "ml-auto"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavClick}
            title={collapsed ? t(item.translationKey) : undefined}
            className={clsx(
              "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition",
              collapsed ? "justify-center gap-0 px-0" : "gap-3",
              isActive(item.href)
                ? "bg-surface-highest text-text-primary shadow-[inset_0_0_0_1px_rgba(210,187,255,0.15)]"
                : "text-text-secondary hover:bg-surface-highest/40 hover:text-text-primary"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span
              className={clsx(
                "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
              )}
            >
              {t(item.translationKey)}
            </span>
          </Link>
        ))}
      </nav>

      {/* Bottom: language + logout + profile */}
      <div className="space-y-1 border-t border-border-subtle px-2 py-4">
        {!collapsed && <LanguageSwitcher />}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={clsx(
            "flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-surface-highest/40 hover:text-text-primary",
            collapsed ? "justify-center" : "gap-3"
          )}
          title={t("signOut")}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span
            className={clsx(
              "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
              collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
            )}
          >
            {t("signOut")}
          </span>
        </button>

        <div
          className={clsx(
            "overflow-hidden transition-all duration-300 ease-in-out",
            collapsed ? "max-h-0 opacity-0" : "max-h-24 opacity-100"
          )}
        >
          <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-highest/50 px-3 py-2.5">
            {userSession.user?.image ? (
              <Image
                src={userSession.user.image}
                alt={userSession.user.name ?? ""}
                width={32}
                height={32}
                className="rounded-full ring-1 ring-primary/30"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-text-primary">
                {userSession.user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-text-primary">
                {userSession.user?.name?.split(" ")[0]}
              </p>
              <span className="inline-flex items-center gap-0.5 text-[10px] text-primary">
                ✦ {t("premiumAccount")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useTranslations("Navbar");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  const isAuthPage = pathname.includes("/auth");
  const isLandingPage = pathname === "/en" || pathname === "/es" || pathname === "/";

  if (!session || isLandingPage || isAuthPage) return null;

  const isActive = (href: string) =>
    pathname.endsWith(href) || pathname.includes(href + "/");

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside
        className={clsx(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border-subtle bg-surface-container/80 backdrop-blur-lg transition-[width] duration-300 ease-in-out md:flex",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <SidebarContent
          session={session}
          t={t}
          isActive={isActive}
          collapsed={collapsed}
          onToggle={toggleCollapsed}
        />
      </aside>

      {/* ── Mobile top bar ────────────────────────────────────────────────── */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border-subtle bg-surface-container/90 px-4 backdrop-blur-lg md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-container">
            <span className="font-mono text-[10px] font-bold text-white">DP</span>
          </div>
          <span className="text-sm font-bold">
            Dev<span className="text-primary">Prep</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition hover:bg-surface-highest hover:text-text-primary"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* ── Mobile drawer overlay ─────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="fixed left-0 top-0 z-50 flex h-screen w-56 flex-col border-r border-border-subtle bg-surface-container/95 backdrop-blur-xl md:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition hover:bg-surface-highest hover:text-text-primary"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent
              session={session}
              t={t}
              isActive={isActive}
              onNavClick={() => setMobileOpen(false)}
            />
          </aside>
        </>
      )}
    </>
  );
}
