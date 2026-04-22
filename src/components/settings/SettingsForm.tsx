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
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  Zap,
  AlertTriangle,
  RotateCcw
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
  feedbackMode: string;
}

const CATEGORIES = [
  { value: "technical", label: "Technical" },
  { value: "coding", label: "Coding" },
  { value: "system_design", label: "System Design" },
  { value: "behavioral", label: "Behavioral" },
];

const STACK_OPTIONS = [
  { value: "angular", label: "Angular" },
  { value: "spring_boot", label: "Spring Boot" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "typescript", label: "TypeScript" },
  { value: "node.js", label: "Node.js" },
  { value: "react", label: "React" },
  { value: "next.js", label: "Next.js" },
  { value: "java", label: "Java" },
  { value: "docker", label: "Docker/K8s" },
  { value: "aws", label: "AWS" },
  { value: "python", label: "Python/Django" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
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


export function SettingsForm({
  initialSettings,
  userName,
  userImage,
  totalSessions,
  avgScore,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialSettings: any;
  userName: string;
  userImage: string | null;
  totalSessions: number;
  avgScore: number;
}) {
  const t = useTranslations("Settings");
  const [settings, setSettings] = useState<SettingsData>({
    ...initialSettings,
    animations: initialSettings.animations ?? true,
    darkMode: initialSettings.darkMode ?? true,
    feedbackMode: initialSettings.feedbackMode ?? "live",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

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

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/settings/reset", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to reset stats");
      }
    } catch (error) {
      console.error("Error resetting stats:", error);
    } finally {
      setResetting(false);
      setResetConfirm(false);
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
            <span className="text-text-primary text-xl font-bold font-mono">{totalSessions}</span>
            <span className="text-[10px] text-text-secondary/70 uppercase font-bold tracking-widest">{t("sessionsCount")}</span>
          </div>
          <div className="h-10 w-[1px] bg-surface-highest/30 mx-2" />
          <div className="flex flex-col items-center">
            <span className="text-primary text-xl font-bold font-mono">{Math.round(avgScore)}%</span>
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

      {/* 3. Feedback Mode */}
      <div className="md:col-span-12 bg-surface-container/70 rounded-xl border border-border-subtle p-6 group hover:bg-surface-highest/50 transition-all duration-300 shadow-lg">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">{t("feedbackMode")}</h3>
            <p className="text-[10px] text-text-secondary/70 font-mono uppercase tracking-widest">{t("feedbackModeSub")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setSettings(s => ({ ...s, feedbackMode: "live" }))}
            className={clsx(
              "flex items-start gap-4 p-5 rounded-xl border transition-all text-left",
              settings.feedbackMode === "live"
                ? "bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(210,187,255,0.1)]"
                : "bg-surface-highest/30 border-border-subtle/50 hover:border-white/20 hover:bg-white/10"
            )}
          >
            <div className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              settings.feedbackMode === "live" ? "bg-primary/20" : "bg-white/5"
            )}>
              <Eye className={clsx("h-5 w-5", settings.feedbackMode === "live" ? "text-primary" : "text-text-secondary/40")} />
            </div>
            <div className="flex-1">
              <span className={clsx(
                "block text-sm font-bold mb-1",
                settings.feedbackMode === "live" ? "text-text-primary" : "text-text-secondary/70"
              )}>{t("feedbackLive")}</span>
              <span className="block text-[11px] text-text-secondary/50 leading-relaxed">{t("feedbackLiveDesc")}</span>
            </div>
            {settings.feedbackMode === "live" && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5 stroke-[3]" />}
          </button>

          <button
            onClick={() => setSettings(s => ({ ...s, feedbackMode: "silent" }))}
            className={clsx(
              "flex items-start gap-4 p-5 rounded-xl border transition-all text-left",
              settings.feedbackMode === "silent"
                ? "bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(210,187,255,0.1)]"
                : "bg-surface-highest/30 border-border-subtle/50 hover:border-white/20 hover:bg-white/10"
            )}
          >
            <div className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              settings.feedbackMode === "silent" ? "bg-primary/20" : "bg-white/5"
            )}>
              <EyeOff className={clsx("h-5 w-5", settings.feedbackMode === "silent" ? "text-primary" : "text-text-secondary/40")} />
            </div>
            <div className="flex-1">
              <span className={clsx(
                "block text-sm font-bold mb-1",
                settings.feedbackMode === "silent" ? "text-text-primary" : "text-text-secondary/70"
              )}>{t("feedbackSilent")}</span>
              <span className="block text-[11px] text-text-secondary/50 leading-relaxed">{t("feedbackSilentDesc")}</span>
            </div>
            {settings.feedbackMode === "silent" && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5 stroke-[3]" />}
          </button>
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

      {/* 6. Danger Zone */}
      <div className="md:col-span-12 mt-12 pt-12 border-t border-red-500/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-500 tracking-tight">Zona de Peligro</h3>
            <p className="text-[10px] text-red-500/50 font-mono uppercase tracking-widest">Acciones irreversibles</p>
          </div>
        </div>

        <div className="bg-red-500/5 rounded-xl border border-red-500/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h4 className="text-sm font-bold text-white mb-1">Reiniciar todas las estadísticas</h4>
            <p className="text-[11px] text-white/40 leading-relaxed">Se borrarán todas tus sesiones, mensajes y marcadores. Tu progreso se pondrá a cero y no podrás recuperar estos datos.</p>
          </div>
          
          <button
            onClick={() => setResetConfirm(true)}
            className="whitespace-nowrap px-6 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold transition-all hover:bg-red-500 hover:text-white"
          >
            Limpiar Base de Datos
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-surface-container p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">¿Estás absolutamente seguro?</h3>
            <p className="text-sm text-white/50 text-center mb-8">Esta acción eliminará permanentemente todo tu historial de entrevistas y análisis. No hay vuelta atrás.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setResetConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/80 transition-all hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Confirmar Reinicio
              </button>
            </div>
          </div>
        </div>
      )}

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
