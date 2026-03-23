"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { Save, Check } from "lucide-react";

interface SettingsData {
  uiLanguage: string;
  questionLanguage: string;
  defaultDifficulty: string;
  defaultCategories: string[];
  targetStack: string[];
  outputModality: string;
  voiceSpeed: number;
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
  { value: "java", label: "Java" },
  { value: "docker", label: "Docker" },
  { value: "aws", label: "AWS" },
  { value: "github_actions", label: "GitHub Actions" },
];

const DIFFICULTIES = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

export function SettingsForm({
  initialSettings,
}: {
  initialSettings: SettingsData;
}) {
  const t = useTranslations("Settings");
  const [settings, setSettings] = useState(initialSettings);
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
      // Don't allow empty array
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
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-8 space-y-8">
      {/* Language */}
      <Section title={t("sectionLanguage")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-400">
              {t("uiLanguage")}
            </label>
            <div className="mt-2 flex gap-2">
              {LANGUAGES.map((l) => (
                <PillButton
                  key={l.value}
                  active={settings.uiLanguage === l.value}
                  onClick={() =>
                    setSettings((s) => ({ ...s, uiLanguage: l.value }))
                  }
                >
                  {l.label}
                </PillButton>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">
              {t("questionLanguage")}
            </label>
            <div className="mt-2 flex gap-2">
              {LANGUAGES.map((l) => (
                <PillButton
                  key={l.value}
                  active={settings.questionLanguage === l.value}
                  onClick={() =>
                    setSettings((s) => ({ ...s, questionLanguage: l.value }))
                  }
                >
                  {l.label}
                </PillButton>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Default Difficulty */}
      <Section title={t("sectionDifficulty")}>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <PillButton
              key={d.value}
              active={settings.defaultDifficulty === d.value}
              onClick={() =>
                setSettings((s) => ({ ...s, defaultDifficulty: d.value }))
              }
            >
              {d.label}
            </PillButton>
          ))}
        </div>
      </Section>

      {/* Default Categories */}
      <Section title={t("sectionCategories")}>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <PillButton
              key={c.value}
              active={settings.defaultCategories.includes(c.value)}
              onClick={() => toggleArrayItem("defaultCategories", c.value)}
            >
              {c.label}
            </PillButton>
          ))}
        </div>
      </Section>

      {/* Target Stack */}
      <Section title={t("sectionStack")}>
        <div className="flex flex-wrap gap-2">
          {STACK_OPTIONS.map((t) => (
            <PillButton
              key={t.value}
              active={settings.targetStack.includes(t.value)}
              onClick={() => toggleArrayItem("targetStack", t.value)}
            >
              {t.label}
            </PillButton>
          ))}
        </div>
      </Section>

      {/* Save */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className={clsx(
            "flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition",
            saved
              ? "bg-emerald-600 text-white"
              : "bg-blue-600 text-white hover:bg-blue-500",
            saving && "opacity-50 cursor-not-allowed"
          )}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              {t("savedButton")}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {saving ? t("savingButton") : t("saveButton")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition",
        active
          ? "bg-blue-600 text-white"
          : "bg-slate-700 text-slate-400 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
