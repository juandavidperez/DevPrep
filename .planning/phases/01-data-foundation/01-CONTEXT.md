# Phase 1: Data Foundation — Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Construir el módulo `src/lib/analytics.ts` con las queries Prisma y el endpoint autenticado `GET /api/analytics?range=` que retorna datos de analíticas tipados y completos. Esta fase no toca ningún componente de UI — es exclusivamente la capa de datos contra la que todas las fases de UI futuras construirán.

Requirements cubiertos: API-01, API-02
</domain>

<decisions>
## Implementation Decisions

### A) Forma de la respuesta y tipado

- **D-01:** Exportar `AnalyticsData` y `AnalyticsRange` desde `src/types/analytics.ts` — source of truth único. El API route y el RSC de Phase 2 lo importan directamente.

- **D-02:** Contrato TypeScript sellado:

```ts
// src/types/analytics.ts
export type AnalyticsRange = "7d" | "30d" | "all";

export interface AnalyticsData {
  overview: {
    totalSessions: number;
    avgScore: number | null;      // null cuando no hay sesiones completadas
    totalMinutes: number;
    currentStreak: number;
  };
  trend: {
    date: string;                 // "YYYY-MM-DD" UTC
    sessions: number;
    avgScore: number | null;
  }[];
  topics: {
    weak:   { criteriaKey: string; avgScore: number; sampleCount: number }[];
    strong: { criteriaKey: string; avgScore: number; sampleCount: number }[];
  };
  byCategory: {
    category: string;
    avgScore: number | null;
    completedSessions: number;
  }[];
}
```

- **D-03:** `trend` agrupa por día (UTC), no por sesión. Formato de entrada: `{ date: "2026-04-19", sessions: 3, avgScore: 72 }`. Una sesión por entrada hace el chart ilegible con múltiples sesiones en un día.

- **D-04:** `topics.weak` / `topics.strong` se calculan desde `SessionMessage.criteria` (el campo `Json`), agrupados cross-category por `criteriaKey`. Ejemplo: `{ criteriaKey: "depth", avgScore: 42, sampleCount: 12 }`. No se usa el texto de la pregunta (frágil, sin ID vinculado al QuestionBank).

- **D-05:** Umbral de clasificación de topics: `avgScore < 60` → weak; `avgScore >= 75` → strong. El rango medio (60–74) no aparece en ninguno de los dos arrays.

- **D-06:** `byCategory` shape: `{ category: string; avgScore: number | null; completedSessions: number }`. No incluye `criteria` breakdown — eso es YAGNI para Phase 3+. El bar chart solo necesita `avgScore`.

- **D-07:** `completedSessions` (no `sessionCount`) en `byCategory` — solo sesiones con `completedAt IS NOT NULL` tienen score significativo.

### B) Ubicación de las queries

- **D-08:** Módulo dedicado `src/lib/analytics.ts` que exporta `getAnalyticsData(userId: string, range: AnalyticsRange): Promise<AnalyticsData>`. El API route delega a esta función. El RSC de Phase 2 la importa directamente (sin fetch interno). Costo cero: un archivo, un source of truth.

### C) Lógica del streak

- **D-09:** Solo sesiones con `completedAt IS NOT NULL` cuentan para el streak.

- **D-10:** Granularidad: `completedAt` truncado a fecha UTC (`YYYY-MM-DD`).

- **D-11:** Definición de streak activo: días consecutivos terminando en hoy **o ayer** — el usuario todavía tiene hoy para practicar. Se rompe cuando el gap entre el último día activo y hoy es > 1 día.

  ```
  last_active = 2026-04-18, hoy = 2026-04-19 → gap = 1 → streak activo ✓
  last_active = 2026-04-17, hoy = 2026-04-19 → gap = 2 → streak roto = 0
  ```

- **D-12:** Algoritmo: ordenar fechas únicas desc → caminar mientras `dates[i] - dates[i+1] === 1 día`.

### D) Edge cases y validación

- **D-13:** Todas las llaves siempre presentes — nunca `undefined` o missing keys. El front-end puede hacer `data.trend.map(...)` sin guardas opcionales. Zero-state:

  ```ts
  {
    overview: { totalSessions: 0, avgScore: null, totalMinutes: 0, currentStreak: 0 },
    trend: [],
    topics: { weak: [], strong: [] },
    byCategory: [],
  }
  ```

- **D-14:** `?range=` inválido → `400` explícito con mensaje. Default silencioso enmascara bugs de cliente y hace el contrato ambiguo.

  ```ts
  const VALID_RANGES = ["7d", "30d", "all"] as const;
  export type AnalyticsRange = typeof VALID_RANGES[number];
  // "90d" explícitamente excluido — no estaba en requirements
  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json({ error: "Invalid range. Use: 7d, 30d, all" }, { status: 400 });
  }
  ```

