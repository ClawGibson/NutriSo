# Workflow: Project Analysis

Análisis de salud de un módulo o feature completo sin diff. Identifica deuda técnica, patrones problemáticos recurrentes y oportunidades de mejora priorizadas.

> Activar con: "analiza el módulo X", "salud del código", "deuda técnica", "analiza el proyecto",
> "qué tan bien está escrito este módulo", "revisa la calidad de esta feature"

---

## Paso 1 — Definir el scope

Si el usuario no especificó → preguntar: "¿Qué quieres analizar? (módulo específico, feature, app completa)"

```bash
# Ver estructura del módulo
find src/views/[ModuleName] -name "*.ts" -o -name "*.tsx" | sort

# Contar archivos por tipo
find src/views/[ModuleName] -name "*.controller.ts" | wc -l
find src/views/[ModuleName] -name "*.component.tsx" | wc -l
find src/views/[ModuleName] -name "*.service.ts" | wc -l
```

**Scopes válidos:**
- Módulo/feature: `src/views/ManageBaggage/`, `src/views/Checkin/`
- App completa: `apps/am-mobile-app-checkin/`
- Capa específica: todos los controllers, todos los viewModels
- Archivo individual: análisis profundo de un archivo

---

## Paso 2 — Métricas de tamaño y complejidad

Recopilar métricas antes de analizar contenido. Dan contexto sobre dónde está la deuda.

```bash
# Archivos más grandes (candidatos a split)
find [scope] -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -15

# Controllers con más imports (baja cohesión)
for f in $(find [scope] -name "*.controller.ts"); do
  count=$(grep -c "^import" "$f")
  echo "$count $f"
done | sort -rn | head -10

# Controllers con más useEffect (SRP violado)
for f in $(find [scope] -name "*.controller.ts"); do
  count=$(grep -c "useEffect(" "$f" 2>/dev/null || echo 0)
  echo "$count $f"
done | sort -rn | head -10

# Funciones largas (> 50 líneas) — aproximación
grep -n "const.*= \(.*\) =>" [scope]/**/*.controller.ts | head -20
```

---

## Paso 3 — Análisis por dimensión

Ejecutar todas las dimensiones. A diferencia del PR Review, aquí se analiza el estado actual, no cambios.

### 3A. Arquitectura MVVM

> Referencia: `references/mvvm.md`, `references/checklists.md`

**Verificar flujo de datos:**
```bash
# Componentes que importan directamente de react-redux (saltándose el controller)
grep -rn "useSelector\|useDispatch" [scope]/**/*.component.tsx

# Componentes que llaman a hooks de RTK Query directamente
grep -rn "useGet\|useLazy\|useMutation" [scope]/**/*.component.tsx

# Controllers que importan otros controllers (acoplamiento lateral)
grep -rn "import.*Controller" [scope]/**/*.controller.ts
```

**Verificar separación de responsabilidades:**
```bash
# Transformaciones en controllers (deberían estar en transformers)
grep -rn "\.map(\|\.filter(\|\.reduce(" [scope]/**/*.controller.ts | wc -l

# JSX en controllers
grep -rn "return (<\|return (\s*<" [scope]/**/*.controller.ts
```

**Hallazgos a reportar:**
- Componentes que acceden directamente al store → 🔴
- Controllers con JSX → 🔴
- Transformaciones complejas en controllers sin transformer → 🟡
- Controllers > 160 líneas → 🟡

### 3B. Clean Code

> Referencia: `references/clean-code.md`

```bash
# Archivos con eslint-disable (señal de deuda)
grep -rln "eslint-disable" [scope]/

# Variables genéricas (data, temp, val, result)
grep -rn "\bconst data\b\|\bconst temp\b\|\bconst val\b\|\bconst result\b" [scope]/

# Magic strings (strings hardcodeados en lógica)
grep -rn "=== '" [scope]/**/*.controller.ts | grep -v "test\|spec\|mock" | head -20

# Código comentado
grep -rn "^[[:space:]]*//" [scope]/**/*.ts | grep -v "TODO\|FIXME\|NOTE\|eslint\|@" | head -20

# Funciones con muchos parámetros (> 3)
grep -rn "const.*= (" [scope]/**/*.ts | grep -E "\w+,\s*\w+,\s*\w+,\s*\w+" | head -10
```

### 3C. Mantenibilidad

> Referencia: `references/maintainability.md`

```bash
# Props drilling — componentes con muchas props (> 8 puede indicar drilling)
grep -rn "Props {" [scope]/**/*.model.ts | head -20

# Selectores sin createSelector (re-renders innecesarios)
grep -rn "useSelector(" [scope]/**/*.controller.ts | grep -v "createSelector" | head -10

# Barrel exports faltantes
find [scope] -name "index.ts" | wc -l
find [scope] -maxdepth 2 -type d | wc -l
# Si hay muchos más directorios que index.ts → faltan barrels
```

### 3D. Performance

> Referencia: `references/performance.md`, `workflows/performance-review.md`

Para análisis de performance profundo → usar `workflows/performance-review.md` directamente.

Aquí: solo señales de alerta rápidas.

