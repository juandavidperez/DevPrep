# Avatar DevPrep — Contexto completo

## Proyecto
Avatar 2D desarrollador para DevPrep (plataforma mock interviews con IA).
Estética Obsidian Terminal. Artboard 600x700, fondo transparente.

---

## Regla crítica de ownership
**Una propiedad = un solo layer dueño.** Si una propiedad está en Expression
Layer, no puede aparecer en Body Layer ni con valor 0.

---

## Jerarquía completa

```
Root (X295, Y685, length 75, rot -90)
└── Spine (length 125, scale X100% Y100%, rot 0)
    ├── Torso (X320, Y-335, scale 100%/100%, rot 90)
    └── Neck (length 80, scale 100%/100%, rot 0) — reposo rot Z = 0
        └── Head bone (length 265, rot 0) — reposo rot Z = 0
            ├── Hair (X435, Y-230, scale 85%/80%, rot 90)
            ├── Brow L bone (X245, Y-20, length 60, rot -90)
            │   └── L Brow (X0, Y0, scale 30%/-35%, rot 0)
            ├── Brow R bone (X225, Y20, length 60, rot 90)
            │   └── R Brow (X0, Y0, scale 30%/35%, rot 0)
            ├── Eye L bone (X175, Y-60, length 35, rot 90)
            │   ├── L Eye (X0, Y0, scale 100%/100%, rot 0)
            │   │   ├── L parpado (X-33, Y-33, scale 25%/40%, rot 0)
            │   │   ├── L iris (X-20, Y-25, scale 20%/25%, rot 0)
            │   │   └── L esclera (X-35, Y-30, scale 30%/30%, rot 0)
            │   └── Eye closed L (X-45, Y-20, scale 30%/30%, rot 0)
            ├── Eye R bone (X175, Y60, length 35, rot -90)
            │   ├── R Eye (X0, Y0, scale 100%/-100%, rot 0)
            │   │   ├── R parpado (X-33, Y-33, scale 25%/40%, rot 0)
            │   │   ├── R iris (X35, Y-25, scale -20%/25%, rot 0)
            │   │   └── R esclera (X-35, Y-30, scale 30%/30%, rot 0)
            │   └── Eye closed R (X-45, Y20, scale 30%/-30%, rot 0)
            ├── Hand (X57, Y-220, scale 50%/50%, rot 0) — opacity 0 reposo
            ├── Head elemento (X355, Y-205, scale 100%/100%, rot 90)
            └── Jaw bone (X20, Y0, length 50, rot 0)
                ├── mouth_idle (X105, Y-73, scale 40%/40%, rot 90) — opacity 100
                ├── mouth_anxious (X90, Y-66, scale 30%/30%, rot 90) — opacity 0
                ├── mouth_open (X102, Y-68, scale 30%/30%, rot 90) — opacity 0
                └── mouth_0 (X82, Y-36, scale 30%/25%, rot 90) — opacity 0
```

---

## Valores en reposo — elementos animables

| Elemento | X | Y | Rot Z | Scale X | Scale Y | Opacity |
|----------|---|---|-------|---------|---------|---------|
| Spine | — | — | 0 | 100% | 100% | — |
| Neck | — | — | 0 | — | — | — |
| Head bone | — | — | 0 | — | — | — |
| L iris | -20 | -25 | 0 | 20% | 25% | — |
| R iris | 35 | -25 | 0 | -20% | 25% | — |
| L parpado | -33 | -33 | 0 | 25% | 40% | — |
| R parpado | -33 | -33 | 0 | 25% | 40% | — |
| L esclera | -35 | -30 | 0 | 30% | 30% | — |
| R esclera | -35 | -30 | 0 | 30% | 30% | — |
| L Brow | 0 | 0 | 0 | 30% | -35% | — |
| R Brow | 0 | 0 | 0 | 30% | 35% | — |
| Hand | 57 | -220 | 0 | 50% | 50% | 0 |
| mouth_idle | — | — | — | — | — | 100 |
| mouth_anxious | — | — | — | — | — | 0 |
| mouth_open | — | — | — | — | — | 0 |
| mouth_0 | — | — | — | — | — | 0 |

