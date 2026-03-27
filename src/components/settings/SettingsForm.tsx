"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import {
  Save,
  Check,
  User,
  Monitor,
  Cpu,
  Terminal,
  Layers,
  Sparkles,
  Zap
} from "lucide-react";

interface SettingsData {
  uiLanguage: string;
  questionLanguage: string;
  defaultDifficulty: string;
  defaultCategories: string[];
  targetStack: string[];
  outputModality: string;
  voiceSpeed: number;
  animations: boolean;
  darkMode: boolean;
  interviewMode: string;
}

const CATEGORIES = [
  { value: "technical", label: "Technical" },
  { value: "coding", label: "Coding" },
  { value: "system_design", label: "System Design" },
  { value: "behavioral", label: "Behavioral" },
];

const STACK_OPTIONS = [
  { value: "react", label: "React" },
  { value: "next.js", label: "Next.js" },
  { value: "typescript", label: "TypeScript" },
  { value: "node.js", label: "Node.js" },
  { value: "angular", label: "Angular" },
  { value: "vue", label: "Vue" },
  { value: "spring_boot", label: "Spring Boot" },
  { value: "python", label: "Python/Django" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "aws", label: "AWS" },
  { value: "docker", label: "Docker/K8s" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "flutter", label: "Flutter" },
  { value: "swift", label: "Swift/iOS" },
  { value: "kotlin", label: "Kotlin/Android" },
];

const DIFFICULTIES = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
];

const LANGUAGES = [
  { value: "en", label: "EN", flag: "🇺🇸" },
  { value: "es", label: "ES", flag: "🇪🇸" },
];

const MODALITIES = [
  { value: "text", label: "Text Only" },
  { value: "voice", label: "Voice Only" },
  { value: "avatar", label: "AI Avatar" },
];

const INTERVIEW_MODES = [
  { value: "technical", label: "modeTechnical" },
  { value: "behavioral", label: "modeBehavioral" },
  { value: "system_design", label: "modeSystemDesign" },
  { value: "live_coding", label: "modeLiveCoding" },
];

