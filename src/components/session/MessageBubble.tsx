"use client";

import { clsx } from "clsx";
import { ChevronDown, Bookmark, BookmarkCheck, Volume2 } from "lucide-react";
import { useState } from "react";
import type { SessionMessageDTO } from "@/types/session";
import { AudioPlayback } from "./voice/AudioPlayback";

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
      : score >= 40
        ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"
        : "text-red-400 border-red-400/30 bg-red-400/10";

  return (
    <span className={clsx("inline-flex items-center rounded-full border px-3 py-1 font-mono text-lg font-bold", color)}>
      {score}/100
    </span>
  );
}

function BookmarkButton({ messageId, initialBookmarkId }: { messageId: string; initialBookmarkId?: string | null }) {
  const [bookmarkId, setBookmarkId] = useState<string | null>(initialBookmarkId ?? null);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (bookmarkId) {
        await fetch(`/api/bookmarks/${bookmarkId}`, { method: "DELETE" });
        setBookmarkId(null);
      } else {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId }),
        });
        const data = await res.json();
        setBookmarkId(data.id);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={bookmarkId ? "Remove bookmark" : "Bookmark this question"}
      className={clsx(
        "flex h-6 w-6 items-center justify-center rounded transition-all",
        bookmarkId
          ? "text-primary opacity-100"
          : "text-text-secondary opacity-0 group-hover:opacity-100 hover:text-primary"
      )}
    >
      {bookmarkId ? (
        <BookmarkCheck className="h-3.5 w-3.5" />
      ) : (
        <Bookmark className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

interface MessageBubbleProps {
  message: SessionMessageDTO;
  onDemandAudioUrl?: string;
  onRequestTTS?: (text: string) => void;
  /** When true, audio plays immediately (chaining: after evaluation ends, next question plays). */
  triggerPlay?: boolean;
  /** Called when this message's audio finishes playing naturally. */
  onAudioEnded?: () => void;
}

export function MessageBubble({ message, onDemandAudioUrl, onRequestTTS, triggerPlay, onAudioEnded }: MessageBubbleProps) {
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  // Interviewer question
  if (message.role === "interviewer" && message.messageType === "question") {
    return (
      <div className="group flex max-w-[85%] gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container">
          <span className="font-mono text-[10px] font-bold text-white">AI</span>
        </div>
        <div className="min-w-0 w-full">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-medium text-text-secondary">Interviewer</span>
            {message.questionIndex != null && (
              <span className="rounded bg-surface-highest px-2 py-0.5 font-mono text-xs text-text-secondary">
                Q{message.questionIndex}
              </span>
            )}
            <BookmarkButton messageId={message.id} initialBookmarkId={message.bookmarkId} />
            {/* TTS trigger button — only in voice mode */}
            {onRequestTTS && !onDemandAudioUrl && (
              <button
                onClick={() => onRequestTTS(message.content)}
                title="Escuchar pregunta"
                className="ml-auto flex h-6 w-6 items-center justify-center rounded text-text-secondary opacity-0 transition group-hover:opacity-100 hover:text-primary"
              >
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="rounded-2xl rounded-tl-sm border border-border-subtle bg-surface-container px-4 py-3 text-sm text-text-primary">
            {message.content}
          </div>
          {onDemandAudioUrl && (
            <AudioPlayback src={onDemandAudioUrl} autoPlay={false} triggerPlay={triggerPlay} onEnded={onAudioEnded} />
          )}
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
            <span className="text-xs font-medium text-text-secondary">You</span>
          </div>
          <div className="rounded-2xl rounded-tr-sm bg-primary-container px-4 py-3 text-sm text-white">
            {message.content}
            {message.codeContent && (
              <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-[#0e0e0e]">
                <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500/60" />
                  <span className="h-2 w-2 rounded-full bg-yellow-500/60" />
                  <span className="h-2 w-2 rounded-full bg-green-500/60" />
                  <span className="ml-2 font-mono text-[10px] text-zinc-500">code</span>
                </div>
                <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-zinc-200">
                  <code>{message.codeContent}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Evaluation
  if (message.messageType === "evaluation") {
    return (
      <div className="flex max-w-[85%] gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container">
          <span className="font-mono text-[10px] font-bold text-white">AI</span>
        </div>
        <div className="w-full">
          <span className="mb-1 block text-xs font-medium text-text-secondary">Evaluation</span>
          <div className="rounded-xl border border-border-subtle bg-surface-container/80 p-4 text-sm backdrop-blur-sm">
            {message.score !== null && (
              <div className="mb-3">
                <ScoreBadge score={message.score} />
              </div>
            )}

            <p className="text-text-primary">{message.feedback || message.content}</p>

            {message.criteria && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {Object.entries(message.criteria).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between rounded-lg bg-surface-highest/60 px-3 py-1.5 text-xs"
                  >
                    <span className="capitalize text-text-secondary">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="font-mono font-medium text-text-primary">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}

            {message.modelAnswer && (
              <div className="mt-3">
                <button
                  onClick={() => setShowModelAnswer(!showModelAnswer)}
                  className="flex items-center gap-1 text-xs text-primary transition hover:opacity-80"
                >
                  <ChevronDown
                    className={clsx("h-3 w-3 transition-transform", showModelAnswer && "rotate-180")}
                  />
                  {showModelAnswer ? "Hide" : "Show"} model answer
                </button>
                {showModelAnswer && (
                  <div className="mt-2 rounded-lg border border-border-subtle bg-surface-lowest p-3 font-mono text-xs text-text-secondary">
                    {message.modelAnswer}
                  </div>
                )}
              </div>
            )}

            {onDemandAudioUrl && (
              <AudioPlayback src={onDemandAudioUrl} autoPlay onEnded={onAudioEnded} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex max-w-[85%] gap-3">
      <div className="h-8 w-8 shrink-0 rounded-full bg-surface-highest" />
      <div className="rounded-2xl border border-border-subtle bg-surface-container px-4 py-3 text-sm text-text-primary">
        {message.content}
      </div>
    </div>
  );
}
