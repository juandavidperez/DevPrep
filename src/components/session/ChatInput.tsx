"use client";

import { useState, useRef, useCallback } from "react";
import { Send, HelpCircle, X } from "lucide-react";
import { clsx } from "clsx";

interface ChatInputProps {
  onSend: (content: string, isClarification?: boolean, code?: string) => void;
  disabled: boolean;
  isLoading: boolean;
  isSilentMode?: boolean;
}

export function ChatInput({ onSend, disabled, isLoading, isSilentMode = false }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isClarifying, setIsClarifying] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, isClarifying);
    setValue("");
    setIsClarifying(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, isClarifying, onSend]);

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

  return (
    <div className="shrink-0 border-t border-border-subtle bg-surface-container/80 p-4 backdrop-blur-lg">
      {isClarifying && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <HelpCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="flex-1 text-xs text-primary">
            Clarification mode — your message will be answered without advancing the question.
          </p>
          <button onClick={toggleClarify} className="text-primary/60 hover:text-primary transition">
            <X className="h-3.5 w-3.5" />
          </button>
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
