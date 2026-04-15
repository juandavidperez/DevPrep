"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/navigation";
import Image from "next/image";
import { Terminal, Code, Bolt, ArrowRight, Zap } from "lucide-react";
import { PublicNavbar } from "./PublicNavbar";
import { Footer } from "./Footer";

interface SampleQuestion {
  id: string;
  category: string;
  difficulty: string;
  questionText: string;
  tags: string[];
}

interface LandingPageProps {
  stats: { questionCount: number; sessionCount: number };
  sampleQuestions: SampleQuestion[];
}

const CATEGORY_COLOR: Record<string, string> = {
  technical: "text-blue-400",
  coding: "text-emerald-400",
  system_design: "text-violet-400",
  behavioral: "text-amber-400",
};

const CATEGORY_LABEL: Record<string, string> = {
  technical: "Technical",
  coding: "Coding",
  system_design: "System Design",
  behavioral: "Behavioral",
};

const DIFFICULTY_STYLE: Record<string, string> = {
  junior: "bg-emerald-400/10 text-emerald-400",
  mid: "bg-yellow-400/10 text-yellow-400",
  senior: "bg-red-400/10 text-red-400",
};

function QuestionCard({ q }: { q: SampleQuestion }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#141414] p-5 transition-colors hover:border-primary/20">
      <div className="mb-3 flex items-center justify-between">
        <span className={`font-mono text-[10px] uppercase tracking-widest ${CATEGORY_COLOR[q.category] ?? "text-text-secondary"}`}>
          {CATEGORY_LABEL[q.category] ?? q.category}
        </span>
        <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] capitalize ${DIFFICULTY_STYLE[q.difficulty] ?? "text-text-secondary"}`}>
          {q.difficulty}
        </span>
      </div>
      <p className="line-clamp-3 text-sm leading-relaxed text-text-primary">
        {q.questionText}
      </p>
    </div>
  );
}

export function LandingPage({ stats, sampleQuestions }: LandingPageProps) {
  const t = useTranslations("HomePage");
  const locale = useLocale();
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState(false);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    setDemoError(false);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isDemo: true,
          category: "technical",
          difficulty: "mid",
          totalQuestions: 3,
          language: locale,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      router.push(`/session/${data.sessionId}`);
    } catch {
      setDemoError(true);
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary">
      <PublicNavbar />

      <main className="relative">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pb-12 pt-24">
          {/* Radial glow */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
            <div className="h-[400px] w-[800px] rounded-full bg-primary/8 blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            {/* Social proof badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="font-mono text-xs text-text-secondary">
                {t("socialProof", {
                  questions: stats.questionCount,
                  sessions: stats.sessionCount > 0 ? stats.sessionCount : "0",
                })}
              </span>
            </div>

            <h1 className="font-headline mb-6 text-5xl font-black leading-[1.1] tracking-tight text-90 md:text-7xl">
              {t("title")}
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg font-medium text-60 md:text-xl">
              {t("subtitle")}
            </p>

            <div className="mb-4 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/signin"
                className="rounded-xl bg-primary-container px-8 py-4 text-lg font-bold text-white shadow-glow transition-all hover:-translate-y-1 hover:bg-primary-container/80 active:scale-95"
              >
                {t("getStarted")}
              </Link>
              <button
                onClick={handleTryDemo}
                disabled={demoLoading}
                className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-8 py-4 text-lg font-bold text-primary transition-all hover:bg-primary/10 active:scale-95 disabled:opacity-60"
              >
                <Zap className="h-5 w-5" />
                {demoLoading ? t("demoLoading") : t("tryDemo")}
              </button>
            </div>

            {/* Sub-CTA labels */}
            <div className="mb-12 flex items-center justify-center gap-6">
              {demoError && (
                <span className="text-xs text-red-400">{t("demoError")}</span>
              )}
              {!demoError && (
                <span className="text-xs text-text-secondary">{t("tryDemoSub")}</span>
              )}
            </div>

            {/* Floating Terminal Visualization */}
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/20 to-primary-container/20 opacity-30 blur transition duration-1000 group-hover:opacity-50"></div>
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0e0e0e] shadow-2xl">
                <div className="flex items-center gap-1.5 border-b border-white/5 bg-[#141414] px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-red-500/40"></div>
                  <div className="h-3 w-3 rounded-full bg-primary/40"></div>
                  <div className="h-3 w-3 rounded-full bg-zinc-600/50"></div>
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
                      <span className="text-emerald-400/80">analyze_complexity</span>(self, code):
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
                      <span className="text-amber-400/80">&quot;Optimal solution detected&quot;</span>
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

        {/* Sample Questions */}
        {sampleQuestions.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 py-16">
            <div className="mb-8">
              <h2 className="font-headline mb-2 text-2xl font-bold text-90">
                {t("sampleQuestionsTitle")}
              </h2>
              <p className="text-sm text-text-secondary">{t("sampleQuestionsSubtitle")}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {sampleQuestions.map((q) => (
                <QuestionCard key={q.id} q={q} />
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleTryDemo}
                disabled={demoLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-6 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:opacity-60"
              >
                <Zap className="h-4 w-4" />
                {demoLoading ? t("demoLoading") : t("tryDemo")}
              </button>
              <p className="mt-2 text-xs text-text-secondary">{t("demoLimitNote")}</p>
            </div>
          </section>
        )}

        {/* Features Bento Grid */}
        <section id="features" className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-16">
            <h2 className="font-headline mb-4 text-3xl font-bold text-90">
              {t("featuresTitle")}
            </h2>
            <div className="h-1 w-12 bg-primary"></div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="group flex flex-col justify-between rounded-xl border border-white/10 bg-[#141414] p-8 transition-colors hover:border-primary/30">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container transition-colors group-hover:bg-primary-container">
                  <Terminal className="h-6 w-6 text-primary group-hover:text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{t("feature1Title")}</h3>
                <p className="mb-6 text-sm leading-relaxed text-60">{t("feature1Desc")}</p>
              </div>
              <div className="border-t border-white/5 pt-4 font-mono text-[10px] uppercase tracking-widest text-primary/40">
                {t("feature1Module")}
              </div>
            </div>

            <div className="group flex flex-col justify-between rounded-xl border border-white/10 bg-[#141414] p-8 transition-colors hover:border-primary/30">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container transition-colors group-hover:bg-primary-container">
                  <Code className="h-6 w-6 text-primary group-hover:text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{t("feature2Title")}</h3>
                <p className="mb-6 text-sm leading-relaxed text-60">{t("feature2Desc")}</p>
              </div>
              <div className="border-t border-white/5 pt-4 font-mono text-[10px] uppercase tracking-widest text-primary/40">
                {t("feature2Module")}
              </div>
            </div>

            <div className="group flex flex-col justify-between rounded-xl border border-white/10 bg-[#141414] p-8 transition-colors hover:border-primary/30">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container transition-colors group-hover:bg-primary-container">
                  <Bolt className="h-6 w-6 text-primary group-hover:text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{t("feature3Title")}</h3>
                <p className="mb-6 text-sm leading-relaxed text-60">{t("feature3Desc")}</p>
              </div>
              <div className="border-t border-white/5 pt-4 font-mono text-[10px] uppercase tracking-widest text-primary/40">
                {t("feature3Module")}
              </div>
            </div>
          </div>
        </section>

        {/* Detail/Bento Row 2 (Asymmetry) */}
        <section id="simulators" className="mx-auto max-w-7xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#141414] md:col-span-3">
              <Image
                className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale-[50%] transition-transform duration-700 group-hover:scale-105 group-hover:opacity-40"
                src="/staff_architecture_bento.png"
                alt="Architecture Illustration"
                fill
              />
              <div className="relative flex h-full min-h-[400px] flex-col justify-end p-12">
                <div className="mb-4 w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[10px] text-primary">
                  FEATURED_METHODOLOGY
                </div>
                <h3 className="mb-4 text-3xl font-black text-white">{t("archTitle")}</h3>
                <p className="mb-8 max-w-lg text-60">{t("archDesc")}</p>
                <Link
                  href="/auth/signin"
                  className="flex items-center gap-2 font-bold text-primary transition-all hover:gap-4"
                >
                  {t("archCTA")} <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="relative flex flex-col justify-center overflow-hidden rounded-xl border border-primary/20 bg-[#141414] p-8 text-center md:col-span-2">
              <div className="pointer-events-none absolute inset-0 bg-primary/5" />
              <div className="relative">
                <div className="mb-1 font-mono text-6xl font-black text-white">{t("statsValue")}</div>
                <div className="mb-6 font-mono text-xs uppercase tracking-widest text-primary">
                  {t("statsLabel")}
                </div>
                <div className="mx-auto mb-6 h-px w-12 bg-primary/30" />
                <p className="text-sm leading-relaxed text-60">{t("statsDesc")}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
