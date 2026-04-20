# Phase 1: Data Foundation — Discussion Log

> **Audit trail only.** No usar como input para agentes de planning, research o ejecución.
> Las decisiones están capturadas en CONTEXT.md — este log preserva las alternativas consideradas.

**Date:** 2026-04-19
**Phase:** 01-data-foundation
**Areas discussed:** Forma de la respuesta y tipado, Ubicación de las queries, Lógica del streak, Edge cases y validación

---

## A) Forma de la respuesta y tipado

| Opción | Descripción | Seleccionada |
|--------|-------------|-------------|
| AnalyticsData en types/analytics.ts | Source of truth único importado por route y RSC | ✓ |
| Trend: una entrada por sesión | Alta granularidad, chart ilegible con múltiples sesiones/día | |
| Trend: agrupado por día | `{ date, sessions, avgScore }` — legible | ✓ |
| topics de SessionMessage.feedback (texto) | Frágil — sin ID vinculado al QuestionBank | |
| topics de SessionMessage.criteria (Json) | Keys estructurados, señal accionable | ✓ |
| topics Opción 1: cross-category × criteria key | 16 entradas, demasiado granular para Phase 1 | |
| topics Opción 2: cross-category solo criteria key | `{ criteriaKey, avgScore, sampleCount }` | ✓ |

**User's choice:** Contrato TypeScript completo definido en la discusión (ver CONTEXT.md D-02).

**Notes:**
- Umbral: `avgScore < 60` → weak; `avgScore >= 75` → strong. Rango medio (60–74) excluido de ambos arrays.
- `byCategory` shape: `{ category, avgScore, completedSessions }` — Opción 1 sin criteria breakdown (YAGNI).
- `completedSessions` preferido sobre `sessionCount` por precisión semántica.
- `90d` detectado en código de ejemplo del usuario y explícitamente excluido del contrato — no estaba en requirements.

---

## B) Ubicación de las queries

| Opción | Descripción | Seleccionada |
|--------|-------------|-------------|
| Queries inline en el route handler | Simple pero duplica lógica si Phase 2 necesita los datos | |
| `src/lib/analytics.ts` módulo separado | Route delega, RSC importa directamente | ✓ |

**User's choice:** `src/lib/analytics.ts` — `getAnalyticsData(userId, range)`. Sin debate.

**Notes:** "El costo es cero: un archivo, función. Inline en el route = duplicar lógica en Phase 2 o hacer fetch interno (peor)."

---

## C) Lógica del streak

| Opción | Descripción | Seleccionada |
|--------|-------------|-------------|
| Solo sesiones con completedAt | Sesiones incompletas no cuentan | ✓ |
| Todas las sesiones | Incluye sesiones sin score — poco significativo | |
| Streak se rompe si no practicó hoy | Demasiado estricto | |
| Streak activo si último día es hoy o ayer | Usuario todavía tiene hoy para practicar | ✓ |

**User's choice:** Streak activo = último día activo ≤ 1 día de diferencia con hoy. Gap > 1 día = roto.

**Notes:** Algoritmo: ordenar fechas únicas desc → caminar mientras `dates[i] - dates[i+1] === 1 día`. UTC puro.

---

## D) Edge cases y validación

| Opción | Descripción | Seleccionada |
|--------|-------------|-------------|
| Zero-state con todas las llaves presentes | Front puede hacer `data.trend.map(...)` sin guardas | ✓ |
| `?range=` inválido → default silencioso | Enmascara bugs de cliente, contrato ambiguo | |
| `?range=` inválido → 400 explícito | Bug de cliente = error explícito | ✓ |

**User's choice:** Todas las llaves siempre presentes. 400 explícito en range inválido.

**Notes:** "Default silencioso enmascara bugs y hace el contrato ambiguo." Contrato VALID_RANGES: `["7d", "30d", "all"]`.

---

## Agente's Discretion

- Estrategia de `totalMinutes` (campo no existe en schema — el agente decide cómo manejarlo)
- Mínimo `sampleCount` para incluir topic en weak/strong
- Orden de `byCategory` en el response

## Deferred Ideas

- Criteria breakdown dentro de `byCategory` — Phase 3+ drill-down
- Timezone-aware streak — v2 (REQUIREMENTS.md §ENG-02)
- `totalMinutes` real con `completedAt - createdAt` — verificar consistencia en producción primero
