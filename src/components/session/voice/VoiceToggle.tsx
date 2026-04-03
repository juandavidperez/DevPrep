"use client";

import { Keyboard, Mic } from "lucide-react";
import { clsx } from "clsx";

interface VoiceToggleProps {
  inputModality: "text" | "voice";
  onChange: (modality: "text" | "voice") => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function VoiceToggle({
  inputModality,
  onChange,
  disabled = false,
  disabledReason,
}: VoiceToggleProps) {
  const isVoice = inputModality === "voice";

  const handleToggle = () => {
    if (disabled) return;

    // Check browser support before switching to voice
    if (!isVoice && typeof navigator !== "undefined") {
      if (!navigator.mediaDevices?.getUserMedia) {
        // Cannot switch to voice — browser doesn't support it
        return;
      }
    }
    onChange(isVoice ? "text" : "voice");
  };

  const title = disabledReason
    ? disabledReason
    : isVoice
    ? "Cambiar a modo texto"
    : "Cambiar a modo voz";

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      title={title}
      className={clsx(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-xs transition disabled:cursor-not-allowed disabled:opacity-40",
        isVoice
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border-subtle bg-surface-highest text-text-secondary hover:text-text-primary"
      )}
    >
      {isVoice ? <Mic className="h-3.5 w-3.5" /> : <Keyboard className="h-3.5 w-3.5" />}
      {isVoice ? "Voz" : "Texto"}
    </button>
  );
}
