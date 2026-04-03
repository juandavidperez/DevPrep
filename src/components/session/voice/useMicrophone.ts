"use client";

import { useState, useRef, useCallback } from "react";

export type MicStatus = "idle" | "requesting" | "recording" | "processing" | "error";

export interface MicrophoneState {
  status: MicStatus;
  errorMessage: string | null;
  audioBlob: Blob | null;
  analyserNode: AnalyserNode | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  reset: () => void;
}

function getSupportedMimeType(): string {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "audio/webm"; // fallback
}

export function useMicrophone(): MicrophoneState {
  const [status, setStatus] = useState<MicStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startRecording = useCallback(async () => {
    setStatus("requesting");
    setErrorMessage(null);
    setAudioBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up Web Audio analyser for waveform visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      setAnalyserNode(analyser);

      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setStatus("processing");

        // Cleanup audio context and stream
        stream.getTracks().forEach((t) => t.stop());
        audioContext.close();
        setAnalyserNode(null);
      };

      mediaRecorder.start(100); // collect chunks every 100ms
      setStatus("recording");
    } catch (err) {
      const error = err as { name?: string; message?: string };
      let message = "Microphone unavailable";
      if (error.name === "NotAllowedError") message = "Microphone access denied";
      if (error.name === "NotFoundError") message = "No microphone found";
      setErrorMessage(message);
      setStatus("error");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    // Ensure any lingering stream is stopped
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close();
    setStatus("idle");
    setErrorMessage(null);
    setAudioBlob(null);
    setAnalyserNode(null);
  }, []);

  return { status, errorMessage, audioBlob, analyserNode, startRecording, stopRecording, reset };
}
