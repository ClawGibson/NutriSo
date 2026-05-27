---
name: aeromexico-code-review
description: |
  Revisión de código para proyectos React Native y TypeScript de Aeroméxico. Valida cambios aplicando
  principios Clean Code, SOLID y MVVM. Detecta violaciones de patrones, malas prácticas, errores comunes
  y riesgos de calidad/seguridad. Usar cuando se necesite revisar código antes de commit o PR,
  validar adherencia a estándares de Aeroméxico, analizar cambios en git diff, review commits,
  review pull request, revisar PR, revisar cambios en rama, o detectar antipatrones.
  Para review rápido/conciso (una línea por hallazgo), activar con: "review rápido", "quick review",
  "review conciso", "review en una línea".
  Para análisis de performance (renders, memoria, cache, hooks, React 19, TanStack Query), activar con:
  "performance review", "analiza performance", "revisa renders", "memory leaks", "re-renders",
  "analiza el cache", "revisa los hooks", "optimiza este código".
---

# Aeroméxico Code Review

Revisar código de proyectos React Native + TypeScript de Aeroméxico.

---

## Selección de Workflow

Detectar el modo por las palabras del usuario. Cargar **solo** el workflow relevante.

| Si el usuario menciona... | Cargar y ejecutar |
|---------------------------|-------------------|
| PR, pull request, review commits, revisar rama, diff, cambios en rama, review rápido | `workflows/pr-review.md` |
| compara rama, diff vs main/develop, qué cambió en esta rama, antes del PR | `workflows/branch-diff.md` |
| analiza el módulo, salud del código, deuda técnica, calidad del proyecto, revisa esta feature | `workflows/project-analysis.md` |
| performance, renders, memoria, re-renders, cache, hooks, memory leak, optimiza, FlatList, waterfall, memoización | `workflows/performance-review.md` |

**Si el usuario no especificó** → preguntar:

> "¿Qué tipo de revisión necesitas?
> - **PR** — revisar un pull request o diff puntual
> - **Branch** — comparar esta rama vs main antes de abrir PR
> - **Módulo** — analizar salud y deuda técnica de un módulo completo
> - **Performance** — análisis enfocado en renders, memoria y cache"

---

## Límites de referencia rápida

| Métrica | Límite |
|---------|--------|
| Componentes | < 160 líneas |
| Controllers | < 15 imports, < 160 líneas |
| Funciones | < 50 líneas |
| Touch targets | >= 44x44pt |
| Elementos interactivos | `testID` + `accessibilityLabel` obligatorios |

---

## Índice de Recursos

### Workflows (cargar según el modo)

| Workflow | Cuándo |
|----------|--------|
| `workflows/pr-review.md` | PR formal, diff puntual, review rápido |
| `workflows/branch-diff.md` | Comparar rama vs base, pre-PR |
| `workflows/project-analysis.md` | Salud de módulo, deuda técnica |
| `workflows/performance-review.md` | Renders, memoria, cache, hooks |

### Referencias (los workflows las cargan según necesidad)

| Referencia | Contenido |
|------------|-----------|
| `references/checklists.md` | Checklists por tipo de archivo (component, controller, model, etc.) |
| `references/rules.md` | Reglas transversales: naming, TypeScript, anti-patrones, errores |
| `references/clean-code.md` | SRP, DRY, complejidad ciclomática, comentarios, dead code |
| `references/mvvm.md` | Flujo de datos, transformers, Screen vs Component |
| `references/maintainability.md` | Navegación, RTK selectors, props drilling, barrel exports |
| `references/performance.md` | FlatList, re-renders, useMemo/useCallback, animaciones, imágenes |
| `references/react19.md` | useTransition, useActionState, useOptimistic, use(), React Compiler |
| `references/tanstack-query-v5.md` | queryOptions, useSuspenseQuery, cache, invalidación, optimistic updates |
| `references/sensitive-data.md` | PII, PCI, GDPR, OWASP, checklist de seguridad |
| `references/security-advanced.md` | Deep links, WebView, tokens, permisos, certificate pinning |
| `references/migrations.md` | Migración de framework o dependencias mayores |
| `references/html-template.md` | Template HTML para reporte visual (opcional) |
