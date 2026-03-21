"use client";

import { clsx } from "clsx";
import { Bot, User, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { SessionMessageDTO } from "@/types/session";

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
      : score >= 40
        ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"
        : "text-red-400 border-red-400/30 bg-red-400/10";

  return (
    <span className={clsx("inline-flex items-center rounded-full border px-3 py-1 text-lg font-bold", color)}>
      {score}/100
    </span>
  );
}

export function MessageBubble({ message }: { message: SessionMessageDTO }) {
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  // Interviewer question
  if (message.role === "interviewer" && message.messageType === "question") {
    return (
      <div className="flex gap-3 max-w-[85%]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Interviewer</span>
            {message.questionIndex && (
              <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                Question {message.questionIndex}
              </span>
            )}
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-slate-800 px-4 py-3 text-sm text-slate-100">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // Candidate message
  if (message.role === "candidate") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%]">
          <div className="mb-1 flex justify-end">
            <span className="text-xs font-medium text-slate-400">You</span>
          </div>
          <div className="rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 text-sm text-white">
            {message.content}
            {message.codeContent && (
              <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900/50 p-3 text-xs">
                <code>{message.codeContent}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Evaluation
  if (message.messageType === "evaluation") {
    return (
      <div className="flex gap-3 max-w-[85%]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
          <Bot className="h-4 w-4" />
        </div>
        <div className="w-full">
          <span className="mb-1 block text-xs font-medium text-slate-400">Evaluation</span>
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-sm">
            {message.score !== null && (
              <div className="mb-3">
                <ScoreBadge score={message.score} />
              </div>
            )}

            <p className="text-slate-200">{message.feedback || message.content}</p>

            {message.criteria && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {Object.entries(message.criteria).map(([key, value]) => (
                  <div key={key} className="flex justify-between rounded bg-slate-700/50 px-3 py-1.5 text-xs">
                    <span className="text-slate-400">{key}</span>
                    <span className="font-medium text-slate-200">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}

            {message.modelAnswer && (
              <div className="mt-3">
                <button
                  onClick={() => setShowModelAnswer(!showModelAnswer)}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <ChevronDown
                    className={clsx("h-3 w-3 transition-transform", showModelAnswer && "rotate-180")}
                  />
                  {showModelAnswer ? "Hide" : "Show"} model answer
                </button>
                {showModelAnswer && (
                  <div className="mt-2 rounded-lg bg-slate-700/50 p-3 text-xs text-slate-300">
                    {message.modelAnswer}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex gap-3 max-w-[85%]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-600">
        <User className="h-4 w-4" />
      </div>
      <div className="rounded-2xl bg-slate-800 px-4 py-3 text-sm text-slate-100">
        {message.content}
      </div>
    </div>
  );
}
