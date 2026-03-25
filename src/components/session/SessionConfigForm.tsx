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
  HelpCircle,
  Bell,
  Eye,
  EyeOff,
  Terminal,
} from "lucide-react";
import { clsx } from "clsx";

const TECHNOLOGIES = [
  { id: "React", category: "technical" },
  { id: "Java", category: "technical" },
  { id: "Angular", category: "technical" },
  { id: "Python", category: "technical" },
  { id: "AWS", category: "technical" },
  { id: "CI/CD", category: "technical" },
  { id: "Node.js", category: "technical" },
  { id: "System Design", category: "system_design" },
];

const DIFFICULTIES = [
  { id: "junior", label: "Junior", level: "Lvl 1-2" },
  { id: "mid", label: "Mid-Level", level: "Lvl 3-5" },
  { id: "senior", label: "Senior", level: "Lvl 6+" },
];

const LANGUAGES = [
  { id: "es", flag: "🇪🇸", label: "Español" },
  { id: "en", flag: "🇺🇸", label: "Inglés" },
  { id: "pt", flag: "🇧🇷", label: "Portugués" },
];

const DURATIONS = [
  { minutes: 5, label: "5 min", sub: "Quick warm-up" },
  { minutes: 15, label: "15 min", sub: "Standard session" },
  { minutes: 30, label: "30 min", sub: "Deep dive" },
];

// Estimated minutes to answer one question per category + difficulty
const MINUTES_PER_QUESTION: Record<string, Record<string, number>> = {
  technical:     { junior: 3, mid: 4, senior: 5 },
  coding:        { junior: 6, mid: 8, senior: 10 },
  system_design: { junior: 8, mid: 10, senior: 12 },
  behavioral:    { junior: 2, mid: 3, senior: 3 },
  mixed:         { junior: 4, mid: 5, senior: 6 },
};

