"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import {
  Code,
  BarChart3,
  Globe,
  Timer,
  CheckCircle2,
  ArrowLeft,
  Cpu,
  Terminal,
  Atom,
  Coffee,
  Layers,
  Cloud,
  GitBranch,
  Server,
  Network,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

const TECHNOLOGIES: { id: string; category: string; icon: LucideIcon }[] = [
  { id: "React", category: "technical", icon: Atom },
  { id: "Java", category: "technical", icon: Coffee },
  { id: "Angular", category: "technical", icon: Layers },
  { id: "Python", category: "technical", icon: Code },
  { id: "AWS", category: "technical", icon: Cloud },
  { id: "CI/CD", category: "technical", icon: GitBranch },
  { id: "Node.js", category: "technical", icon: Server },
  { id: "System Design", category: "system_design", icon: Network },
];

const DIFFICULTIES = [
  { id: "junior", label: "Junior", level: "Lvl 1-2" },
  { id: "mid", label: "Mid-Level", level: "Lvl 3-5" },
  { id: "senior", label: "Senior", level: "Lvl 6+" },
];

const LANGUAGES = [
  { id: "es", flag: "🇪🇸", label: "Español" },
  { id: "en", flag: "🇺🇸", label: "Inglés" },
];

const DURATIONS = [
  { minutes: 5, label: "5 min", subKey: "duration5" },
  { minutes: 15, label: "15 min", subKey: "duration15" },
  { minutes: 30, label: "30 min", subKey: "duration30" },
];

// Maps interviewMode → the API category sent to the backend
const MODE_TO_CATEGORY: Record<string, string> = {
  technical:    "technical",
  behavioral:   "behavioral",
  system_design: "system_design",
  live_coding:  "coding",
};

// Estimated minutes to answer one question per category + difficulty
const MINUTES_PER_QUESTION: Record<string, Record<string, number>> = {
  technical:     { junior: 3, mid: 4, senior: 5 },
  coding:        { junior: 6, mid: 8, senior: 10 },
  system_design: { junior: 8, mid: 10, senior: 12 },
  behavioral:    { junior: 2, mid: 3, senior: 3 },
  mixed:         { junior: 4, mid: 5, senior: 6 },
};

const MODALITIES = [
  { value: "text", label: "Text Only", enabled: true },
  { value: "voice", label: "Voice Only", enabled: true },
  { value: "avatar", label: "AI Avatar", enabled: false },
];

const INTERVIEW_MODES = [
  { value: "technical", labelKey: "modeTechnical" },
  { value: "behavioral", labelKey: "modeBehavioral" },
  { value: "system_design", labelKey: "modeSystemDesign" },
  { value: "live_coding", labelKey: "modeLiveCoding" },
];

function calcQuestions(interviewMode: string, difficulty: string, minutes: number): number {
  const category = MODE_TO_CATEGORY[interviewMode] ?? interviewMode;
  const minsPerQ = MINUTES_PER_QUESTION[category]?.[difficulty] ?? 5;
  return Math.max(1, Math.min(15, Math.floor(minutes / minsPerQ)));
}

