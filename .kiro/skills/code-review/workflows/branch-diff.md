# Workflow: Branch Diff

Comparación entre dos ramas. Foco en patrones arquitecturales, violaciones de MVVM y tendencias — no en cada línea individual.

> Activar con: "compara esta rama con main", "qué cambió en esta rama", "diff vs develop",
> "revisa los cambios de la rama", "analiza esta rama antes del PR"

---

## Paso 1 — Obtener el scope

```bash
# Lista de archivos modificados
git diff <rama-base>..HEAD --name-only

# Estadísticas de cambio por archivo
git diff <rama-base>..HEAD --stat

# Archivos nuevos vs modificados vs eliminados
git diff <rama-base>..HEAD --name-status

# Resumen de commits incluidos
git log <rama-base>..HEAD --oneline
```

Si el usuario no especificó la rama base → asumir `main`. Confirmar si hay duda.

---

## Paso 2 — Clasificar por módulo y tipo

A diferencia del PR Review, aquí el foco es **tendencias por módulo**, no hallazgos por línea.

### 2A. Agrupar archivos por módulo/feature

```bash
# Ver qué módulos fueron tocados
git diff main..HEAD --name-only | sed 's|/[^/]*$||' | sort -u
```

Identificar si los cambios están concentrados en un módulo o dispersos.

### 2B. Detectar archivos de alto riesgo

Priorizar revisión en:

| Señal | Qué buscar |
|-------|-----------|
| Controllers nuevos o muy modificados | Violaciones MVVM, SRP, hooks problemáticos |
| ViewModels nuevos | Patrones de cache, waterfall de fetches |
| Archivos eliminados | Lógica migrada o perdida |
| Cambios en `package.json` | Dependencias nuevas, versiones |
| Cambios en config nativa | Permisos, bundle ID, signing |

---

## Paso 3 — Análisis por categoría

### 3A. Arquitectura MVVM

> Referencia: `references/mvvm.md`, `references/checklists.md`

Para cada controller/component nuevo o significativamente modificado:

```bash
# Ver solo controllers modificados
git diff main..HEAD --name-only | grep "\.controller\.ts"

# Contar líneas de cada controller modificado
git diff main..HEAD --name-only | grep "\.controller\.ts" | xargs wc -l
```

**Verificar:**
- [ ] Flujo de datos unidireccional (Service → Controller → Component)
- [ ] Sin lógica de negocio en componentes
- [ ] Sin JSX en controllers
- [ ] Transformaciones en `.transformer.ts`, no en controller
- [ ] Controllers nuevos < 160 líneas, < 15 imports

### 3B. Patrones de hooks

> Referencia: `references/performance.md` → Hooks Bloqueantes y Circulares

```bash
# Controllers con muchos useEffect
git diff main..HEAD --name-only | grep "\.controller\.ts" | while read f; do
  count=$(grep -c "useEffect(" "$f" 2>/dev/null || echo 0)
  echo "$count $f"
done | sort -rn | head -10
```

**Señales de alerta:**
- Controller nuevo con 5+ `useEffect`
- `useEffect([callback])` donde el callback muta estado
- `useMemo` con `useRef` como dependencia

### 3C. Cache y estado

> Referencia: `references/tanstack-query-v5.md`

```bash
# ViewModels nuevos con TanStack Query
git diff main..HEAD --name-only | grep "\.viewModel\.ts"

# Mutaciones sin invalidateQueries
git diff main..HEAD | grep "+.*useMutation" -A30 | grep -L "onSettled\|invalidateQueries"
```

**Verificar en viewModels nuevos:**
- [ ] Query keys con `queryOptions` helper (no strings sueltos)
- [ ] Mutaciones tienen `onSettled` + `invalidateQueries`
- [ ] Sin doble cache Redux + TanStack Query
- [ ] `useSuspenseQuery` tiene `<Suspense>` + `<ErrorBoundary>` en el árbol

### 3D. Seguridad

> Referencia: `references/sensitive-data.md`, `references/security-advanced.md`

```bash
# Buscar posibles datos sensibles en el diff
git diff main..HEAD | grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
git diff main..HEAD | grep -iE "(api_key|secret|token|password)\s*[:=]"
git diff main..HEAD | grep -E "\b[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b"
```

Si hay cambios en navegación → verificar deep links sanitizados.
Si hay cambios en auth → verificar tokens en Keychain, no AsyncStorage.

### 3E. Dependencias (si `package.json` cambió)

```bash
git diff main..HEAD -- package.json
```

**Verificar:**
- [ ] Sin versiones alpha/beta/rc sin justificación
- [ ] Dependencia nueva no duplica funcionalidad existente
- [ ] `@types/*` alineados con versiones de librerías

### 3F. Archivos eliminados

```bash
git diff main..HEAD --name-status | grep "^D"
```

Para cada archivo eliminado: verificar que su lógica fue migrada o que la funcionalidad ya no es necesaria. Reportar como 🟡 si no es claro.

---

## Paso 4 — Generar reporte

Guardar en `.kiro/reviews/branch-diff-[YYYYMMDD-HHmmss].md`:

```markdown
# Branch Diff — [nombre-rama] vs [base]

**Rama:** [rama] | **Base:** [base] | **Fecha:** [fecha]
**Commits:** N | **Archivos:** N | **Módulos tocados:** [lista]

---

## Resumen de Cambios
[Descripción de qué hace la rama en 3-5 líneas]

## Módulos Afectados
| Módulo | Archivos | Tipo de cambio |
|--------|----------|----------------|
| [módulo] | N | nuevo / modificado / eliminado |

---

## 🔴 Violaciones Críticas (N)
[Bugs, violaciones MVVM bloqueantes, seguridad]

## 🟡 Patrones Problemáticos (N)
[Hooks frágiles, cache mal configurado, SRP violado]

## 🟢 Oportunidades de Mejora (N)
[Migraciones React 19 / TanStack v5 sugeridas]

## ✅ Buenas Prácticas Detectadas

## 📋 Antes de Abrir el PR
[Lista de items a resolver o confirmar antes de crear el PR]
```

### Modo conciso

Si el usuario pide "rápido" o "quick":

```
[módulo/archivo]: 🔴/🟡/🟢 [hallazgo]. [fix].

Resumen: N críticos, N importantes, N sugerencias.
Listo para PR: SÍ / NO (razón)
```

---

## Diferencias clave vs PR Review

| Aspecto | Branch Diff | PR Review |
|---------|-------------|-----------|
| Granularidad | Por módulo / tendencia | Por línea |
| Output | Reporte de patrones | Reporte con veredicto formal |
| Foco | ¿Está bien diseñado? | ¿Está bien implementado? |
| Momento | Antes de abrir el PR | Al revisar el PR |
| Archivos eliminados | Verificar migración | Verificar migración |
