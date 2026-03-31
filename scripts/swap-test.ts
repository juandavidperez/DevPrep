#!/usr/bin/env tsx
/**
 * Swap Test — runs the same question+response against all configured AI providers
 * and asserts that every response validates against the shared Evaluation schema.
 *
 * Usage:
 *   npx tsx scripts/swap-test.ts
 *
 * Required env vars per provider:
 *   ANTHROPIC_API_KEY  (anthropic)
 *   GEMINI_API_KEY     (gemini)
 *   OPENAI_API_KEY     (openai)
 *   OLLAMA_BASE_URL    (ollama — must be running locally)
 *
 * A provider is skipped if its API key is missing (or Ollama is unreachable).
 */

import { z } from "zod";
import { AnthropicProvider } from "../src/lib/ai/providers/anthropic";
import { GeminiProvider } from "../src/lib/ai/providers/gemini";
import { OpenAIProvider } from "../src/lib/ai/providers/openai";
import { OllamaProvider } from "../src/lib/ai/providers/ollama";
import type { AIProvider, Question } from "../src/lib/ai/types";

// ── Fixture ───────────────────────────────────────────────────────────────────

const QUESTION: Question = {
  id: "swap-test-001",
  text: "Explain the difference between NgOnInit and the constructor in Angular. When would you use each?",
  category: "technical",
  difficulty: "mid",
  hints: [],
  evaluationCriteria: [
    "Correctly distinguishes constructor (DI) from ngOnInit (lifecycle hook)",
    "Mentions async operations belong in ngOnInit, not constructor",
  ],
} as Question & { evaluationCriteria: string[] };

const RESPONSE =
  "The constructor is called by Angular's DI system when the class is instantiated. " +
  "It should only be used for dependency injection. NgOnInit is the first lifecycle hook, " +
  "called after Angular has initialized all data-bound properties. " +
  "You should use ngOnInit for any initialization that depends on @Input() values or " +
  "for async operations like HTTP calls.";

// ── Schema ────────────────────────────────────────────────────────────────────

const EvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  criteria: z
    .record(z.string(), z.number().min(0).max(100))
    .refine((obj) => Object.keys(obj).length >= 2, {
      message: "At least 2 criteria required",
    }),
  feedback: z.string().min(10),
  modelAnswer: z.string().optional(),
});

// ── Providers ─────────────────────────────────────────────────────────────────

const PROVIDERS: Array<{ name: string; factory: () => AIProvider; requiredEnv?: string }> = [
  {
    name: "anthropic",
    factory: () => new AnthropicProvider(),
    requiredEnv: "ANTHROPIC_API_KEY",
  },
  {
    name: "gemini",
    factory: () => new GeminiProvider(),
    requiredEnv: "GEMINI_API_KEY",
  },
  {
    name: "openai",
    factory: () => new OpenAIProvider(),
    requiredEnv: "OPENAI_API_KEY",
  },
  {
    name: "ollama",
    factory: () => new OllamaProvider(),
  },
];

// ── Runner ────────────────────────────────────────────────────────────────────

type Result =
  | { provider: string; status: "pass"; score: number; criteriaKeys: string[]; ms: number }
  | { provider: string; status: "skip"; reason: string }
  | { provider: string; status: "fail"; error: string; ms: number };

async function runProvider(name: string, factory: () => AIProvider): Promise<Result> {
  const start = Date.now();
  try {
    const provider = factory();
    const evaluation = await provider.evaluateResponse(QUESTION, RESPONSE);
    const ms = Date.now() - start;

    const parsed = EvaluationSchema.safeParse(evaluation);
    if (!parsed.success) {
      return {
        provider: name,
        status: "fail",
        error: `Schema validation failed: ${parsed.error.message}`,
        ms,
      };
    }

    return {
      provider: name,
      status: "pass",
      score: Math.round(parsed.data.score),
      criteriaKeys: Object.keys(parsed.data.criteria),
      ms,
    };
  } catch (err) {
    return {
      provider: name,
      status: "fail",
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - start,
    };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║               DevPrep — AI Provider Swap Test            ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`\nQuestion: "${QUESTION.text}"\n`);

  const results: Result[] = [];

  for (const { name, factory, requiredEnv } of PROVIDERS) {
    if (requiredEnv && !process.env[requiredEnv]) {
      results.push({ provider: name, status: "skip", reason: `${requiredEnv} not set` });
      continue;
    }
    process.stdout.write(`  Running ${name.padEnd(12)}... `);
    const result = await runProvider(name, factory);
    results.push(result);

    if (result.status === "pass") {
      console.log(`✅ PASS  score=${result.score}  criteria=[${result.criteriaKeys.join(", ")}]  ${result.ms}ms`);
    } else if (result.status === "skip") {
      console.log(`⏭  SKIP  ${result.reason}`);
    } else {
      console.log(`❌ FAIL  ${result.ms}ms`);
      console.log(`         ${result.error}`);
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const skipped = results.filter((r) => r.status === "skip").length;

  console.log("\n──────────────────────────────────────────────────────────");
  console.log(`  Results: ${passed} passed · ${failed} failed · ${skipped} skipped`);

  if (failed > 0) {
    console.log("\n  ⚠️  Some providers failed — check API keys and connectivity.");
    process.exit(1);
  } else {
    console.log("\n  All tested providers return a valid Evaluation schema. ✅");
  }
}

main();
