"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from 'next-intl';
import { Link } from "@/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  History,
  Settings,
  LogOut,
  Plus,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", translationKey: "dashboard", icon: LayoutDashboard },
  { href: "/history", translationKey: "history", icon: History },
  { href: "/settings", translationKey: "settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations('Navbar');

  // Don't show navbar on landing or auth pages (adjusting for locale prefix)
  const isAuthPage = pathname.includes("/auth");
  const isLandingPage = pathname === "/en" || pathname === "/es" || pathname === "/";
  
  if (!session || isLandingPage || isAuthPage) {
    return null;
  }

  const isActive = (href: string) => {
    // pathname includes the locale prefix, e.g. /en/dashboard
    // we need to check if it ends with or contains the href
    return pathname.endsWith(href) || pathname.includes(href + "/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-lg font-bold">
            Dev<span className="text-blue-500">Prep</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                isActive(item.href)
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.translationKey)}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          
          <Link
            href="/session/new"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium transition hover:bg-blue-500 ml-2"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Session</span>
          </Link>

          {/* User avatar + logout (desktop) */}
          <div className="hidden items-center gap-2 sm:flex">
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt=""
                width={28}
                height={28}
                className="rounded-full"
              />
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
              title={t('signOut')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 sm:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-800 px-4 pb-4 sm:hidden">
          <div className="mt-2 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                  isActive(item.href)
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.translationKey)}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-800/50 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              {t('signOut')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