---

## Notas críticas de ejes

### Elementos con rotation 0 (iris, parpados, brows, esclera)
Comportamiento normal: X mueve horizontal, Y mueve vertical.

### Elementos con rotation 90 o -90 (bones padres, bocas, head elemento, torso)
Ejes invertidos: X mueve vertical, Y mueve horizontal.
Siempre verificar la rotación del elemento antes de calcular keyframes.

### R iris (scale X -20%)
- X más positivo → hacia la nariz
- X más negativo → hacia afuera
- Es opuesto al L iris
- Para que ambos miren en la misma dirección, los deltas de X deben ser
  opuestos en signo entre L iris y R iris

### Esclera
Se mueve junto con el parpado cuando este baja. Si el parpado baja N px en Y,
la esclera también baja N px en Y para mantener la ilusión.
Owner: Expression layer.

### Respiración (Body/Idle)
Se anima con Scale X del Spine, no con rotation Z.
Alargar = inhalar, comprimir = exhalar. Scale X en reposo = 100%.

### Movimiento lateral de cabeza
- Solo Head rot Z → giro sutil, cuello quieto.
  Usar en: Idle, Listening, Talking Loop.
- Neck rot Z + Head rot Z → movimiento completo de cuello.
  Reservar para Thinking (la mano en el mentón tapa el cuello).

---

## Ownership por layer

### Layer 1 — Body
- Spine scale X (respiración)
- Neck rotation Z
- Head rotation Z
- Hand opacity

### Layer 2 — Expression
- L iris X, Y
- R iris X, Y
- L parpado X, Y
- R parpado X, Y
- L esclera X, Y
- R esclera X, Y
- L Brow X, Y
- R Brow X, Y

### Layer 3 — Mouth
- mouth_idle opacity
- mouth_anxious opacity
- mouth_open opacity
- mouth_0 opacity

### Layer 4 — Blink
- Eye closed L opacity
- Eye closed R opacity
- NO TOCAR — ya funciona correctamente

---

## Organización en Rive

```
Body/
  ↻ Idle            — 60fps, 300f, loop
  ↻ Listening       — 60fps, 180f, loop
  ↻ Talking Loop    — 60fps, 48f,  loop
  → Thinking Enter  — 60fps, 45f,  one-shot
  ↻ Thinking Loop   — 60fps, 180f, loop

Expressions/
  ↻ Idle            — 60fps, 120f, loop
  ↻ Listening       — 60fps, 90f,  loop
  ↻ Thinking        — 60fps, 90f,  loop
  ↻ Neutral         — 60fps, 60f,  loop
  ↻ Positive        — 60fps, 60f,  loop
  ↻ Concerned       — 60fps, 60f,  loop

Mouth/
  → Mouth Idle      — 60fps, 1f,   one-shot
  → Mouth Open      — 60fps, 1f,   one-shot
  → Mouth Wide      — 60fps, 1f,   one-shot
  → Mouth Anxious   — 60fps, 1f,   one-shot

Blink               — fuera de carpeta, NO TOCAR
```

---

## Inputs del State Machine

| Input | Tipo | Valores |
|-------|------|---------|
| isListening | Boolean | true / false |
| isThinking | Boolean | true / false |
| isTalking | Boolean | true / false |
| talkingMode | Number | 0=neutral, 1=positive, 2=concerned |
| viseme | Number | 0=idle, 1=open, 2=wide, 3=anxious |

---

## Animaciones completadas ✅

### Mouth — todas completadas
60fps, 1 frame, one-shot. Opacity swap en frame 0.
Regla: keyframear los 4 elementos en cada animación aunque el valor sea 0.

