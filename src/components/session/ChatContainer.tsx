"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
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
}

interface ChatContainerProps {
  initialSession: SessionData;
  initialMessages: SessionMessageDTO[];
}

export function ChatContainer({ initialSession, initialMessages }: ChatContainerProps) {
  const [messages, setMessages] = useState<SessionMessageDTO[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(!!initialSession.completedAt);
  const [finalScore, setFinalScore] = useState<number | null>(initialSession.score);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentQuestion = messages.filter((m) => m.messageType === "question").length;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (content: string) => {
    setError(null);
    setIsLoading(true);

    // Optimistically add user message
    const optimisticMsg: SessionMessageDTO = {
      id: `temp-${Date.now()}`,
      role: "candidate",
      content,
      codeContent: null,
      messageType: "message",
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
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      const data: SendMessageResponse = await res.json();

      // Replace optimistic message with server response
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
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold capitalize">
              {initialSession.category.replace("_", " ")} Interview
            </h1>
            <p className="text-xs text-slate-400 capitalize">
              {initialSession.difficulty} level
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium">
            {currentQuestion} / {initialSession.totalQuestions}
          </span>
          <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{
                width: `${(currentQuestion / initialSession.totalQuestions) * 100}%`,
              }}
            />
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-slate-800 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

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

          {isComplete && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <h2 className="text-lg font-semibold text-emerald-400">
                Session Complete!
              </h2>
              {finalScore !== null && (
                <p className="mt-2 text-3xl font-bold text-white">
                  {finalScore}/100
                </p>
              )}
              <p className="mt-1 text-sm text-slate-400">Average score</p>
              <Link
                href="/dashboard"
                className="mt-4 inline-block rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Back to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isLoading || isComplete}
        isLoading={isLoading}
      />
    </div>
  );
}
