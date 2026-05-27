# aeromexico-code-review

Skill de revisión de código para proyectos React Native + TypeScript de Aeroméxico.
Cubre 4 modos de análisis independientes, cada uno con su propio workflow, output y nivel de granularidad.

---

## Flujo de selección

```mermaid
flowchart TD
    A([Usuario activa el skill]) --> B{¿Qué tipo de revisión?}

    B -->|PR, pull request,\nreview commits, diff| C[workflows/pr-review.md]
    B -->|compara rama, diff vs main,\nantes del PR| D[workflows/branch-diff.md]
    B -->|analiza módulo, salud,\ndeuda técnica| E[workflows/project-analysis.md]
    B -->|performance, renders,\nmemoria, cache, hooks| F[workflows/performance-review.md]
    B -->|No especificado| G[Preguntar modo]
    G --> B

    C --> C1[Obtener diff\ngit / GitHub MCP]
    C1 --> C2[Clasificar archivos\npor categoría]
    C2 --> C3[Aplicar checklists\n+ reglas transversales]
    C3 --> C4[Cargar referencias\nsegún contenido]
    C4 --> C5{Modo}
    C5 -->|Completo| C6[Reporte MD + HTML opcional\ncon veredicto formal]
    C5 -->|Quick review| C7[Lista concisa\nuna línea por hallazgo]

    D --> D1[git diff --name-only\n+ --stat + --name-status]
    D1 --> D2[Agrupar por módulo\ny tipo de cambio]
    D2 --> D3[Analizar patrones:\nMVVM · hooks · cache\nseguridad · deps]
    D3 --> D6[Reporte pre-PR\n+ checklist antes de abrir]

    E --> E1[Definir scope\nmódulo / feature / app]
    E1 --> E2[Recopilar métricas\ntamaño · imports · effects]
    E2 --> E3[Analizar por dimensión:\nMVVM · clean code · maint.\nperf · seguridad · tests]
    E3 --> E6[Reporte de salud\n+ plan de refactor priorizado]

    F --> F1[Definir scope\nrama / módulo / archivo]
    F1 --> F2[Clasificar archivos\npor riesgo de performance]
    F2 --> F3A[3A Renders\ny memoización]
    F2 --> F3B[3B Hooks bloqueantes\ny circulares]
    F2 --> F3C[3C Cache y fetching\nTanStack Query v5]
    F2 --> F3D[3D Acciones async\nReact 19]
    F2 --> F3E[3E Listas\ny virtualización]
    F2 --> F3F[3F Memoria\ny cleanup]
    F2 --> F3G[3G Animaciones]
    F3A & F3B & F3C & F3D & F3E & F3F & F3G --> F4[Reporte de performance\n+ métricas de deuda]

    C4 -.->|según contenido| R
    D3 -.->|según hallazgos| R
    E3 -.->|según dimensión| R
    F3A & F3B & F3C & F3D -.->|siempre| R

    subgraph R[references/]
        R1[checklists.md]
        R2[rules.md]
        R3[clean-code.md]
        R4[mvvm.md]
        R5[maintainability.md]
        R6[performance.md]
        R7[react19.md]
        R8[tanstack-query-v5.md]
        R9[sensitive-data.md]
        R10[security-advanced.md]
        R11[migrations.md]
    end
```

---

## Estructura

```
code-review/
├── SKILL.md                       ← Índice: detecta modo y delega al workflow
│
├── workflows/
│   ├── pr-review.md               ← Diff línea por línea + veredicto formal
│   ├── branch-diff.md             ← Patrones por módulo, análisis pre-PR
│   ├── project-analysis.md        ← Salud del módulo + métricas + plan de refactor
│   └── performance-review.md      ← Renders, memoria, cache, hooks
│
└── references/
    ├── checklists.md              ← Checklists por tipo de archivo
    ├── rules.md                   ← Reglas transversales y anti-patrones
    ├── clean-code.md              ← SRP, DRY, complejidad ciclomática
    ├── mvvm.md                    ← Flujo de datos, transformers, capas
    ├── maintainability.md         ← Navegación, RTK selectors, barrel exports
    ├── performance.md             ← FlatList, re-renders, animaciones, hooks
    ├── react19.md                 ← useTransition, useActionState, useOptimistic
    ├── tanstack-query-v5.md       ← queryOptions, useSuspenseQuery, cache
    ├── sensitive-data.md          ← PII, PCI, GDPR, OWASP
    ├── security-advanced.md       ← Deep links, WebView, tokens, permisos
    ├── migrations.md              ← Migración de framework o deps mayores
    └── html-template.md           ← Template HTML para reporte visual
```

