"use client";

import { useTranslations } from "next-intl";
import { Terminal, Cpu } from "lucide-react";

export function Footer() {
  const t = useTranslations("HomePage");

  return (
    <footer className="w-full border-t border-white/5 bg-[#0e0e0e] py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-8 md:flex-row">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="text-lg font-black text-white">DevPrep</div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
            {t("copyright")}
          </p>
        </div>

        <div className="flex gap-8 font-mono text-[10px] uppercase tracking-widest">
          <a href="#features" className="text-white/40 transition-colors hover:text-[#d2bbff]">
            Features
          </a>
          <a href="#simulators" className="text-white/40 transition-colors hover:text-[#d2bbff]">
            Simulators
          </a>
          <a href="#" className="text-white/40 transition-colors hover:text-[#d2bbff]">
            Privacy
          </a>
        </div>

        <div className="flex gap-4">
          <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/5 opacity-80 transition-opacity hover:opacity-100">
            <Terminal className="h-4 w-4 text-white/40" />
          </div>
          <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/5 opacity-80 transition-opacity hover:opacity-100">
            <Cpu className="h-4 w-4 text-white/40" />
          </div>
        </div>
      </div>
    </footer>
  );
}
