"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, ArrowLeft, Clock } from "lucide-react";
import { Link } from "@/navigation";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { VoiceToggle } from "./voice/VoiceToggle";
import { transcribeAudio, synthesizeAudio } from "@/lib/interaction";
import type { SessionMessageDTO, SendMessageResponse } from "@/types/session";

interface SessionData {
  id: string;
  category: string;
  difficulty: string;
  totalQuestions: number;
  completedAt: string | null;
  score: number | null;
  feedbackMode: string;
  inputModality: string;
  language: string;
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

  // Phase 2: voice state
  const [inputModality, setInputModality] = useState<"text" | "voice">(
    initialSession.inputModality === "voice" ? "voice" : "text"
  );
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // Map messageId → Blob URL for TTS audio (in-memory only, not stored in DB)
  const [audioUrls, setAudioUrls] = useState<Map<string, string>>(new Map());
  // TTS speed: 0.75 | 1 | 1.25 | 1.5
  const [ttsSpeed, setTtsSpeed] = useState<number>(1);
  // Audio chaining: evaluation ends → next question auto-plays
  const [lastEvalId, setLastEvalId] = useState<string | null>(null);
  const [chainPlayId, setChainPlayId] = useState<string | null>(null);

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
      bookmarkId: null,
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

      // Phase 2: synthesize TTS for new AI messages in voice mode
      if (inputModality === "voice") {
        // Track the new evaluation and next question for chaining
        const newEval = data.messages.find((m) => m.messageType === "evaluation");
        const newQuestion = data.messages.find(
          (m) => m.role === "interviewer" && m.messageType === "question"
        );
        if (newEval) setLastEvalId(newEval.id);
        setChainPlayId(null); // reset chain until evaluation ends

        for (const msg of data.messages) {
          if (msg.role === "interviewer") {
            const textToRead = msg.feedback || msg.content;
            synthesizeTTS(msg.id, textToRead, newQuestion?.id ?? null);
          }
        }
      }

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

  // Phase 2: handle recording complete → STT via InteractionManager
  const handleVoiceRecordingComplete = async (blob: Blob) => {
    setVoiceError(null);
    setIsLoading(true);
    const transcript = await transcribeAudio(blob, {
      sessionId: initialSession.id,
      language: (initialSession.language || "en") as "en" | "es",
    });
    setIsLoading(false);
    if (transcript) {
      setPendingTranscript(transcript);
    } else {
      setVoiceError("Voz no disponible, volviendo a modo texto");
      setInputModality("text");
    }
  };

  // Phase 2: TTS via InteractionManager — stores blob URL keyed by messageId
  const synthesizeTTS = async (messageId: string, text: string, _nextQuestionId: string | null = null) => {
    const url = await synthesizeAudio(text, {
      language: (initialSession.language || "en") as "en" | "es",
      speed: ttsSpeed,
    });
    if (url) {
      setAudioUrls((prev) => new Map(prev).set(messageId, url));
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

        <div className="flex items-center gap-3">
          {/* Voice/Text toggle */}
          <VoiceToggle
            inputModality={inputModality}
            onChange={setInputModality}
            disabled={isComplete || initialSession.feedbackMode === "silent"}
            disabledReason={
              initialSession.feedbackMode === "silent"
                ? "El modo voz no está disponible en sesiones silenciosas"
                : undefined
            }
          />

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
            <MessageBubble
              key={msg.id}
              message={msg}
              onDemandAudioUrl={audioUrls.get(msg.id)}
              onRequestTTS={
                inputModality === "voice"
                  ? (text) => synthesizeTTS(msg.id, text)
                  : undefined
              }
              triggerPlay={chainPlayId === msg.id}
              onAudioEnded={
                msg.id === lastEvalId
                  ? () => {
                      // Find the question that comes right after this evaluation
                      const evalIdx = messages.findIndex((m) => m.id === lastEvalId);
                      const nextQ = messages.slice(evalIdx + 1).find(
                        (m) => m.role === "interviewer" && m.messageType === "question"
                      );
                      if (nextQ) setChainPlayId(nextQ.id);
                    }
                  : undefined
              }
            />
          ))}

          {/* AI thinking indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-border-subtle bg-surface-container px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500/60" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500/60" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500/60" style={{ animationDelay: "300ms" }} />
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

          {/* Voice error toast */}
          {voiceError && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400">
              {voiceError}
              <button
                onClick={() => setVoiceError(null)}
                className="ml-2 underline hover:text-amber-300"
              >
                OK
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
        isCodeSession={initialSession.category === "coding"}
        inputModality={inputModality}
        onVoiceRecordingComplete={handleVoiceRecordingComplete}
        onMicError={(msg) => {
          setVoiceError(msg);
          setInputModality("text");
        }}
        pendingTranscript={pendingTranscript}
        onTranscriptChange={setPendingTranscript}
        onTranscriptDismiss={() => setPendingTranscript(null)}
        ttsSpeed={ttsSpeed}
        onTtsSpeedChange={setTtsSpeed}
      />
    </div>
  );
}
