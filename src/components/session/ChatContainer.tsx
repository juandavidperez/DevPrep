"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, ArrowLeft, Clock } from "lucide-react";
import { Link } from "@/navigation";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import type { SessionMessageDTO, SendMessageResponse } from "@/types/session";

interface SessionData {
  id: string;
  category: string;
  difficulty: string;
  totalQuestions: number;
  completedAt: string | null;
  score: number | null;
  feedbackMode: string;
}

interface ChatContainerProps {
  initialSession: SessionData;
  initialMessages: SessionMessageDTO[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ChatContainer({ initialSession, initialMessages }: ChatContainerProps) {
  const [messages, setMessages] = useState<SessionMessageDTO[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(!!initialSession.completedAt);
  const [finalScore, setFinalScore] = useState<number | null>(initialSession.score);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentQuestion = messages.filter((m) => m.messageType === "question").length;
  const progress = Math.round((currentQuestion / initialSession.totalQuestions) * 100);

  // Timer
  useEffect(() => {
    if (isComplete) return;
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isComplete]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (content: string, isClarification = false, code?: string) => {
    setError(null);
    setIsLoading(true);

    const optimisticMsg: SessionMessageDTO = {
      id: `temp-${Date.now()}`,
      role: "candidate",
      content,
      codeContent: code ?? null,
      messageType: isClarification ? "clarification" : "message",
      questionIndex: currentQuestion,
      score: null,
      criteria: null,
      feedback: null,
      modelAnswer: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`/api/sessions/${initialSession.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, codeContent: code, isClarification }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      const data: SendMessageResponse = await res.json();

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticMsg.id),
        ...data.messages,
      ]);

      if (data.isComplete) {
        setIsComplete(true);
        setFinalScore(data.finalScore ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col bg-background md:h-dvh">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface-container/80 px-4 py-3 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition hover:bg-surface-highest hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold capitalize text-text-primary">
              {initialSession.category.replace(/_/g, " ")} Interview
            </h1>
            <p className="text-xs capitalize text-text-secondary">
              {initialSession.difficulty} level
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className="flex items-center gap-1.5 font-mono text-xs text-text-secondary">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(elapsed)}
          </div>

          {/* Progress */}
          <div className="text-right">
            <span className="font-mono text-sm font-medium text-text-primary">
              {currentQuestion}
              <span className="text-text-secondary">/{initialSession.totalQuestions}</span>
            </span>
            <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-surface-highest">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* AI thinking indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-border-subtle bg-surface-container px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-text-secondary" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-text-secondary" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-text-secondary" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 underline hover:text-red-300"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Completion card */}
          {isComplete && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-primary">Session Complete</h2>
              {finalScore !== null && (
                <p className="mt-2 font-mono text-4xl font-bold text-text-primary">
                  {Math.round(finalScore)}
                  <span className="text-xl text-text-secondary">/100</span>
                </p>
              )}
              <p className="mt-1 text-sm text-text-secondary">Average score · {formatTime(elapsed)}</p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <Link
                  href={`/session/${initialSession.id}/results`}
                  className="rounded-lg bg-primary-container px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  View Results
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm text-text-secondary transition hover:text-text-primary"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isLoading || isComplete}
        isLoading={isLoading}
        isSilentMode={initialSession.feedbackMode === "silent"}
      />
    </div>
  );
}