export function SettingsForm({
  initialSettings,
  userName,
  userImage,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialSettings: any;
  userName: string;
  userImage: string | null;
}) {
  const t = useTranslations("Settings");
  const [settings, setSettings] = useState<SettingsData>({
    ...initialSettings,
    animations: initialSettings.animations ?? true,
    darkMode: initialSettings.darkMode ?? true,
    interviewMode: initialSettings.interviewMode ?? "technical",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleArrayItem = (
    field: "defaultCategories" | "targetStack",
    value: string
  ) => {
    setSettings((prev) => {
      const arr = prev[field];
      const next = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value];
      if (next.length === 0) return prev;
      return { ...prev, [field]: next };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative pb-24">
      {/* 1. Profile Card */}
      <div className="md:col-span-4 bg-surface-container/70 rounded-xl border border-border-subtle p-6 flex flex-col items-center text-center group hover:bg-surface-highest/50 transition-all duration-300 shadow-xl">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-surface-highest border-2 border-primary/30 flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(210,187,255,0.1)]">
            <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
               {userImage ? (
                 <Image
                   src={userImage}
                   alt={userName}
                   width={96}
                   height={96}
                   className="object-cover rounded-full"
                 />
               ) : (
                 <User className="w-12 h-12 text-text-secondary/40" />
               )}
            </div>
          </div>
          <div className="absolute top-0 right-0 bg-primary text-[#25005a] rounded-full p-2 shadow-lg scale-110">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
        </div>
        <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{userName}</h3>
        <p className="text-primary text-[10px] font-mono uppercase tracking-[0.2em] mb-6 font-bold">{t("proAccount")}</p>
        
        <div className="w-full pt-6 border-t border-border-subtle/50 flex gap-1 justify-around">
          <div className="flex flex-col items-center">
            <span className="text-text-primary text-xl font-bold font-mono">24</span>
            <span className="text-[10px] text-text-secondary/70 uppercase font-bold tracking-widest">{t("sessionsCount")}</span>
          </div>
          <div className="h-10 w-[1px] bg-surface-highest/30 mx-2" />
          <div className="flex flex-col items-center">
            <span className="text-primary text-xl font-bold font-mono">88%</span>
            <span className="text-[10px] text-text-secondary/70 uppercase font-bold tracking-widest">{t("avgScore")}</span>
          </div>
        </div>
      </div>

      {/* 2. Interface Preferences */}
      <div className="md:col-span-8 bg-surface-container/70 rounded-xl border border-border-subtle p-6 flex flex-col group hover:bg-surface-highest/50 transition-all duration-300 shadow-lg">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary tracking-tight">{t("sectionInterface")}</h3>
            <p className="text-[10px] text-text-secondary/70 font-mono uppercase tracking-widest">{t("sectionInterfaceSub")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-text-secondary">{t("uiLanguage")}</span>
              <div className="flex bg-surface-lowest p-1 rounded-lg border border-border-subtle/50">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setSettings(s => ({ ...s, uiLanguage: l.value }))}
                    className={clsx(
                      "px-4 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider",
                      settings.uiLanguage === l.value 
                        ? "bg-primary text-[#25005a] shadow-lg" 
                        : "text-text-secondary/50 hover:text-white"
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-text-secondary">{t("animations")}</span>
              <button 
                onClick={() => setSettings(s => ({ ...s, animations: !s.animations }))}
                className={clsx(
                  "w-11 h-6 rounded-full p-1 transition-all duration-300 relative",
                  settings.animations 
                    ? "bg-emerald-500/20 border border-emerald-500/50" 
                    : "bg-surface-highest/30 border border-border-subtle"
                )}
              >
                <div className={clsx(
                  "w-4 h-4 rounded-full transition-all duration-300",
                  settings.animations 
                    ? "bg-emerald-500 ml-5 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                    : "bg-white/20 ml-0"
                )} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-text-secondary">{t("questionLanguage")}</span>
              <div className="flex bg-surface-lowest p-1 rounded-lg border border-border-subtle/50">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setSettings(s => ({ ...s, questionLanguage: l.value }))}
                    className={clsx(
                      "px-4 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider",
                      settings.questionLanguage === l.value 
                        ? "bg-primary text-[#25005a] shadow-lg" 
                        : "text-text-secondary/50 hover:text-white"
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-text-secondary">{t("theme")}</span>
              <button 
                onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
                className={clsx(
                  "w-11 h-6 rounded-full p-1 transition-all duration-300 relative",
                  settings.darkMode 
                    ? "bg-emerald-500/20 border border-emerald-500/50" 
                    : "bg-surface-highest/30 border border-border-subtle"
                )}
              >
                <div className={clsx(
                  "w-4 h-4 rounded-full transition-all duration-300",
                  settings.darkMode 
                    ? "bg-emerald-500 ml-5 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                    : "bg-white/20 ml-0"
                )} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interview Engine & Modes */}
      <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module A: Engine Basics */}
        <div className="bg-surface-container/70 rounded-xl border border-border-subtle p-6 group hover:bg-surface-highest/50 transition-all duration-300 h-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-surface-highest/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">{t("sectionEngine")}</h3>
              <p className="text-[10px] text-text-secondary/70 font-mono uppercase tracking-widest">{t("sectionEngineSub")}</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white/70">{t("outputModality")}</span>
                <div className="flex items-center gap-2">
                   <Terminal className="w-3 h-3 text-primary animate-pulse" />
                   <span className="text-[10px] font-mono text-primary uppercase tracking-[0.2em]">Active_Engine</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MODALITIES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setSettings(s => ({ ...s, outputModality: m.value }))}
                    className={clsx(
                      "px-3 py-2.5 rounded-lg text-[10px] font-bold transition-all border",
                      settings.outputModality === m.value 
                        ? "bg-primary/10 border-primary text-primary shadow-[inset_0_0_10px_rgba(210,187,255,0.1)]" 
                        : "bg-surface-lowest/60 border-border-subtle/50 text-text-secondary/70 hover:bg-surface-highest/30"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-white/70">{t("voiceSpeed")}</label>
                <span className="text-[10px] font-mono text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20 font-bold">
                  {settings.voiceSpeed.toFixed(1)}x
                </span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2.0" 
                step="0.1"
                value={settings.voiceSpeed}
                onChange={(e) => setSettings(s => ({ ...s, voiceSpeed: parseFloat(e.target.value) }))}
                className="w-full h-1.5 bg-surface-lowest rounded-lg appearance-none cursor-pointer accent-primary border border-border-subtle/50"
              />
              <div className="flex justify-between mt-3 font-mono text-[9px] text-text-secondary/40 uppercase tracking-[0.2em]">
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>
          </div>
        </div>

        {/* Module B: Interview Modes */}
        <div className="bg-surface-container/70 rounded-xl border border-border-subtle p-6 group hover:bg-surface-highest/50 transition-all duration-300 h-full">
           <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">{t("sectionModes")}</h3>
              <p className="text-[10px] text-text-secondary/70 font-mono uppercase tracking-widest">{t("sectionModesSub")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             {INTERVIEW_MODES.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setSettings(s => ({ ...s, interviewMode: mode.value }))}
                  className={clsx(
                    "p-4 rounded-xl border transition-all flex flex-col items-start gap-2 group/mode text-left relative overflow-hidden",
                    settings.interviewMode === mode.value
                      ? "bg-primary border-primary text-[#25005a] shadow-[0_0_25px_rgba(210,187,255,0.2)]"
                      : "bg-surface-highest/30 border-border-subtle/50 text-text-secondary/70 hover:border-white/20 hover:bg-white/10"
                  )}
                >
                  <span className={clsx(
                    "text-[10px] font-mono uppercase tracking-widest font-bold",
                    settings.interviewMode === mode.value ? "text-[#25005a]/60" : "text-text-secondary/40"
                  )}>Mode_v1.0</span>
                  <span className="text-sm font-black">{t(mode.label)}</span>
                  {settings.interviewMode === mode.value && (
                    <div className="absolute top-2 right-2">
                       <div className="w-2 h-2 rounded-full bg-[#25005a] animate-ping" />
                    </div>
                  )}
                </button>
             ))}
          </div>
          <p className="mt-6 text-[11px] text-text-secondary/50 italic leading-relaxed">
            * El modo seleccionado optimiza las respuestas de la IA para enfocarse en objetivos específicos de aprendizaje y evaluación.
          </p>
        </div>
      </div>

      {/* 4. Technical Stack */}
      <div className="md:col-span-12 bg-surface-container/70 rounded-xl border border-border-subtle p-6 flex flex-col group hover:bg-surface-highest/50 transition-all duration-300 shadow-lg">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center border border-secondary/20">
            <Layers className="w-5 h-5 text-text-secondary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary tracking-tight">{t("sectionStack")}</h3>
            <p className="text-[10px] text-text-secondary/70 font-mono uppercase tracking-widest">{t("sectionStackSub")}</p>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm text-text-secondary mb-8 leading-relaxed max-w-2xl">Selecciona los lenguajes, frameworks y herramientas que dominas para personalizar el contexto del entrevistador.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {STACK_OPTIONS.map((tech) => (
              <button
                key={tech.value}
                onClick={() => toggleArrayItem("targetStack", tech.value)}
                className={clsx(
                  "px-4 py-2.5 rounded-lg font-mono text-[10px] transition-all border flex items-center justify-between group/tech uppercase",
                  settings.targetStack.includes(tech.value)
                    ? "bg-primary-container text-text-primary border-primary shadow-glow font-black"
                    : "bg-surface-lowest/60 border-border-subtle/50 text-text-secondary/70 hover:border-white/20"
                )}
              >
                {tech.label}
                {settings.targetStack.includes(tech.value) && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Session Defaults */}
      <div className="md:col-span-12 bg-surface-container/70 rounded-xl border border-border-subtle p-6 flex flex-col group hover:bg-surface-highest/50 transition-all duration-300 shadow-lg">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center border border-primary/20">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary tracking-tight">{t("sectionDefaults")}</h3>
            <p className="text-[10px] text-text-secondary/70 font-mono uppercase tracking-widest">{t("sectionDefaultsSub")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <h4 className="text-[11px] font-bold text-primary opacity-80 mb-6 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container shadow-glow" />
              {t("sectionDifficulty")}
            </h4>
            <div className="flex flex-col gap-3">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setSettings(s => ({ ...s, defaultDifficulty: d.value }))}
                  className={clsx(
                    "w-full px-6 py-4 rounded-xl font-bold text-sm transition-all border flex items-center justify-between group/diff",
                    settings.defaultDifficulty === d.value
                      ? "bg-primary-container border-primary text-white shadow-xl scale-[1.02]"
                      : "bg-surface-lowest/60 border-border-subtle/50 text-text-secondary/50 hover:bg-surface-lowest hover:border-border-subtle"
                  )}
                >
                  <span className="flex flex-col items-start gap-1">
                    <span className={clsx(
                      "text-[9px] font-mono uppercase tracking-widest",
                      settings.defaultDifficulty === d.value ? "text-text-text-secondary" : "text-text-secondary/40"
                    )}>Level_Scale</span>
                    {d.label}
                  </span>
                  <div className={clsx(
                    "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                    settings.defaultDifficulty === d.value ? "bg-white text-primary border-white" : "border-border-subtle"
                  )}>
                    {settings.defaultDifficulty === d.value && <Check className="w-3 h-3 stroke-[4]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-7">
             <h4 className="text-[11px] font-bold text-primary opacity-80 mb-6 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container shadow-glow" />
              {t("sectionCategories")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => toggleArrayItem("defaultCategories", c.value)}
                  className={clsx(
                    "px-6 py-5 rounded-xl text-sm font-black transition-all border flex items-center justify-between group/cat",
                    settings.defaultCategories.includes(c.value)
                      ? "bg-surface-highest/30 border-primary/50 text-white shadow-[0_0_20px_rgba(249,115,22,0.05)]"
                      : "bg-surface-lowest/60 border-border-subtle/50 text-text-secondary/50 hover:bg-surface-lowest hover:border-border-subtle"
                  )}
                >
                  {c.label}
                  <div className={clsx(
                    "w-6 h-6 rounded-lg border transition-all flex items-center justify-center",
                    settings.defaultCategories.includes(c.value)
                      ? "bg-primary-container border-primary rotate-0"
                      : "bg-surface-lowest border-border-subtle -rotate-12"
                  )}>
                    {settings.defaultCategories.includes(c.value) && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-8 p-4 rounded-xl bg-primary-container/5 border border-primary/10">
               <p className="text-[11px] text-primary/60 leading-relaxed font-mono">
                 [SYSTEM_LOG]: Estas preferencias se usarán automáticamente al iniciar sesiones rápidas desde el panel principal.
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Save Action */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6">
        <div className="bg-surface-lowest/90 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[10px] font-mono text-primary uppercase tracking-[0.3em] font-bold">Autosave_Active</span>
              <span className="text-[10px] font-medium text-text-text-secondary">Modified {new Date().getHours()}:{new Date().getMinutes().toString().padStart(2, '0')}</span>
           </div>
           <button
            onClick={handleSave}
            disabled={saving}
            className={clsx(
              "flex items-center gap-3 rounded-xl px-10 py-3 text-xs font-black transition-all shadow-xl active:scale-95",
              saved
                ? "bg-emerald-500 text-white ring-8 ring-emerald-500/10"
                : "bg-primary text-[#25005a] hover:shadow-[0_0_30px_rgba(210,187,255,0.4)]",
              saving && "opacity-50 cursor-not-allowed"
            )}
          >
            {saved ? (
              <>
                <Check className="h-4 w-4 stroke-[4]" />
                {t("savedButton")}
              </>
            ) : (
              <>
                {saving ? (
                   <div className="w-4 h-4 border-2 border-[#25005a]/30 border-t-[#25005a] rounded-full animate-spin" />
                ) : (
                   <Save className="h-4 w-4 stroke-[3]" />
                )}
                {saving ? t("savingButton") : t("saveButton")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
