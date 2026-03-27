"use client";

import { Link } from "@/navigation";
import { useTranslations } from "next-intl";

export function PublicNavbar() {
  const t = useTranslations("Navbar");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#131313]/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold tracking-tighter text-[#d2bbff]">
          DevPrep
        </Link>
        
        <div className="hidden items-center gap-8 text-sm font-medium md:flex">
          <a href="#features" className="text-[#d2bbff] transition-colors hover:text-white">
            Features
          </a>
          <a href="#simulators" className="text-white/50 transition-colors hover:text-white">
            Simulators
          </a>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/signin"
            className="rounded-lg border border-white/10 px-4 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-surface-highest active:scale-95"
          >
            {t("signIn")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