- **D-15:** Request sin auth → `401`. Patrón existente: `const session = await auth(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })`.

### Agente's Discretion

- Estrategia de manejo de `totalMinutes` — no hay campo `duration` en el schema actual. El agente decide si omitirlo (hardcode 0), estimarlo (preguntas × tiempo promedio), o calcularlo con `completedAt` - `createdAt`.
- Mínimo `sampleCount` para incluir un topic en weak/strong — el agente decide el umbral (sugerencia: ≥ 3 muestras para no contaminar con outliers).
- Orden de `byCategory` en el response (el front se encarga de ordenar para el chart, pero un orden consistente en la API ayuda).

</decisions>

<canonical_refs>
## Canonical References

**Los agentes downstream DEBEN leer estos archivos antes de planificar o implementar.**

### Schema y modelos
- `prisma/schema.prisma` — Modelos `Session` (campos: `isDemo`, `category`, `difficulty`, `score`, `completedAt`, `createdAt`, `userId`) y `SessionMessage` (campos: `score`, `criteria` Json, `createdAt`, `sessionId`)

### Patrones de API existentes
- `src/app/api/sessions/route.ts` — Ejemplo canónico de route handler: auth check, validación de input, respuesta con `NextResponse.json()`, manejo de errores
- `src/lib/db.ts` — Singleton de Prisma; siempre importar `prisma` desde aquí

### Tipos existentes
- `src/types/session.ts` — Patrón de tipos de DTO para referencia de estilo

### Constraints del proyecto
- `.planning/PROJECT.md` §Constraints — Stack obligatorio (Next.js 15, Prisma + Supabase `devprep` schema, Auth.js v5); `prisma migrate dev` cuelga → usar Supabase MCP `apply_migration`
- `.planning/REQUIREMENTS.md` §Data Layer — API-01, API-02 (criterios de aceptación de la fase)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/db.ts` → `prisma`: Singleton PrismaClient listo para importar
- `src/lib/auth.ts` → `auth()`: Función de Auth.js v5 para obtener sesión; patrón de auth ya establecido
- `NextResponse` de `next/server`: Patrón de respuesta en todos los route handlers existentes

### Established Patterns
- Auth check: `const session = await auth(); if (!session?.user?.id) return 401` — copiar exactamente
- Route handlers en `src/app/api/[resource]/route.ts` — seguir la estructura existente para el nuevo `src/app/api/analytics/route.ts`
- Prisma queries directas en lib functions, no en route handlers — `src/lib/analytics.ts` sigue este patrón
- `isDemo: false` filter en todas las queries — sesiones demo excluidas de aggregations

### Integration Points
- Nuevo archivo: `src/types/analytics.ts` — importado por `src/lib/analytics.ts` y `src/app/api/analytics/route.ts`
- Nuevo archivo: `src/lib/analytics.ts` — importado por el API route y (Phase 2) el RSC `src/app/[locale]/analytics/page.tsx`
- Nuevo route: `src/app/api/analytics/route.ts` — se agrega junto a los routes existentes en `src/app/api/`

</code_context>

<specifics>
## Specific Ideas

- El usuario quiere que `trend` sea legible — un dato por día, no por sesión. Prioridad: utilidad del chart sobre granularidad de datos.
- El usuario prefirió Opción 2 (cross-category) para topics porque Opción 1 (6 categorías × 4 criteria keys) es demasiado granular para Phase 1. Si Phase 3 necesita drill-down, se añade entonces.
- `completedSessions` elegido explícitamente sobre `sessionCount` para precisión semántica — sesiones sin `completedAt` no tienen score significativo.
- `90d` excluido conscientemente del contrato — no estaba en requirements; se detectó y removió durante la discusión.

</specifics>

<deferred>
## Deferred Ideas

- Criteria breakdown dentro de `byCategory` (p.ej. `criteria: { correctness: 68, depth: 74 }`) — posible drill-down para Phase 3+. No incluir en Phase 1.
- Timezone-aware streak (pasar timezone del browser en el request) — listado en REQUIREMENTS.md §v2 como ENG-02. UTC suficiente para este milestone.
- `totalMinutes` real con `completedAt - createdAt` — requiere verificar que `completedAt` esté poblado consistentemente en producción; el agente puede hardcodear 0 o estimar.

</deferred>

---

*Phase: 01-data-foundation*
*Context gathered: 2026-04-19*