---

## Workflows

### PR Review
**Cuándo:** al revisar un pull request o diff puntual.
**Granularidad:** línea por línea.
**Output:** reporte MD con veredicto `APROBADO ✅ / APROBADO CON OBSERVACIONES ⚠️ / REQUIERE CAMBIOS ❌` + HTML opcional.
**Modo conciso:** una línea por hallazgo con prefijos `🔴 bug` / `🟡 risk` / `🔵 nit` / `❓ q`.

Triggers: `"review este PR"`, `"review rápido"`, `"revisa el diff"`, `"review commits"`

---

### Branch Diff
**Cuándo:** antes de abrir un PR, para validar que la rama está lista.
**Granularidad:** patrones por módulo, no por línea.
**Output:** reporte con sección "Antes de abrir el PR" — lista de items a resolver.

Triggers: `"compara esta rama con main"`, `"qué cambió en esta rama"`, `"analiza esta rama antes del PR"`

---

### Project Analysis
**Cuándo:** análisis periódico de salud, antes de un sprint de refactor, o para entender la deuda de un módulo.
**Granularidad:** métricas cuantitativas + tendencias.
**Output:** tabla de métricas de salud + hallazgos por dimensión + plan de refactor priorizado por impacto/esfuerzo.

Triggers: `"analiza el módulo X"`, `"salud del código"`, `"deuda técnica"`, `"qué tan bien está escrito"`

---

### Performance Review
**Cuándo:** cuando hay sospecha de jank, re-renders excesivos, datos stale, memory leaks, o fetches lentos.
**Granularidad:** por categoría de riesgo (renders, hooks, cache, listas, memoria, animaciones).
**Output:** reporte de performance con métricas de deuda + comandos grep para detectar patrones.

Triggers: `"performance review"`, `"analiza performance"`, `"revisa renders"`, `"memory leaks"`, `"analiza el cache"`

---

## Referencias — cuándo se cargan

Las referencias no se cargan todas juntas. Cada workflow las carga solo cuando el contenido analizado las requiere.

| Referencia | Cargada por |
|------------|-------------|
| `checklists.md` | PR Review (siempre), Branch Diff (MVVM) |
| `rules.md` | PR Review (siempre), Branch Diff |
| `clean-code.md` | PR Review (funciones largas), Project Analysis |
| `mvvm.md` | PR Review (flujo de datos), Branch Diff, Project Analysis |
| `maintainability.md` | PR Review (navegación/RTK), Project Analysis |
| `performance.md` | Performance Review (siempre), PR Review (listas/animaciones) |
| `react19.md` | Performance Review (3D), PR Review (useTransition/useOptimistic) |
| `tanstack-query-v5.md` | Performance Review (3C), PR Review (useQuery/useMutation) |
| `sensitive-data.md` | PR Review (PII/PCI), Branch Diff, Project Analysis |
| `security-advanced.md` | PR Review (deep links/WebView/auth), Branch Diff |
| `migrations.md` | PR Review (deps mayores) |

---

## Severidades

| Símbolo | Significado | Acción |
|---------|-------------|--------|
| 🔴 Crítico / bug | Bug, seguridad, violación MVVM, bloqueador de compilación | Bloquea merge |
| 🟡 Importante / risk | Mantenibilidad, SOLID, lógica eliminada sin migrar, frágil | Resolver antes de merge o ticket inmediato |
| 🟢 Sugerencia / nit | Optimizaciones menores, estilo | El autor decide |
| ❓ q | Pregunta genuina, no sugerencia | Aclarar con el autor |
| ✅ Positivo | Buena práctica detectada | — |

---

## Contexto del proyecto

| Tecnología | Versión |
|------------|---------|
| React | 19.0.0 |
| React Native | 0.79.0 |
| @tanstack/react-query | 5.59.16 |
| Arquitectura | MVVM (component · controller · model · styled · transformer) |
| Estado global | Redux Toolkit + RTK Query + TanStack Query |
| Cache offline | PersistQueryClientProvider + AsyncStorage (`staleTime: Infinity` global) |