export function SessionConfigForm() {
  const router = useRouter();
  const t = useTranslations("SessionConfig");
  const [selectedTech, setSelectedTech] = useState(TECHNOLOGIES[0]);
  const [difficulty, setDifficulty] = useState("senior");
  const [language, setLanguage] = useState("es");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [outputModality, setOutputModality] = useState("text");
  const [interviewMode, setInterviewMode] = useState("technical");

  const estimatedQuestions = calcQuestions(interviewMode, difficulty, durationMinutes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: MODE_TO_CATEGORY[interviewMode] ?? interviewMode,
          difficulty,
          totalQuestions: estimatedQuestions,
          language,
          outputModality,
          targetStack: [selectedTech.id.toLowerCase().replace(".", "")]
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create session");
      }

      const { sessionId } = await res.json();
      router.push(`/session/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Top Bar — consistent with DashboardTopbar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border-subtle bg-surface-container/60 px-6 backdrop-blur-lg">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition hover:bg-surface-highest hover:text-text-primary"
            title={t("cancel")}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-base font-bold text-text-primary">{t("title")}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-bold text-primary">{estimatedQuestions}</span>
          <span className="text-[10px] uppercase tracking-wider text-text-secondary">{t("questionsUnit")}</span>
        </div>
      </div>

      <div className="p-8 md:p-12 max-w-6xl w-full mx-auto flex-1 h-full">
        {/* Subtitle */}
        <div className="mb-10">
          <p className="text-text-secondary text-base max-w-2xl font-medium leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Bento Grid Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-32">
          
          {/* Card 1: Technical Area */}
          <div className="md:col-span-7 bg-surface-container p-7 rounded-xl ghost-border flex flex-col group hover:bg-surface-highest transition-colors duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{t("techArea")}</h3>
                <p className="text-xs text-white/40 font-mono uppercase tracking-tighter font-bold">{t("techAreaSub")}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {TECHNOLOGIES.map((tech) => {
                const Icon = tech.icon;
                return (
                  <button
                    key={tech.id}
                    type="button"
                    onClick={() => setSelectedTech(tech)}
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2 rounded-full ghost-border font-mono text-sm transition-all",
                      selectedTech.id === tech.id
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tech.id}
                  </button>
                );
              })}
            </div>
            <div className="mt-auto">
              <p className="text-xs text-text-secondary leading-relaxed opacity-60 font-medium italic">
                {t("techAreaDesc")}
              </p>
            </div>
          </div>

          {/* Card 2: Difficulty Level */}
          <div className="md:col-span-5 bg-surface-container p-7 rounded-xl ghost-border flex flex-col group hover:bg-surface-highest transition-colors duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{t("difficultyLevel")}</h3>
                <p className="text-xs text-white/40 font-mono uppercase tracking-tighter font-bold">{t("difficultyLevelSub")}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-8">
              {DIFFICULTIES.map(({ id, label, level }) => (
                <div
                  key={id}
                  onClick={() => setDifficulty(id)}
                  className={clsx(
                    "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                    difficulty === id
                      ? "bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(210,187,255,0.1)]"
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                >
                  <span className={clsx(
                    "text-sm font-medium",
                    difficulty === id ? "text-primary font-bold" : "text-white/70"
                  )}>
                    {label}
                  </span>
                  {difficulty === id ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <span className="text-[10px] text-white/30 font-mono">{level}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-auto">
              <p className="text-xs text-text-secondary leading-relaxed opacity-60 font-medium italic">
                {t("difficultyDesc")}
              </p>
            </div>
          </div>

          {/* Card 3: Language */}
          <div className="md:col-span-5 bg-surface-container p-7 rounded-xl ghost-border flex flex-col group hover:bg-surface-highest transition-colors duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{t("language")}</h3>
                <p className="text-xs text-white/40 font-mono uppercase tracking-tighter font-bold">{t("languageSub")}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {LANGUAGES.map((lang) => (
                <div
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={clsx(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer",
                    language === lang.id
                      ? "bg-primary/10 border-primary/30"
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className={clsx(
                    "text-[10px] uppercase tracking-wider",
                    language === lang.id ? "font-bold text-white" : "font-medium text-white/50"
                  )}>
                    {lang.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-auto">
              <p className="text-xs text-text-secondary leading-relaxed opacity-60 font-medium italic">
                {t("languageDesc")}
              </p>
            </div>
          </div>

          {/* Card 4: Session Duration */}
          <div className="md:col-span-7 bg-surface-container p-7 rounded-xl ghost-border flex flex-col group hover:bg-surface-highest transition-colors duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Timer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{t("sessionDuration")}</h3>
                <p className="text-xs text-white/40 font-mono uppercase tracking-tighter font-bold">{t("sessionDurationSub")}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {DURATIONS.map(({ minutes, label, subKey }) => (
                <div
                  key={minutes}
                  onClick={() => setDurationMinutes(minutes)}
                  className={clsx(
                    "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                    durationMinutes === minutes
                      ? "bg-primary-container/20 border-primary/50 shadow-[0_10px_30px_rgba(124,58,237,0.15)]"
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={clsx(
                      "font-mono text-sm font-bold",
                      durationMinutes === minutes ? "text-primary" : "text-white/70"
                    )}>
                      {label}
                    </span>
                    <span className="text-xs text-white/30">{t(subKey)}</span>
                  </div>
                  {durationMinutes === minutes ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <span className="font-mono text-[10px] text-white/20">
                      ~{calcQuestions(selectedTech.category, difficulty, minutes)}q
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-auto">
              <p className="text-xs text-text-secondary leading-relaxed opacity-60 font-medium italic">
                {t("durationEstimate")}
              </p>
            </div>
          </div>

          {/* Card 5: Interview Engine */}
          <div className="md:col-span-5 bg-surface-container p-7 rounded-xl ghost-border flex flex-col group hover:bg-surface-highest transition-colors duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{t("engineTitle")}</h3>
                <p className="text-xs text-white/40 font-mono uppercase tracking-tighter font-bold">{t("engineSub")}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-6">
              {MODALITIES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  disabled={!m.enabled}
                  onClick={() => m.enabled && setOutputModality(m.value)}
                  className={clsx(
                    "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                    !m.enabled
                      ? "bg-white/[0.02] border-white/5 cursor-not-allowed opacity-40"
                      : outputModality === m.value
                        ? "bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(210,187,255,0.1)]"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                >
                  <span className={clsx(
                    "text-sm font-medium",
                    !m.enabled
                      ? "text-white/40"
                      : outputModality === m.value ? "text-primary font-bold" : "text-white/70"
                  )}>
                    {m.label}
                  </span>
                  {!m.enabled ? (
                    <span className="text-[9px] font-mono uppercase tracking-wider text-white/30">{t("comingSoon")}</span>
                  ) : outputModality === m.value ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : null}
                </button>
              ))}
            </div>
            <div className="mt-auto">
              <p className="text-xs text-text-secondary leading-relaxed opacity-60 font-medium italic">
                {t("engineSub")}
              </p>
            </div>
          </div>

          {/* Card 6: Interview Mode */}
          <div className="md:col-span-7 bg-surface-container p-7 rounded-xl ghost-border flex flex-col group hover:bg-surface-highest transition-colors duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{t("modesTitle")}</h3>
                <p className="text-xs text-white/40 font-mono uppercase tracking-tighter font-bold">{t("modesSub")}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {INTERVIEW_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setInterviewMode(mode.value)}
                  className={clsx(
                    "p-4 rounded-xl border transition-all flex flex-col items-start gap-2 text-left relative overflow-hidden",
                    interviewMode === mode.value
                      ? "bg-primary/15 border-primary/50 shadow-[0_0_20px_rgba(210,187,255,0.1)]"
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                >
                  <span className={clsx(
                    "text-[10px] font-mono uppercase tracking-widest",
                    interviewMode === mode.value ? "text-primary/60" : "text-white/30"
                  )}>{t("modeLabel")}</span>
                  <span className={clsx(
                    "text-sm font-bold",
                    interviewMode === mode.value ? "text-primary" : "text-white/70"
                  )}>
                    {t(mode.labelKey)}
                  </span>
                  {interviewMode === mode.value && (
                    <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-auto">
              <p className="text-xs text-text-secondary leading-relaxed opacity-60 font-medium italic">
                {t("modeDesc")}
              </p>
            </div>
          </div>

        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 font-bold">
            {error}
          </div>
        )}
      </div>

      {/* Action Bar (Bottom Footer) — sticky instead of fixed to respect sidebar width */}
      <footer className="sticky bottom-0 h-20 bg-surface-container/90 backdrop-blur-2xl border-t border-border-subtle px-8 md:px-12 flex items-center justify-between z-30">
        {/* Config summary */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-text-secondary">
          <span className="rounded-md bg-white/5 px-2.5 py-1 font-mono font-semibold text-text-primary">{selectedTech.id}</span>
          <span className="text-white/20">/</span>
          <span className="rounded-md bg-white/5 px-2.5 py-1 capitalize">{difficulty}</span>
          <span className="text-white/20">/</span>
          <span className="rounded-md bg-white/5 px-2.5 py-1">{LANGUAGES.find(l => l.id === language)?.flag} {language.toUpperCase()}</span>
          <span className="text-white/20">/</span>
          <span className="rounded-md bg-white/5 px-2.5 py-1 font-mono">{durationMinutes}m</span>
          <span className="text-white/20">/</span>
          <span className="rounded-md bg-white/5 px-2.5 py-1 capitalize">{interviewMode.replace("_", " ")}</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-primary-container text-white px-10 py-3.5 rounded-lg font-bold text-sm tracking-tight flex items-center gap-3 hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group disabled:opacity-50"
        >
          <span className="relative z-10">
            {isSubmitting ? t("startingButton") : t("startInterview")}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </button>
      </footer>
    </div>
  );
}
