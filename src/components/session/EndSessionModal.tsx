"use client";

import React from "react";
import { AlertCircle, LogOut, Save, X } from "lucide-react";

interface EndSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
  onDiscard: () => void;
  isLoading?: boolean;
}

export function EndSessionModal({
  isOpen,
  onClose,
  onFinish,
  onDiscard,
  isLoading,
}: EndSessionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all animate-in fade-in duration-300">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border-subtle bg-surface-container shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-300">
        <div className="flex h-1.5 w-full bg-primary/20">
          <div className="h-full bg-primary animate-pulse w-full" />
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">¿Terminar Sesión?</h2>
          </div>
          
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">
            Estás a punto de salir de la entrevista. Puedes guardar tu progreso actual para obtener una nota parcial o descartar la sesión por completo.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={onFinish}
              disabled={isLoading}
              className="group flex w-full items-center justify-between rounded-xl bg-primary-container px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                <span>Finalizar y Guardar Nota</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-white/50 group-hover:text-white/80">Recomendado</span>
            </button>

            <button
              onClick={onDiscard}
              disabled={isLoading}
              className="flex w-full items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Descartar Sesión</span>
            </button>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-subtle bg-surface-highest/50 px-4 py-3 text-sm font-medium text-text-secondary transition hover:bg-surface-highest hover:text-text-primary disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              <span>Seguir en la Entrevista</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
