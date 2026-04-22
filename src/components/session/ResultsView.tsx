"use client";

import { useState } from "react";
import { Link } from "@/navigation";
import { clsx } from "clsx";
import {
  ArrowLeft,
  Trophy,
  HelpCircle,
  Clock,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Bookmark,
  BookmarkCheck,
  Download,
} from "lucide-react";
import type { ResultsData, QuestionResult } from "@/types/session";
import { generateSessionMarkdown, downloadFile } from "@/lib/export";

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

function scoreBadge(score: number) {
  if (score >= 70) return "border-emerald-400/30 bg-emerald-400/10 text-emerald-400";
  if (score >= 40) return "border-yellow-400/30 bg-yellow-400/10 text-yellow-400";
  return "border-red-400/30 bg-red-400/10 text-red-400";
}

function CriterionBar({ label, value, compact = false }: { label: string; value: number; compact?: boolean }) {
  const colorClass = value >= 70 ? "bg-emerald-400" : value >= 40 ? "bg-yellow-400" : "bg-red-400";
  const bgClass = value >= 70 ? "bg-emerald-400/10" : value >= 40 ? "bg-yellow-400/10" : "bg-red-400/10";
  
  return (
    <div className={clsx("flex flex-col gap-1.5", compact ? "w-full" : "w-full")}>
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary capitalize">
          {label.replace(/_/g, " ")}
        </span>
        <span className={clsx("font-mono text-[10px] font-bold", value >= 70 ? "text-emerald-400" : value >= 40 ? "text-yellow-400" : "text-red-400")}>
          {Math.round(value)}%
        </span>
      </div>
      <div className={clsx("h-1.5 w-full rounded-full overflow-hidden", bgClass)}>
        <div 
          className={clsx("h-full rounded-full transition-all duration-500", colorClass)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function QuestionCard({ question }: { question: QuestionResult }) {
  const [expanded, setExpanded] = useState(false);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(question.bookmarkId);
  const [isToggling, setIsToggling] = useState(false);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isToggling || !question.evaluationMessageId) return;

    setIsToggling(true);
    try {
      if (bookmarkId) {
        const res = await fetch(`/api/bookmarks/${bookmarkId}`, { method: "DELETE" });
        if (res.ok) setBookmarkId(null);
      } else {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: question.evaluationMessageId }),
        });
        if (res.ok) {
          const data = await res.json();
          setBookmarkId(data.id);
        }
      }
    } catch (err) {
      console.error("Failed to toggle bookmark", err);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-container/80">
      <div className="flex items-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 items-center justify-between px-4 py-3 text-left transition hover:bg-surface-highest/30"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-highest font-mono text-xs font-bold text-text-secondary">
              {question.questionIndex}
            </span>
            <p className="truncate text-sm text-text-primary">
              {question.questionText.slice(0, 100)}
              {question.questionText.length > 100 && "…"}
            </p>
          </div>
          <div className="ml-3 flex shrink-0 items-center gap-3">
            {question.score !== null ? (
              <span className={clsx("inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-sm font-bold", scoreBadge(question.score))}>
                {question.score}
              </span>
            ) : (
              <span className="text-xs text-text-secondary">N/A</span>
            )}
            <ChevronDown className={clsx("h-4 w-4 text-text-secondary transition-transform", expanded && "rotate-180")} />
          </div>
        </button>

        {/* Bookmark Toggle */}
        <div className="pr-4">
          <button
            onClick={toggleBookmark}
            disabled={isToggling || !question.evaluationMessageId}
            className={clsx(
              "group relative flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-300",
              bookmarkId
                ? "border-primary/40 bg-primary/10 text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.15)] hover:bg-primary/20"
                : "border-border-subtle bg-transparent text-text-secondary hover:border-text-secondary/40 hover:bg-surface-highest/50"
            )}
            title={bookmarkId ? "Quitar de repaso" : "Agregar a repaso"}
          >
            {bookmarkId ? (
              <>
                <BookmarkCheck className="h-3.5 w-3.5 fill-current" />
                <span>En Repaso</span>
              </>
            ) : (
              <>
                <Bookmark className="h-3.5 w-3.5" />
                <span>Repasar</span>
              </>
            )}
            {isToggling && (
              <div className="absolute inset-0 flex items-center justify-center bg-inherit">
                 <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-border-subtle px-4 py-4">
          {/* Question */}
          <div>
            <span className="text-xs font-medium text-text-secondary">Question</span>
            <p className="mt-1 text-sm text-text-primary">{question.questionText}</p>
          </div>

          {/* Candidate answer */}
          <div>
            <span className="text-xs font-medium text-text-secondary">Your Answer</span>
            {question.candidateAnswer ? (
              <div className="mt-1 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-text-primary">
                {question.candidateAnswer}
                {question.candidateCode && (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-surface-lowest p-3 font-mono text-xs text-text-secondary">
                    <code>{question.candidateCode}</code>
                  </pre>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm italic text-text-secondary">No answer provided</p>
            )}
          </div>

          {/* Score & criteria */}
          {question.score !== null && (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-secondary">Score</span>
                <span className={clsx("inline-flex items-center rounded-full border px-3 py-1 font-mono text-lg font-bold", scoreBadge(question.score))}>
                  {question.score}/100
                </span>
                {question.score < 70 && (
                  <span className="ml-2 text-[0.65rem] font-bold uppercase tracking-wider text-red-400/80">
                    Auto-marcada para repaso
                  </span>
                )}
              </div>

              {question.criteria && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {Object.entries(question.criteria).map(([key, value]) => (
                    <CriterionBar key={key} label={key} value={Number(value)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          {question.feedback && (
            <div>
              <span className="text-xs font-medium text-text-secondary">Feedback</span>
              <p className="mt-1 text-sm text-text-primary">{question.feedback}</p>
            </div>
          )}

          {/* Model answer */}
          {question.modelAnswer && (
            <div>
              <button
                onClick={() => setShowModelAnswer(!showModelAnswer)}
                className="flex items-center gap-1 text-xs text-primary transition hover:opacity-80"
              >
                <ChevronDown className={clsx("h-3 w-3 transition-transform", showModelAnswer && "rotate-180")} />
                {showModelAnswer ? "Hide" : "Show"} model answer
              </button>
              {showModelAnswer && (
                <div className="mt-2 rounded-lg border border-border-subtle bg-surface-lowest p-3 font-mono text-xs text-text-secondary">
                  {question.modelAnswer}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ResultsView({ data }: { data: ResultsData }) {
  const completedCount = data.questions.filter((q) => q.score !== null).length;

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition hover:bg-surface-highest hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold capitalize">
              {data.category.replace(/_/g, " ")} Interview Results
            </h1>
            <p className="text-sm capitalize text-text-secondary">
              {data.difficulty} level · {new Date(data.completedAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => {
              const md = generateSessionMarkdown(data);
              downloadFile(md, `devprep-session-${data.id.slice(0, 8)}.md`);
            }}
            className="ml-auto flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary/10"
          >
            <Download className="h-4 w-4" />
            Exportar .MD
          </button>
        </div>

        {/* Summary cards */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border-subtle bg-surface-container/80 p-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <Trophy className="h-4 w-4" />
              <span className="text-xs font-medium">Overall Score</span>
            </div>
            <p className={clsx("mt-2 font-mono text-3xl font-bold", scoreColor(data.overallScore))}>
              {Math.round(data.overallScore)}
              <span className="text-lg text-text-secondary">/100</span>
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface-container/80 p-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <HelpCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Questions</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
              {completedCount}
              <span className="text-lg text-text-secondary">/{data.totalQuestions}</span>
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface-container/80 p-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Duration</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
              {formatDuration(data.duration)}
            </p>
          </div>
        </div>

        {/* Global Criteria Breakdown */}
        {Object.keys(data.criteriaAverages).length > 0 && (
          <div className="mt-8 rounded-xl border border-border-subtle bg-surface-container/80 p-6 shadow-glow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-6">
              Diagnóstico de Criterios (Promedio Sesión)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
              {Object.entries(data.criteriaAverages).map(([key, value]) => (
                <CriterionBar key={key} label={key} value={value} />
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        {(data.strengths.length > 0 || data.weaknesses.length > 0) && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {data.strengths.length > 0 && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-semibold">Strengths</span>
                </div>
                <div className="mt-3 space-y-2">
                  {data.strengths.map((s) => (
                    <div key={s.criterion} className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2">
                      <span className="text-sm capitalize text-text-primary">{s.criterion.replace(/_/g, " ")}</span>
                      <span className="font-mono text-sm font-bold text-emerald-400">{s.avgScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.weaknesses.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-semibold">Areas to Improve</span>
                </div>
                <div className="mt-3 space-y-2">
                  {data.weaknesses.map((w) => (
                    <div key={w.criterion} className="flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2">
                      <span className="text-sm capitalize text-text-primary">{w.criterion.replace(/_/g, " ")}</span>
                      <span className="font-mono text-sm font-bold text-amber-400">{w.avgScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Per-question breakdown */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-text-primary">Question Breakdown</h2>
          <div className="mt-4 space-y-3">
            {data.questions.map((q) => (
              <QuestionCard key={q.questionIndex} question={q} />
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/session/new"
            className="flex items-center gap-2 rounded-xl bg-primary-container px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" />
            New Session
          </Link>
          <button
            onClick={() => {
              const md = generateSessionMarkdown(data);
              downloadFile(md, `devprep-session-${data.id.slice(0, 8)}.md`);
            }}
            className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-highest/50 px-5 py-2.5 text-sm font-medium text-text-primary transition hover:bg-surface-highest"
          >
            <Download className="h-4 w-4" />
            Exportar MD
          </button>
          <Link href="/dashboard" className="text-sm text-text-secondary transition hover:text-text-primary">
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
