"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import Image from "next/image";
import { Terminal, Code, Bolt, ArrowRight } from "lucide-react";
import { PublicNavbar } from "./PublicNavbar";
import { Footer } from "./Footer";

export function LandingPage() {
  const t = useTranslations("HomePage");

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary selection:text-on-primary">
      <PublicNavbar />
      
      <main className="relative">
        {/* Hero Section */}
        <section className="px-6 pb-12 pt-24 overflow-hidden">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="font-headline mb-6 text-5xl font-black leading-[1.1] tracking-tight text-90 md:text-7xl">
              {t("title")}
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg font-medium text-60 md:text-xl">
              {t("subtitle")}
            </p>
            
            <div className="mb-20 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/signin"
                className="rounded-xl bg-primary-container px-8 py-4 text-lg font-bold text-white shadow-glow transition-all hover:bg-primary-container/80 hover:-translate-y-1 active:scale-95"
              >
                {t("getStarted")}
              </Link>
              <button className="rounded-xl border border-white/10 px-8 py-4 text-lg font-bold text-white/90 transition-all hover:bg-surface-container">
                {t("viewDemo")}
              </button>
            </div>

            {/* Floating Terminal Visualization */}
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/20 to-primary-container/20 opacity-30 blur transition duration-1000 group-hover:opacity-50"></div>
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-surface-container-lowest shadow-2xl">
                <div className="flex items-center gap-1.5 border-b border-white/5 bg-surface-container-low px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-error/40"></div>
                  <div className="h-3 w-3 rounded-full bg-primary/40"></div>
                  <div className="h-3 w-3 rounded-full bg-surface-variant"></div>
                  <div className="ml-4 font-mono text-[10px] uppercase tracking-widest text-50">
                    devprep_simulator — main.py
                  </div>
                </div>
                <div className="overflow-x-auto p-6 text-left font-mono text-sm leading-relaxed">
                  <div className="flex gap-4">
                    <span className="select-none text-50">01</span>
                    <span>
                      <span className="text-primary">class</span>{" "}
                      <span className="text-white">InterviewEngine</span>:
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="select-none text-50">02</span>
                    <span className="pl-4">
                      <span className="text-primary">def</span>{" "}
                      <span className="text-secondary">analyze_complexity</span>(self, code):
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="select-none text-50">03</span>
                    <span className="pl-8 text-50">
                      # Initiating O(n) validation via AI module
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="select-none text-50">04</span>
                    <span className="pl-8">
                      <span className="text-primary">return</span>{" "}
                      <span className="text-tertiary">&quot;Optimal solution detected&quot;</span>
                    </span>
                  </div>
                  <div className="mt-4 flex gap-4">
                    <span className="select-none text-50">05</span>
                    <span className="text-primary">system.execute</span>(
                    <span className="text-white">mock_interview</span>)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-16">
            <h2 className="font-headline mb-4 text-3xl font-bold text-90">
              {t("featuresTitle")}
            </h2>
            <div className="h-1 w-12 bg-primary"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <div className="group flex flex-col justify-between rounded-xl border border-white/10 bg-[#141414] p-8 transition-colors hover:border-primary/30">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container transition-colors group-hover:bg-primary-container">
                  <Terminal className="h-6 w-6 text-primary group-hover:text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{t("feature1Title")}</h3>
                <p className="mb-6 text-sm leading-relaxed text-60">
                  {t("feature1Desc")}
                </p>
              </div>
              <div className="border-t border-white/5 pt-4 font-mono text-[10px] uppercase tracking-widest text-primary/40">
                {t("feature1Module")}
              </div>
            </div>

            {/* Card 2 */}
            <div className="group flex flex-col justify-between rounded-xl border border-white/10 bg-[#141414] p-8 transition-colors hover:border-primary/30">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container transition-colors group-hover:bg-primary-container">
                  <Code className="h-6 w-6 text-primary group-hover:text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{t("feature2Title")}</h3>
                <p className="mb-6 text-sm leading-relaxed text-60">
                  {t("feature2Desc")}
                </p>
              </div>
              <div className="border-t border-white/5 pt-4 font-mono text-[10px] uppercase tracking-widest text-primary/40">
                {t("feature2Module")}
              </div>
            </div>

            {/* Card 3 */}
            <div className="group flex flex-col justify-between rounded-xl border border-white/10 bg-[#141414] p-8 transition-colors hover:border-primary/30">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container transition-colors group-hover:bg-primary-container">
                  <Bolt className="h-6 w-6 text-primary group-hover:text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{t("feature3Title")}</h3>
                <p className="mb-6 text-sm leading-relaxed text-60">
                  {t("feature3Desc")}
                </p>
              </div>
              <div className="border-t border-white/5 pt-4 font-mono text-[10px] uppercase tracking-widest text-primary/40">
                {t("feature3Module")}
              </div>
            </div>
          </div>
        </section>

        {/* Detail/Bento Row 2 (Asymmetry) */}
        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#141414] md:col-span-3">
              <Image 
                className="absolute inset-0 h-full w-full object-cover opacity-20 grayscale transition-transform duration-700 group-hover:scale-105"
                src="/staff_architecture_bento.png"
                alt="Architecture Illustration"
                fill
              />
              <div className="relative flex h-full min-h-[400px] flex-col justify-end p-12">
                <div className="mb-4 w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[10px] text-primary">
                  FEATURED_METHODOLOGY
                </div>
                <h3 className="mb-4 text-3xl font-black text-white">{t("archTitle")}</h3>
                <p className="mb-8 max-w-lg text-60">
                  {t("archDesc")}
                </p>
                <button className="flex items-center gap-2 font-bold text-primary transition-all hover:gap-4">
                  {t("archCTA")} <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex flex-col justify-center rounded-xl border border-white/10 bg-[#141414] p-8 text-center md:col-span-2">
              <div className="mb-2 font-mono text-5xl font-black text-white">{t("statsValue")}</div>
              <div className="mb-6 font-mono text-xs uppercase tracking-tighter text-primary">
                {t("statsLabel")}
              </div>
              <p className="text-sm text-60">
                {t("statsDesc")}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
