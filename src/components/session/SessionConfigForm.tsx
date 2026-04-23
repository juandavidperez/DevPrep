"use client";

import { useState, useRef, useEffect } from "react";
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
  Braces,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { MINUTES_PER_QUESTION } from "@/lib/questions/constants";

type TechItem = { id: string; category: string; icon: LucideIcon };

const TECHNOLOGIES: TechItem[] = [
  { id: "React", category: "technical", icon: Atom },
  { id: "Angular", category: "technical", icon: Layers },
  { id: "Java", category: "technical", icon: Coffee },
  { id: "JavaScript", category: "technical", icon: Braces },
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

const MODE_TO_CATEGORY: Record<string, string> = {
  technical:    "technical",
  behavioral:   "behavioral",
  system_design: "system_design",
  live_coding:  "coding",
  mixed:        "mixed",
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
  { value: "mixed", labelKey: "modeMixed" },
];

interface RoadmapConfig {
  tech: string | null;
  interviewMode: string;
  difficulty: string;
  language: string;
  durationMinutes: number;
  questionCountOverride?: number;
  feedbackMode?: string;
  timerEnabled?: boolean;
}

const ROADMAPS: {
  id: string;
  emoji: string;
  labelKey: string;
  tagKey: string;
  color: string;
  config: RoadmapConfig;
}[] = [
  {
    id: "angular",
    emoji: "⚡",
    labelKey: "roadmapAngularLabel",
    tagKey: "roadmapAngularTag",
    color: "from-[#DD0031]/10 to-transparent",
    config: { tech: "Angular", interviewMode: "technical", difficulty: "mid", language: "es", durationMinutes: 15 },
  },
  {
    id: "spring",
    emoji: "☕",
    labelKey: "roadmapSpringLabel",
    tagKey: "roadmapSpringTag",
    color: "from-[#6DB33F]/10 to-transparent",
    config: { tech: "Java", interviewMode: "technical", difficulty: "mid", language: "es", durationMinutes: 15 },
  },
  {
    id: "patterns",
    emoji: "🔷",
    labelKey: "roadmapPatternsLabel",
    tagKey: "roadmapPatternsTag",
    color: "from-[#007ACC]/10 to-transparent",
    config: { tech: "System Design", interviewMode: "system_design", difficulty: "mid", language: "es", durationMinutes: 30 },
  },
  {
    id: "algorithms",
    emoji: "🧮",
    labelKey: "roadmapAlgorithmsLabel",
    tagKey: "roadmapAlgorithmsTag",
    color: "from-[#F7DF1E]/10 to-transparent",
    config: { tech: "JavaScript", interviewMode: "live_coding", difficulty: "mid", language: "es", durationMinutes: 30 },
  },
  {
    id: "friday",
    emoji: "🎯",
    labelKey: "roadmapFridayLabel",
    tagKey: "roadmapFridayTag",
    color: "from-[#7C3AED]/10 to-transparent",
    config: { tech: null, interviewMode: "mixed", difficulty: "mid", language: "en", durationMinutes: 30, questionCountOverride: 10, feedbackMode: "silent", timerEnabled: true },
  },
];


function calcQuestions(interviewMode: string, difficulty: string, minutes: number): number {
  const category = MODE_TO_CATEGORY[interviewMode] ?? interviewMode;
  const minsPerQ = MINUTES_PER_QUESTION[category]?.[difficulty] ?? 5;
  return Math.max(1, Math.min(15, Math.floor(minutes / minsPerQ)));
}

interface SessionConfigFormProps {
  settings?: {
    defaultDifficulty?: string;
    questionLanguage?: string;
    outputModality?: string;
    targetStack?: string[];
  } | null;
}

export function SessionConfigForm({ settings }: SessionConfigFormProps) {
  const router = useRouter();
  const t = useTranslations("SessionConfig");

  const initialTech = settings?.targetStack?.length
    ? TECHNOLOGIES.find((t) =>
        settings.targetStack?.some((s) => s.toLowerCase() === t.id.toLowerCase())
      ) || TECHNOLOGIES[0]
    : TECHNOLOGIES[0];

  const [selectedTech, setSelectedTech] = useState<TechItem | null>(initialTech);
  const [difficulty, setDifficulty] = useState(settings?.defaultDifficulty || "mid");
  const [language, setLanguage] = useState(settings?.questionLanguage || "es");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [outputModality, setOutputModality] = useState("text"); // Hard-default to text as per user request
  const [interviewMode, setInterviewMode] = useState("technical");
  const [activeRoadmap, setActiveRoadmap] = useState<string | null>(null);
  const [questionCountOverride, setQuestionCountOverride] = useState<number | null>(null);
  const [feedbackMode, setFeedbackMode] = useState("live");
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scroll discovery logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      // Check initially after render
      checkScroll();
      // Also check on resize
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const estimatedQuestions = questionCountOverride ?? calcQuestions(interviewMode, difficulty, durationMinutes);

  const applyRoadmap = (roadmap: typeof ROADMAPS[number]) => {
    const { tech, interviewMode: mode, difficulty: diff, language: lang, durationMinutes: dur, questionCountOverride: qOverride } = roadmap.config;
    setSelectedTech(tech ? TECHNOLOGIES.find((t) => t.id === tech) ?? null : null);
    setInterviewMode(mode);
    setDifficulty(diff);
    setLanguage(lang);
    setDurationMinutes(dur);
    setActiveRoadmap(roadmap.id);
    setQuestionCountOverride(qOverride ?? null);
    if (roadmap.config.feedbackMode) setFeedbackMode(roadmap.config.feedbackMode);
    if (roadmap.config.timerEnabled !== undefined) setTimerEnabled(roadmap.config.timerEnabled);
  };

  const clearRoadmap = () => {
    setActiveRoadmap(null);
    setQuestionCountOverride(null);
  };

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
          feedbackMode,
          timerEnabled,
          targetStack: selectedTech ? [selectedTech.id.toLowerCase().replace(".", "")] : [],
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
        <div className="mb-8">
          <p className="text-text-secondary text-base max-w-2xl font-medium leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Roadmap Quick-Start */}
        <div className="mb-12 relative group/roadmaps">
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">
              {t("roadmapLabel")}
            </p>
            <div className="flex gap-2 opacity-0 group-hover/roadmaps:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className={clsx(
                  "flex h-6 w-6 items-center justify-center rounded-full bg-surface-highest border border-white/10 text-text-secondary transition hover:text-white disabled:opacity-30",
                )}
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className={clsx(
                  "flex h-6 w-6 items-center justify-center rounded-full bg-surface-highest border border-white/10 text-text-secondary transition hover:text-white disabled:opacity-30",
                )}
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
          
          <div className="relative">
            {/* Left Fade & Button */}
            <div 
              className={clsx(
                "absolute left-0 top-0 bottom-4 w-20 bg-gradient-to-r from-background via-background/90 to-transparent z-20 pointer-events-none transition-opacity duration-300 flex items-center justify-start pl-2",
                canScrollLeft ? "opacity-100" : "opacity-0"
              )}
            >
              <button 
                onClick={() => scroll("left")}
                className="pointer-events-auto h-12 w-12 rounded-full bg-surface-highest/90 border border-white/20 flex items-center justify-center text-white shadow-2xl hover:bg-primary hover:text-[#25005a] transition-all scale-110"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            </div>

            {/* Right Fade & Button */}
            <div 
              className={clsx(
                "absolute right-0 top-0 bottom-4 w-24 bg-gradient-to-l from-background via-background/90 to-transparent z-20 pointer-events-none transition-opacity duration-300 flex items-center justify-end pr-2",
                canScrollRight ? "opacity-100" : "opacity-0"
              )}
            >
              <button 
                onClick={() => scroll("right")}
                className="pointer-events-auto h-12 w-12 rounded-full bg-surface-highest/90 border border-white/20 flex items-center justify-center text-white shadow-2xl hover:bg-primary hover:text-[#25005a] transition-all scale-110"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
            
            <div 
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4 mask-fade-right"
              onLoad={checkScroll} // Just in case
            >
              {ROADMAPS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => applyRoadmap(r)}
                  className={clsx(
                    "flex-none flex flex-col gap-1.5 px-5 py-4 rounded-xl border transition-all text-left min-w-[210px] relative overflow-hidden group/roadmap",
                    activeRoadmap === r.id
                      ? "bg-surface-highest border-primary/50 shadow-[0_0_25px_rgba(210,187,255,0.12)] -translate-y-1"
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 hover:-translate-y-0.5"
                  )}
                >
                  {/* Visual Accent Gradient */}
                  <div className={clsx(
                    "absolute inset-0 bg-gradient-to-br transition-opacity duration-500 pointer-events-none",
                    r.color,
                    activeRoadmap === r.id ? "opacity-100" : "opacity-0 group-hover/roadmap:opacity-60"
                  )}></div>

                  <span className="text-2xl leading-none relative z-10 drop-shadow-sm">{r.emoji}</span>
                  <div className="relative z-10 flex flex-col gap-0.5 mt-1.5">
                    <h4 className={clsx(
                      "text-sm font-black transition-colors line-clamp-1",
                      activeRoadmap === r.id ? "text-primary" : "text-white group-hover/roadmap:text-primary"
                    )}>
                      {t(r.labelKey)}
                    </h4>
                    <span className="text-[10px] font-mono text-white/40 leading-tight uppercase tracking-wider">{t(r.tagKey)}</span>
                  </div>
                </button>
              ))}
              
              {/* Spacer for scroll end */}
              <div className="flex-none w-8"></div>
            </div>
          </div>
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
                    onClick={() => { setSelectedTech(tech); clearRoadmap(); }}
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2 rounded-full ghost-border font-mono text-sm transition-all",
                      selectedTech?.id === tech.id
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
                  onClick={() => { setDifficulty(id); clearRoadmap(); }}
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
                  onClick={() => { setLanguage(lang.id); clearRoadmap(); }}
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
                  onClick={() => { setDurationMinutes(minutes); setQuestionCountOverride(null); clearRoadmap(); }}
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
                      ~{calcQuestions(interviewMode, difficulty, minutes)}q
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

          {/* Card 5.1: Simulation & Timer (New) */}
          <div className="md:col-span-12 bg-surface-container p-7 rounded-xl ghost-border flex flex-col md:flex-row gap-8 group hover:bg-surface-highest transition-colors duration-300">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Modo de Evaluación</h3>
              </div>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => setFeedbackMode(feedbackMode === "silent" ? "live" : "silent")}
                  className={clsx(
                    "flex flex-1 items-center justify-between p-4 rounded-xl border transition-all text-left",
                    feedbackMode === "silent"
                      ? "bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(210,187,255,0.1)]"
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="flex flex-col">
                    <span className={clsx("text-sm font-bold", feedbackMode === "silent" ? "text-primary" : "text-white/70")}>Modo Simulación (Silencioso)</span>
                    <span className="text-[10px] text-white/30">Sin feedback hasta el final de la sesión</span>
                  </div>
                  <div className={clsx("h-5 w-5 rounded-md border flex items-center justify-center transition-all", feedbackMode === "silent" ? "bg-primary border-primary" : "border-white/20")}>
                    {feedbackMode === "silent" && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTimerEnabled(!timerEnabled)}
                  className={clsx(
                    "flex flex-1 items-center justify-between p-4 rounded-xl border transition-all text-left",
                    timerEnabled
                      ? "bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(210,187,255,0.1)]"
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="flex flex-col">
                    <span className={clsx("text-sm font-bold", timerEnabled ? "text-primary" : "text-white/70")}>Timer por Pregunta</span>
                    <span className="text-[10px] text-white/30">Presión de tiempo realista según nivel</span>
                  </div>
                  <div className={clsx("h-5 w-5 rounded-md border flex items-center justify-center transition-all", timerEnabled ? "bg-primary border-primary" : "border-white/20")}>
                    {timerEnabled && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                </button>
              </div>
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
                  onClick={() => { setInterviewMode(mode.value); clearRoadmap(); }}
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

      {/* Action Bar (Bottom Footer) */}
      <footer className="sticky bottom-0 h-20 bg-surface-container/90 backdrop-blur-2xl border-t border-border-subtle px-8 md:px-12 flex items-center justify-between z-30">
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-text-secondary">
          <span className="rounded-md bg-white/5 px-2.5 py-1 font-mono font-semibold text-text-primary">
            {selectedTech?.id ?? "—"}
          </span>
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
