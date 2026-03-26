"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const LANGUAGES = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "java", label: "Java" },
  { value: "python", label: "Python" },
  { value: "sql", label: "SQL" },
  { value: "go", label: "Go" },
];

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  const [language, setLanguage] = useState("typescript");
  const [langOpen, setLangOpen] = useState(false);

  const selectedLabel = LANGUAGES.find((l) => l.value === language)?.label ?? language;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-[#0e0e0e]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        </div>

        {/* Language selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs text-text-secondary transition hover:bg-surface-highest hover:text-text-primary"
          >
            {selectedLabel}
            <ChevronDown className="h-3 w-3" />
          </button>

          {langOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-border-subtle bg-surface-container shadow-lg">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.value);
                    setLangOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left font-mono text-xs text-text-secondary transition hover:bg-surface-highest hover:text-text-primary"
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <MonacoEditor
        height="220px"
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        theme="vs-dark"
        options={{
          fontSize: 13,
          fontFamily: "JetBrains Mono, monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          renderLineHighlight: "none",
          overviewRulerLanes: 0,
          padding: { top: 12, bottom: 12 },
          scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
        }}
      />
    </div>
  );
}
