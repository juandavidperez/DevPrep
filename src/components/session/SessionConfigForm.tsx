"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Code, Cpu, MessageSquare, Layers, Shuffle } from "lucide-react";
import { clsx } from "clsx";

const CATEGORIES = [
  { id: "technical", label: "Technical", icon: Cpu },
  { id: "coding", label: "Coding", icon: Code },
  { id: "system_design", label: "System Design", icon: Layers },
  { id: "behavioral", label: "Behavioral", icon: MessageSquare },
  { id: "mixed", label: "Mixed", icon: Shuffle },
] as const;

const DIFFICULTIES = [
  { id: "junior", label: "Junior" },
  { id: "mid", label: "Mid" },
  { id: "senior", label: "Senior" },
] as const;

const QUESTION_COUNTS = [
  { value: 5, label: "5 Questions", description: "Quick" },
  { value: 10, label: "10 Questions", description: "Standard" },
  { value: 15, label: "15 Questions", description: "Thorough" },
] as const;

export function SessionConfigForm() {
  const router = useRouter();
  const [category, setCategory] = useState("technical");
  const [difficulty, setDifficulty] = useState("mid");
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, difficulty, totalQuestions, language: "en" }),
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold">New Interview Session</h1>
      <p className="mt-1 text-sm text-slate-400">Configure your mock interview</p>

      {/* Category */}
      <fieldset className="mt-8">
        <legend className="text-sm font-medium text-slate-300">Category</legend>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setCategory(id)}
              className={clsx(
                "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition",
                category === id
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Difficulty */}
      <fieldset className="mt-8">
        <legend className="text-sm font-medium text-slate-300">Difficulty</legend>
        <div className="mt-3 flex gap-3">
          {DIFFICULTIES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setDifficulty(id)}
              className={clsx(
                "flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition",
                difficulty === id
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Question Count */}
      <fieldset className="mt-8">
        <legend className="text-sm font-medium text-slate-300">Number of Questions</legend>
        <div className="mt-3 flex gap-3">
          {QUESTION_COUNTS.map(({ value, label, description }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTotalQuestions(value)}
              className={clsx(
                "flex-1 rounded-xl border px-4 py-3 text-center transition",
                totalQuestions === value
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-700 bg-slate-800 hover:border-slate-500"
              )}
            >
              <div className={clsx(
                "text-sm font-medium",
                totalQuestions === value ? "text-blue-400" : "text-slate-300"
              )}>
                {label}
              </div>
              <div className="text-xs text-slate-500">{description}</div>
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
      >
        {isSubmitting ? "Starting session..." : "Start Interview"}
      </button>
    </form>
  );
}
