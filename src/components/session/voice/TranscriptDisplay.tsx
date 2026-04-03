"use client";

import { useState } from "react";
import { Pencil, X, Check } from "lucide-react";

interface TranscriptDisplayProps {
  transcript: string;
  onChange: (updated: string) => void;
  onDismiss: () => void;
}

export function TranscriptDisplay({ transcript, onChange, onDismiss }: TranscriptDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(transcript);

  const handleConfirm = () => {
    onChange(draft.trim() || transcript);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
    if (e.key === "Escape") {
      setDraft(transcript);
      setIsEditing(false);
    }
  };

  return (
    <div className="w-full rounded-xl border border-border-subtle bg-surface-container/80 px-4 py-3 backdrop-blur-sm">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="font-mono text-[10px] text-text-secondary uppercase tracking-wider">
          Transcripción
        </span>
      </div>

      {isEditing ? (
        <div className="flex items-start gap-2">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="flex-1 resize-none rounded-lg border border-primary/30 bg-surface-highest px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none"
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={handleConfirm}
              title="Confirmar edición"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary transition hover:bg-primary/20"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setDraft(transcript); setIsEditing(false); }}
              title="Cancelar"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface-highest text-text-secondary transition hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <p className="flex-1 text-sm text-text-primary leading-relaxed">{transcript}</p>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => { setDraft(transcript); setIsEditing(true); }}
              title="Editar transcripción"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface-highest text-text-secondary transition hover:text-text-primary"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDismiss}
              title="Descartar"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface-highest text-text-secondary transition hover:text-red-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
