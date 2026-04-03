"use client";

import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
}

export function WaveformVisualizer({ analyserNode, isActive }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (!analyserNode || !isActive) {
        // Draw flat center line when idle
        ctx.beginPath();
        ctx.strokeStyle = "rgba(210, 187, 255, 0.25)";
        ctx.lineWidth = 1;
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteFrequencyData(dataArray);

      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        const opacity = 0.4 + (dataArray[i] / 255) * 0.6;
        ctx.fillStyle = `rgba(210, 187, 255, ${opacity})`;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
        if (x > width) break;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyserNode, isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={32}
      className="w-full rounded"
      style={{ height: 32 }}
    />
  );
}