function calcQuestions(category: string, difficulty: string, minutes: number): number {
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
  const [feedbackMode, setFeedbackMode] = useState("live");

  const estimatedQuestions = calcQuestions(selectedTech.category, difficulty, durationMinutes);
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
          category: selectedTech.category,
          difficulty,
          totalQuestions: estimatedQuestions,
          language,
          feedbackMode,
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
    <div className="flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="flex justify-between items-center px-8 h-16 w-full border-b border-white/10 backdrop-blur-xl sticky top-0 z-50 bg-[#131313]/80">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="font-['Inter'] text-sm font-medium tracking-tight text-white/50">
            Sesión &gt; Configuración
          </span>
        </div>
        <div className="flex items-center gap-4 text-white/50">
          <HelpCircle className="h-5 w-5 hover:text-white cursor-pointer transition-colors" />
          <Bell className="h-5 w-5 hover:text-white cursor-pointer transition-colors" />
        </div>
      </header>

      <div className="p-8 md:p-12 max-w-6xl w-full mx-auto flex-1 h-full">
        {/* Content Title */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-white/90 tracking-tight font-headline mb-3">
            {t("title")}
          </h2>
          <p className="text-on-surface-variant text-base max-w-2xl font-medium leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Bento Grid Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-32">
          
          {/* Card 1: Technical Area */}
          <div className="md:col-span-7 bg-surface-container p-7 rounded-xl ghost-border flex flex-col group hover:bg-surface-container-high transition-colors duration-300">
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
              {TECHNOLOGIES.map((tech) => (
                <button
                  key={tech.id}
                  type="button"
                  onClick={() => setSelectedTech(tech)}
                  className={clsx(
                    "px-4 py-2 rounded-full ghost-border font-mono text-sm transition-all",
                    selectedTech.id === tech.id 
                      ? "bg-primary/20 text-primary border-primary/30" 
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  )}
                >
                  {tech.id}
                </button>
              ))}
            </div>
            <div className="mt-auto">
              <p className="text-xs text-on-surface-variant leading-relaxed opacity-60 font-medium italic">
                {t("techAreaDesc")}
              </p>
            </div>
          </div>

          {/* Card 2: Difficulty Level */}
          <div className="md:col-span-5 bg-surface-container p-7 rounded-xl ghost-border flex flex-col group hover:bg-surface-container-high transition-colors duration-300">
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
              <p className="text-xs text-on-surface-variant leading-relaxed opacity-60 font-medium italic">
                {t("difficultyDesc")}
              </p>
            </div>
          </div>

          {/* Card 3: Language */}
          <div className="md:col-span-5 bg-surface-container p-7 rounded-xl ghost-border flex flex-col group hover:bg-surface-container-high transition-colors duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{t("language")}</h3>
                <p className="text-xs text-white/40 font-mono uppercase tracking-tighter font-bold">{t("languageSub")}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
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
              <p className="text-xs text-on-surface-variant leading-relaxed opacity-60 font-medium italic">
                {t("languageDesc")}
              </p>
            </div>
          </div>

          {/* Card 4: Session Duration */}
          <div className="md:col-span-7 bg-surface-container p-7 rounded-xl ghost-border flex flex-col group hover:bg-surface-container-high transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <Timer className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Session Duration</h3>
                  <p className="text-xs text-white/40 font-mono uppercase tracking-tighter font-bold">How long do you have?</p>
                </div>
              </div>
              {/* Live estimate badge */}
              <div className="flex flex-col items-end">
                <span className="font-mono text-2xl font-bold text-primary">{estimatedQuestions}</span>
                <span className="text-[10px] text-white/40 uppercase tracking-wider">questions</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {DURATIONS.map(({ minutes, label, sub }) => (
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
                    <span className="text-xs text-white/30">{sub}</span>
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
              <p className="text-xs text-white/30 leading-relaxed italic">
                Estimated based on category and difficulty. Actual time may vary.
              </p>
            </div>
          </div>

          {/* Card 5: Feedback Mode */}
          <div className="md:col-span-12 bg-surface-container p-7 rounded-xl ghost-border flex flex-col group hover:bg-surface-container-high transition-colors duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Feedback Mode</h3>
                <p className="text-xs text-white/40 font-mono uppercase tracking-tighter font-bold">When do you see your score?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div
                onClick={() => setFeedbackMode("live")}
                className={clsx(
                  "flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                  feedbackMode === "live"
                    ? "bg-primary-container/20 border-primary/50 shadow-[0_10px_30px_rgba(124,58,237,0.15)]"
                    : "bg-white/5 border-white/10 hover:border-primary/40"
                )}
              >
                <div className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  feedbackMode === "live" ? "bg-primary/20" : "bg-white/5"
                )}>
                  <Eye className={clsx("h-5 w-5", feedbackMode === "live" ? "text-primary" : "text-white/40")} />
                </div>
                <div>
                  <span className="block text-sm font-bold text-white mb-1">Live Feedback</span>
                  <span className="block text-[11px] text-white/50 leading-relaxed">See your score and evaluation after each answer. Best for learning and active practice.</span>
                </div>
                {feedbackMode === "live" && <CheckCircle2 className="h-4 w-4 text-primary ml-auto shrink-0 mt-0.5" />}
              </div>

              <div
                onClick={() => setFeedbackMode("silent")}
                className={clsx(
                  "flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                  feedbackMode === "silent"
                    ? "bg-primary-container/20 border-primary/50 shadow-[0_10px_30px_rgba(124,58,237,0.15)]"
                    : "bg-white/5 border-white/10 hover:border-primary/40"
                )}
              >
                <div className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  feedbackMode === "silent" ? "bg-primary/20" : "bg-white/5"
                )}>
                  <EyeOff className={clsx("h-5 w-5", feedbackMode === "silent" ? "text-primary" : "text-white/40")} />
                </div>
                <div>
                  <span className="block text-sm font-bold text-white mb-1">Silent Exam</span>
                  <span className={clsx("block text-[11px] leading-relaxed", feedbackMode === "silent" ? "text-primary/70" : "text-white/50")}>Answer all questions first, then see results at the end. Simulates a real exam environment.</span>
                </div>
                {feedbackMode === "silent" && <CheckCircle2 className="h-4 w-4 text-primary ml-auto shrink-0 mt-0.5" />}
              </div>
            </div>
          </div>

        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 font-bold">
            {error}
          </div>
        )}
      </div>

      {/* Action Bar (Bottom Footer) */}
      <footer className="fixed bottom-0 right-0 left-0 h-24 bg-[#131313]/90 backdrop-blur-2xl border-t border-white/5 px-8 md:px-12 flex items-center justify-between z-50">
        <button 
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-all group font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          {t("cancel")}
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-primary-container text-white px-10 py-4 rounded-lg font-bold text-sm tracking-tight flex items-center gap-3 hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group disabled:opacity-50"
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
