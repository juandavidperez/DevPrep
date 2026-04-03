"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

interface AudioPlaybackProps {
  src: string;
  autoPlay?: boolean;
  /** When this flips to true, play immediately (used for chaining evaluation→question). */
  triggerPlay?: boolean;
  onEnded?: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function AudioPlayback({ src, autoPlay = true, triggerPlay = false, onEnded }: AudioPlaybackProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Load src and optionally auto-play on mount
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    audio.src = src;

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEndedHandler = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEndedHandler);

    if (autoPlay) {
      audio.play().catch(() => {
        // Auto-play blocked by browser — user must click manually
      });
    }

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEndedHandler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Reactive play trigger — used for chaining (evaluation ends → question plays)
  useEffect(() => {
    const audio = audioRef.current;
    if (triggerPlay && audio && src) {
      audio.play().catch(() => {});
    }
  }, [triggerPlay, src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  };

  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-lowest px-3 py-2">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" className="hidden" />

      <Volume2 className="h-3.5 w-3.5 shrink-0 text-primary/60" />

      <button
        onClick={togglePlay}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition hover:bg-primary/25"
        title={isPlaying ? "Pausar" : "Reproducir"}
      >
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </button>

      <div
        className="relative h-1 flex-1 cursor-pointer overflow-hidden rounded-full bg-surface-highest"
        onClick={handleProgressClick}
      >
        <div
          className="h-full rounded-full bg-primary/60 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="shrink-0 font-mono text-[10px] text-text-secondary">
        {formatDuration(currentTime)}/{formatDuration(duration)}
      </span>
    </div>
  );
}
