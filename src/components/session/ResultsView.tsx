"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import type { ResultsData, QuestionResult } from "@/types/session";

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

function scoreBg(score: number) {
  if (score >= 70) return "border-emerald-400/30 bg-emerald-400/10 text-emerald-400";
  if (score >= 40) return "border-yellow-400/30 bg-yellow-400/10 text-yellow-400";
  return "border-red-400/30 bg-red-400/10 text-red-400";
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

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-700/30"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
            {question.questionIndex}
          </span>
          <p className="truncate text-sm text-slate-200">
            {question.questionText.slice(0, 100)}
            {question.questionText.length > 100 && "…"}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          {question.score !== null ? (
            <span
              className={clsx(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-bold",
                scoreBg(question.score)
              )}
            >
              {question.score}
            </span>
          ) : (
            <span className="text-xs text-slate-500">N/A</span>
          )}
          <ChevronDown
            className={clsx(
              "h-4 w-4 text-slate-400 transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-700 px-4 py-4 space-y-4">
          {/* Question */}
          <div>
            <span className="text-xs font-medium text-slate-400">Question</span>
            <p className="mt-1 text-sm text-slate-200">{question.questionText}</p>
          </div>

          {/* Candidate answer */}
          <div>
            <span className="text-xs font-medium text-slate-400">Your Answer</span>
            {question.candidateAnswer ? (
              <div className="mt-1 rounded-lg bg-blue-600/10 border border-blue-500/20 p-3 text-sm text-slate-200">
                {question.candidateAnswer}
                {question.candidateCode && (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900/50 p-3 text-xs">
                    <code>{question.candidateCode}</code>
                  </pre>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm italic text-slate-500">No answer provided</p>
            )}
          </div>

          {/* Score & criteria */}
          {question.score !== null && (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400">Score</span>
                <span
                  className={clsx(
                    "inline-flex items-center rounded-full border px-3 py-1 text-lg font-bold",
                    scoreBg(question.score)
                  )}
                >
                  {question.score}/100
                </span>
              </div>

              {question.criteria && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {Object.entries(question.criteria).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between rounded bg-slate-700/50 px-3 py-1.5 text-xs"
                    >
                      <span className="text-slate-400">{key}</span>
                      <span className="font-medium text-slate-200">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          {question.feedback && (
            <div>
              <span className="text-xs font-medium text-slate-400">Feedback</span>
              <p className="mt-1 text-sm text-slate-300">{question.feedback}</p>
            </div>
          )}

          {/* Model answer */}
          {question.modelAnswer && (
            <div>
              <button
                onClick={() => setShowModelAnswer(!showModelAnswer)}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                <ChevronDown
                  className={clsx(
                    "h-3 w-3 transition-transform",
                    showModelAnswer && "rotate-180"
                  )}
                />
                {showModelAnswer ? "Hide" : "Show"} model answer
              </button>
              {showModelAnswer && (
                <div className="mt-2 rounded-lg bg-slate-700/50 p-3 text-xs text-slate-300">
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
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold capitalize">
              {data.category.replace("_", " ")} Interview Results
            </h1>
            <p className="text-sm text-slate-400 capitalize">
              {data.difficulty} level ·{" "}
              {new Date(data.completedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Trophy className="h-4 w-4" />
              <span className="text-xs font-medium">Overall Score</span>
            </div>
            <p className={clsx("mt-2 text-3xl font-bold", scoreColor(data.overallScore))}>
              {Math.round(data.overallScore)}
              <span className="text-lg text-slate-500">/100</span>
            </p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <HelpCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Questions</span>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {completedCount}
              <span className="text-lg text-slate-500">/{data.totalQuestions}</span>
            </p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Duration</span>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {formatDuration(data.duration)}
            </p>
          </div>
        </div>

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
                    <div
                      key={s.criterion}
                      className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2"
                    >
                      <span className="text-sm capitalize text-slate-200">
                        {s.criterion}
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        {s.avgScore}
                      </span>
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
                    <div
                      key={w.criterion}
                      className="flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2"
                    >
                      <span className="text-sm capitalize text-slate-200">
                        {w.criterion}
                      </span>
                      <span className="text-sm font-bold text-amber-400">
                        {w.avgScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Per-question breakdown */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Question Breakdown</h2>
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
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium transition hover:bg-blue-500"
          >
            <RotateCcw className="h-4 w-4" />
            Start New Session
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-slate-400 hover:text-white transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
