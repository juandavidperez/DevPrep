"use client";

import { useEffect, useRef } from "react";
import { Mic, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { useMicrophone } from "./useMicrophone";
import { WaveformVisualizer } from "./WaveformVisualizer";

interface MicButtonProps {
  onRecordingComplete: (blob: Blob) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function MicButton({ onRecordingComplete, onError, disabled = false }: MicButtonProps) {
  const { status, errorMessage, audioBlob, analyserNode, startRecording, stopRecording, reset } =
    useMicrophone();

  // When audioBlob is ready (status === "processing"), notify parent
  useEffect(() => {
    if (audioBlob && status === "processing") {
      onRecordingComplete(audioBlob);
      reset();
    }
  }, [audioBlob, status, onRecordingComplete, reset]);

  // Surface mic errors to parent
  useEffect(() => {
    if (status === "error" && errorMessage) {
      onError(errorMessage);
      reset();
    }
  }, [status, errorMessage, onError, reset]);

  const isRecording = status === "recording";
  const isProcessing = status === "processing" || status === "requesting";

  // Spacebar shortcut: hold to record, release to stop
  const spaceHeldRef = useRef(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || disabled || isProcessing) return;
      // Don't hijack spacebar inside text inputs / textareas
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      e.preventDefault();
      if (!spaceHeldRef.current) {
        spaceHeldRef.current = true;
        startRecording();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (spaceHeldRef.current) {
        spaceHeldRef.current = false;
        if (isRecording) stopRecording();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [disabled, isProcessing, isRecording, startRecording, stopRecording]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (disabled || isProcessing) return;
    startRecording();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isRecording) stopRecording();
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isRecording) stopRecording();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Waveform — visible only while recording */}
      {isRecording && (
        <div className="w-48 overflow-hidden rounded-lg border border-primary/20 bg-surface-lowest px-2 py-1">
          <WaveformVisualizer analyserNode={analyserNode} isActive={isRecording} />
        </div>
      )}

      {/* Mic button */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onTouchStart={(e) => { e.preventDefault(); if (!disabled && !isProcessing) startRecording(); }}
        onTouchEnd={(e) => { e.preventDefault(); if (isRecording) stopRecording(); }}
        disabled={disabled || isProcessing}
        title={isRecording ? "Release to transcribe" : "Hold to record"}
        className={clsx(
          "flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-150 select-none",
          "disabled:cursor-not-allowed disabled:opacity-40",
          isRecording
            ? "scale-110 border-primary/60 bg-primary/15 shadow-[0_0_24px_rgba(210,187,255,0.25)]"
            : "border-border-subtle bg-surface-highest hover:border-primary/30 hover:bg-surface-highest"
        )}
      >
        {isProcessing ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : isRecording ? (
          <Mic className="h-6 w-6 text-primary" />
        ) : (
          <Mic className="h-6 w-6 text-text-secondary" />
        )}
      </button>

      <p className="font-mono text-[10px] text-text-secondary">
        {isProcessing ? "Transcribiendo…" : isRecording ? "Suelta para enviar" : "Mantén · o · Espacio"}
      </p>
    </div>
  );
}