| Animación | mouth_idle | mouth_anxious | mouth_open | mouth_0 |
|-----------|-----------|---------------|------------|---------|
| Mouth Idle | 100 | 0 | 0 | 0 |
| Mouth Open | 0 | 0 | 100 | 0 |
| Mouth Wide | 0 | 0 | 0 | 100 |
| Mouth Anxious | 0 | 100 | 0 | 0 |

Implementar en Layer 3 como **Additive Blend State** con inputs numéricos
(0-100 cada uno) para transiciones suaves con wawamunsell.

---

### Expressions/Idle — completada
60fps, 120 frames, loop. Easing cubic ease in-out en todos los keyframes.

**Iris** — deriva suave, ambos miran en la misma dirección:

| Frame | L iris X | L iris Y | R iris X | R iris Y |
|-------|----------|----------|----------|----------|
| 0 | -20 | -25 | 35 | -25 |
| 40 | -22 | -24 | 33 | -24 |
| 80 | -18 | -26 | 37 | -26 |
| 120 | -20 | -25 | 35 | -25 |

Frame 40: ambos iris van a la izquierda (L: más negativo, R: menos positivo).
Frame 80: ambos iris van a la derecha (L: menos negativo, R: más positivo).

**Parpados + esclera** — pesadez sutil, se mueven juntos:

| Frame | L parpado Y | R parpado Y | L esclera Y | R esclera Y |
|-------|-------------|-------------|-------------|-------------|
| 0 | -33 | -33 | -30 | -30 |
| 60 | -31 | -31 | -28 | -28 |
| 120 | -33 | -33 | -30 | -30 |

**Cejas** — drift mínimo (omitir si no se nota visualmente):

| Frame | L Brow Y | R Brow Y |
|-------|----------|----------|
| 0 | 0 | 0 |
| 60 | 1 | 1 |
| 120 | 0 | 0 |

---

## Animaciones pendientes ⏳

### Expressions/Listening — 60fps, 90f, loop
- Iris más quieto y centrado que idle, fijo al frente
- Parpados ligeramente más abiertos que reposo
- Cejas levemente arriba
- Menos deriva que idle — el personaje está enfocado

### Expressions/Thinking — 60fps, 90f, loop
- Iris busca arriba-izquierda (patrón de búsqueda visual)
- Parpado izquierdo más entrecerrado que el derecho
- Ceja izquierda sube levemente

### Expressions/Neutral — 60fps, 60f, loop
- Iris centrado, casi quieto
- Ojos ligeramente más abiertos que idle (alerta de hablar)
- Cejas quietas

### Expressions/Positive — 60fps, 60f, loop
- Cejas pulse: suben en frame 0, micro-pulse en frame 30, vuelven
- Ojos más abiertos que neutral
- Iris levemente arriba

### Expressions/Concerned — 60fps, 60f, loop
- Cejas fruncidas con micro-tensión (se aprietan más en frame 30)
- Iris levemente abajo
- Parpados con tensión sutil

### Body/Idle — 60fps, 300f, loop
- Spine scale X: respiración continua suave (100% → ~102% → 100% → ~99% → 100%)
- Head rot Z: ocasional — quieto la mayoría del loop, giro suave en frame ~150
- Solo Head rot Z, sin Neck

### Body/Listening — 60fps, 180f, loop
- Head rot Z: pose atenta, más estática que idle
- Spine scale X: respiración igual que idle

### Body/Thinking Enter — 60fps, 45f, one-shot
- Head rot Z: inclina (con Neck rot Z también)
- Neck rot Z: acompaña el movimiento
- Hand opacity: 0 → 100

### Body/Thinking Loop — 60fps, 180f, loop
- Head rot Z: 3 poses de procesamiento
- Neck rot Z: acompaña
- Hand opacity: 100 fija

### Body/Talking Loop — 60fps, 48f, loop
- Head rot Z: micro-movimiento mínimo, solo Head sin Neck
- Spine scale X: respiración