```bash
# FlatList sin keyExtractor estable
grep -rn "keyExtractor.*index" [scope]/**/*.component.tsx

# Objetos inline en JSX
grep -rn "style={{" [scope]/**/*.component.tsx | wc -l

# useEffect sin cleanup (aproximación)
grep -rn "useEffect(" [scope]/**/*.controller.ts | wc -l
grep -rn "return () =>" [scope]/**/*.controller.ts | wc -l
# Si el segundo número es mucho menor que el primero → hay effects sin cleanup
```

### 3E. Seguridad

> Referencia: `references/sensitive-data.md`, `references/security-advanced.md`

```bash
# Datos sensibles hardcodeados
grep -rn "AsyncStorage.setItem.*token\|AsyncStorage.setItem.*auth" [scope]/
grep -rn "console.log.*email\|console.log.*password\|console.log.*token" [scope]/

# Deep links sin validación
grep -rn "route\.params\." [scope]/**/*.controller.ts | grep -v "??\|?.\|if (" | head -10
```

### 3F. Cobertura de tests

```bash
# Archivos sin test correspondiente
for f in $(find [scope] -name "*.controller.ts" -not -name "*.test.*"); do
  base="${f%.controller.ts}"
  if [ ! -f "${base}.test.ts" ] && [ ! -f "${base}.controller.test.ts" ]; then
    echo "Sin test: $f"
  fi
done
```

### 3G. Deuda técnica — React 19 y TanStack v5

> Referencia: `references/react19.md`, `references/tanstack-query-v5.md`

```bash
# Patrón de sincronización manual (candidato a useActionState)
grep -rn "useState(false)" [scope]/**/*.controller.ts | wc -l
grep -rn "setIsLoading\|setIsPending" [scope]/**/*.controller.ts | wc -l

# Query keys como strings sueltos
grep -rn "invalidateQueries.*queryKey.*\['" [scope]/
grep -rn "setQueryData.*\['" [scope]/

# Mutaciones sin invalidación (con staleTime: Infinity global)
grep -rn "useMutation(" [scope]/**/*.viewModel.ts -l | while read f; do
  if ! grep -q "onSettled\|invalidateQueries" "$f"; then
    echo "Sin invalidación: $f"
  fi
done

# Doble cache Redux + TanStack
grep -rn "dispatch.*addToCache\|dispatch.*setCache" [scope]/
```

---

## Paso 4 — Generar reporte de salud

Guardar en `.kiro/reviews/project-analysis-[YYYYMMDD-HHmmss].md`:

```markdown
# Análisis de Salud — [Módulo/Feature]

**Scope:** [ruta analizada] | **Fecha:** [fecha]
**Archivos analizados:** N controllers, N components, N viewModels, N services

---

## Resumen Ejecutivo
[3-5 líneas: estado general, principales fortalezas y deudas]

## 📊 Métricas de Salud

| Métrica | Valor | Límite | Estado |
|---------|-------|--------|--------|
| Controllers > 160 líneas | N | 0 | 🔴/✅ |
| Controllers > 15 imports | N | 0 | 🔴/✅ |
| Controllers con 5+ useEffect | N | 0 | 🟡/✅ |
| Componentes con lógica de negocio | N | 0 | 🔴/✅ |
| Mutaciones sin invalidateQueries | N | 0 | 🟡/✅ |
| useEffect sin cleanup | N | 0 | 🔴/✅ |
| FlatList con keyExtractor de índice | N | 0 | 🔴/✅ |
| Archivos sin test | N | — | 🟡/✅ |
| eslint-disable sin justificación | N | 0 | 🟡/✅ |

---

## 🔴 Deuda Crítica (N)
[Violaciones que causan bugs o riesgos de seguridad activos]

### [Archivo] — [Categoría]
**Problema:** descripción
**Impacto:** qué puede fallar
**Fix sugerido:** descripción o código

## 🟡 Deuda Importante (N)
[Patrones que degradan mantenibilidad o performance]

## 🟢 Oportunidades de Modernización (N)
[Migraciones a React 19 / TanStack v5 que reducirían complejidad]

### Ejemplo de oportunidad
**Patrón actual:** [descripción + archivo]
**Migración:** [descripción + código]
**Beneficio:** [qué mejora]

## ✅ Fortalezas del Módulo
[Patrones bien implementados, buenas prácticas detectadas]

## 📋 Plan de Refactor Sugerido

Priorizado por impacto / esfuerzo:

| Prioridad | Tarea | Archivos afectados | Esfuerzo estimado |
|-----------|-------|-------------------|-------------------|
| 1 | [tarea crítica] | [archivos] | [horas] |
| 2 | [tarea importante] | [archivos] | [horas] |
| 3 | [modernización] | [archivos] | [horas] |
```

---

## Diferencias clave vs otros workflows

| Aspecto | Project Analysis | Branch Diff | PR Review |
|---------|-----------------|-------------|-----------|
| Trigger | Sin diff, módulo completo | Rama vs base | PR abierto |
| Granularidad | Tendencias y métricas | Patrones por módulo | Línea por línea |
| Output | Reporte de salud + plan de refactor | Reporte pre-PR | Reporte con veredicto |
| Foco | ¿Qué deuda existe? | ¿Está listo para PR? | ¿Está bien implementado? |
| Frecuencia | Periódico / antes de sprint | Antes de abrir PR | Al revisar PR |
