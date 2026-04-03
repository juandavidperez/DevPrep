"use client";

import { useState, useRef, useCallback } from "react";
import { Send, HelpCircle, X, Code2 } from "lucide-react";
import { clsx } from "clsx";
import { CodeEditor } from "./CodeEditor";
import { MicButton } from "./voice/MicButton";
import { TranscriptDisplay } from "./voice/TranscriptDisplay";

const TTS_SPEEDS = [
  { value: 0.75, label: "0.75×" },
  { value: 1,    label: "1×"    },
  { value: 1.25, label: "1.25×" },
  { value: 1.5,  label: "1.5×"  },
];

interface ChatInputProps {
  onSend: (content: string, isClarification?: boolean, code?: string) => void;
  disabled: boolean;
  isLoading: boolean;
  isSilentMode?: boolean;
  isCodeSession?: boolean;
  // Phase 2
  inputModality?: "text" | "voice";
  onVoiceRecordingComplete?: (blob: Blob) => void;
  onMicError?: (message: string) => void;
  pendingTranscript?: string | null;
  onTranscriptChange?: (updated: string) => void;
  onTranscriptDismiss?: () => void;
  ttsSpeed?: number;
  onTtsSpeedChange?: (speed: number) => void;
}

export function ChatInput({
  onSend,
  disabled,
  isLoading,
  isSilentMode = false,
  isCodeSession = false,
  inputModality = "text",
  onVoiceRecordingComplete,
  onMicError,
  pendingTranscript,
  onTranscriptChange,
  onTranscriptDismiss,
  ttsSpeed = 1,
  onTtsSpeedChange,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isClarifying, setIsClarifying] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [codeValue, setCodeValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, isClarifying, showEditor && codeValue.trim() ? codeValue : undefined);
    setValue("");
    setIsClarifying(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, isClarifying, onSend, showEditor, codeValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  };

  const toggleClarify = () => {
    setIsClarifying((prev) => !prev);
    setValue("");
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const toggleEditor = () => {
    setShowEditor((prev) => !prev);
    if (showEditor) setCodeValue("");
  };

  // ── Voice mode path ───────────────────────────────────────────────────────
  if (inputModality === "voice") {
    const canSendVoice = !!pendingTranscript && !disabled && !isLoading;
    return (
      <div className="shrink-0 border-t border-border-subtle bg-surface-container/80 p-4 backdrop-blur-lg">
        {/* Clarification banner stays available in voice mode */}
        {isClarifying && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
            <HelpCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="flex-1 text-xs text-primary">
              Modo aclaración — graba tu pregunta sin avanzar la entrevista.
            </p>
            <button onClick={toggleClarify} className="text-primary/60 transition hover:text-primary">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          {/* Transcript preview — shown after STT */}
          {pendingTranscript && onTranscriptChange && onTranscriptDismiss && (
            <div className="w-full max-w-md">
              <TranscriptDisplay
                transcript={pendingTranscript}
                onChange={onTranscriptChange}
                onDismiss={onTranscriptDismiss}
              />
            </div>
          )}

          {/* Mic button + TTS speed — hidden when transcript is ready */}
          {!pendingTranscript && (
            <div className="flex flex-col items-center gap-3">
              <MicButton
                onRecordingComplete={onVoiceRecordingComplete ?? (() => {})}
                onError={onMicError ?? (() => {})}
                disabled={disabled || isLoading}
              />
              {/* TTS speed selector */}
              {onTtsSpeedChange && (
                <div className="flex items-center gap-1">
                  <span className="mr-1 font-mono text-[9px] uppercase tracking-wider text-text-secondary">
                    Velocidad TTS
                  </span>
                  {TTS_SPEEDS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => onTtsSpeedChange(s.value)}
                      className={clsx(
                        "rounded-full px-2 py-0.5 font-mono text-[10px] transition",
                        ttsSpeed === s.value
                          ? "bg-primary/20 text-primary"
                          : "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Send button — enabled only when transcript exists */}
          {pendingTranscript && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (!canSendVoice) return;
                  onSend(pendingTranscript, isClarifying);
                  onTranscriptDismiss?.();
                  setIsClarifying(false);
                }}
                disabled={!canSendVoice}
                className="flex items-center gap-2 rounded-xl bg-primary-container px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                {isClarifying ? "Enviar aclaración" : "Enviar respuesta"}
              </button>
              <button
                type="button"
                onClick={toggleClarify}
                disabled={disabled}
                title={isClarifying ? "Cancelar aclaración" : "Hacer una aclaración"}
                className={clsx(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition disabled:opacity-40",
                  isClarifying
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border-subtle bg-surface-highest text-text-secondary hover:text-text-primary"
                )}
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
  // ── End voice mode path ───────────────────────────────────────────────────

  return (
    <div className="shrink-0 border-t border-border-subtle bg-surface-container/80 p-4 backdrop-blur-lg">
      {/* Clarification banner */}
      {isClarifying && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <HelpCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="flex-1 text-xs text-primary">
            Clarification mode — your message will be answered without advancing the question.
          </p>
          <button onClick={toggleClarify} className="text-primary/60 transition hover:text-primary">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Monaco editor */}
      {showEditor && (
        <div className="mb-3">
          <CodeEditor value={codeValue} onChange={setCodeValue} />
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Clarification toggle */}
        <button
          type="button"
          onClick={toggleClarify}
          disabled={disabled}
          title={isClarifying ? "Cancel clarification" : "Ask a clarification question"}
          className={clsx(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition disabled:opacity-40",
            isClarifying
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border-subtle bg-surface-highest text-text-secondary hover:text-text-primary"
          )}
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        {/* Code editor toggle — only for coding sessions */}
        {isCodeSession && (
          <button
            type="button"
            onClick={toggleEditor}
            disabled={disabled}
            title={showEditor ? "Hide code editor" : "Open code editor"}
            className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition disabled:opacity-40",
              showEditor
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                : "border-border-subtle bg-surface-highest text-text-secondary hover:text-text-primary"
            )}
          >
            <Code2 className="h-4 w-4" />
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          placeholder={
            isLoading
              ? "AI is thinking..."
              : isClarifying
              ? "Ask your clarification question…"
              : isSilentMode
              ? "Type your answer… answers are evaluated at the end (Ctrl+Enter)"
              : showEditor
              ? "Explain your approach… (Ctrl+Enter to send with code)"
              : "Type your answer… (Ctrl+Enter to send)"
          }
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border-subtle bg-surface-highest px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none disabled:opacity-50"
        />

        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className={clsx(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition hover:opacity-90 disabled:opacity-40",
            isClarifying ? "bg-primary/70" : "bg-primary-container"
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-2 text-center font-mono text-[10px] text-text-secondary">
        {isClarifying ? "Ctrl+Enter to send clarification" : "Ctrl+Enter to send"}
      </p>
    </div>
  );
}
