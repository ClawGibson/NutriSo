# Workflow: Performance Review

Análisis enfocado exclusivamente en performance del código React Native + TypeScript.
Cubre renders, memoria, cache, hooks, listas, animaciones y uso correcto de React 19 + TanStack Query v5.

> Activar con: "performance review", "analiza performance", "revisa renders", "optimiza este código",
> "memory leaks", "re-renders", "analiza el cache", "revisa los hooks"

---

## Paso 1 — Obtener el scope

Determinar qué analizar según el contexto:

```bash
# Archivos modificados en la rama actual vs base
git diff <rama-base>..HEAD --name-only

# Archivos de un módulo específico
find src/views/ManageBaggage -name "*.ts" -o -name "*.tsx"

# Diff no commiteado
git diff --name-only
```

Si el usuario no especificó scope → preguntar: "¿Analizo la rama completa, un módulo específico, o el diff actual?"

---

## Paso 2 — Clasificar archivos por categoría de riesgo

Priorizar en este orden:

| Prioridad | Archivos | Por qué |
|-----------|----------|---------|
| 🔴 Alta | `*.controller.ts` con 5+ hooks | Mayor fuente de re-renders y loops |
| 🔴 Alta | `viewModels/**/*.ts` con `useQuery`/`useMutation` | Cache mal configurado → datos stale o fetches innecesarios |
| 🟡 Media | `*.component.tsx` con listas o animaciones | FlatList sin optimizar, objetos inline |
| 🟡 Media | `*.controller.ts` con `useEffect` | Cleanup faltante, dependencias inestables |
| 🟢 Baja | `*.styled.ts`, `*.model.ts` | Impacto menor en performance |

---

## Paso 3 — Análisis por categoría

Ejecutar cada sección que aplique según los archivos encontrados.

### 3A. Renders y Memoización

> Referencia completa: `references/performance.md` → Re-renders Innecesarios, useMemo y useCallback

**Buscar en componentes:**

```bash
# Objetos inline en JSX
grep -n "style={{" src/**/*.component.tsx
grep -n "config={{" src/**/*.component.tsx

# Funciones inline en props
grep -n "onPress={() =>" src/**/*.component.tsx
grep -n "onPress={(" src/**/*.component.tsx

# Componentes sin React.memo en listas
grep -n "renderItem" src/**/*.component.tsx
```

**Checklist rápido:**
- [ ] Items de lista envueltos en `React.memo`
- [ ] Handlers de lista en `useCallback`
- [ ] Sin objetos/arrays literales en props de componentes memoizados
- [ ] `useMemo` solo en cálculos costosos (sort/filter de arrays grandes, transformaciones)
- [ ] Sin `useMemo`/`useCallback` en cálculos triviales (over-optimization)

**Verificar si React Compiler está activo** (`babel.config.js` → `babel-plugin-react-compiler`):
- Si activo → `useMemo`/`useCallback` manuales son redundantes, no bloquear por su ausencia
- Si inactivo → aplicar reglas completas de memoización

---

### 3B. Hooks — Patrones Bloqueantes y Circulares

> Referencia completa: `references/performance.md` → Hooks — Patrones Bloqueantes y Circulares

Esta es la categoría de mayor riesgo en el proyecto. Verificar en **todo** controller.

#### B1. Loop potencial: `useEffect([callback])`

```bash
# Detectar el patrón
grep -A3 "useEffect(" src/**/*.controller.ts | grep -B1 "\[handle\|\[fetch\|\[load\|\[get"
```

**Señal de peligro:** `useEffect` cuya única dependencia es un `useCallback`.

```typescript
// ⚠️ Auditar — ¿el callback muta estado que es su propia dependencia?
const loadData = useCallback(async () => {
  const result = await fetch();
  setState(result); // ← setState aquí
}, [someValue]);    // ← someValue derivado de state → loop

useEffect(() => {
  loadData();
}, [loadData]); // ← se dispara cada vez que loadData cambia
```

**Diagnóstico:** trazar `useCallback deps → setState → re-render → useCallback deps`. Si el ciclo cierra → 🔴 loop confirmado.

**Fix:**
```typescript
// ✅ Dependencias directas en el effect
useEffect(() => {
  loadData();
}, [someValue]); // deps del callback, no el callback mismo

const loadData = useCallback(async () => { ... }, []);
```

#### B2. Callback registrado en Context sin ref estable

```typescript
// ⚠️ Patrón — ReviewAndPay.controller.ts
useEffect(() => {
  setPaymentHandler(handleAddPaymentMethod); // actualiza Context en cada cambio
}, [handleAddPaymentMethod]);               // → re-renders en cascada a consumidores
```

**Fix con ref estable:**
```typescript
// ✅ Registra una vez, siempre llama a la versión más reciente
const handlerRef = useRef(handleAddPaymentMethod);
useEffect(() => { handlerRef.current = handleAddPaymentMethod; }, [handleAddPaymentMethod]);
useEffect(() => { setPaymentHandler((...args) => handlerRef.current(...args)); }, []);
```

#### B3. `useMemo` con `useRef` como dependencia — valor stale

```bash
grep -n "useMemo" src/**/*.controller.ts | head -20
# Luego verificar manualmente si alguna dep es un useRef
```

```typescript
// 🔴 Bug silencioso — ref nunca cambia como referencia
const computed = useMemo(() => calculate(ref.current), [ref]); // stale si ref.current muta

// ✅ Dependencia en el valor
const computed = useMemo(() => calculate(ref.current), [ref.current]);
```

#### B4. Controller con 5+ `useEffect` — SRP violado

```bash
grep -c "useEffect(" src/**/*.controller.ts | sort -t: -k2 -rn | head -10
```

Más de 5 `useEffect` en un controller = múltiples responsabilidades = candidato a split.

**Severidad resumen:**

| Patrón | Severidad |
|--------|-----------|
| `useEffect([callback])` con loop confirmado | 🔴 Crítico |
| `useMemo([ref])` — valor stale | 🔴 Crítico |
| Controller con 7+ `useEffect` | 🔴 Crítico |
| Callback registrado en Context sin ref estable | 🟡 Importante |
| `useEffect([callback])` frágil sin loop confirmado | 🟡 Importante |

---

### 3C. Cache y Fetching — TanStack Query v5

> Referencia completa: `references/tanstack-query-v5.md`

**Contexto crítico del proyecto:** `DataProvider.tsx` configura `staleTime: Infinity` globalmente.
Esto significa que **sin `invalidateQueries` explícito, los datos nunca se refrescan**.

#### C1. Waterfall de fetches seriales

```bash
# Detectar controllers con múltiples viewModels de datos
grep -c "useFlightDetail\|useCart\|useBenefits\|useBalance" src/**/*.controller.ts
```

```typescript
// ❌ Serial — tiempo total = t1 + t2 + t3 + t4
const { currentFlight } = useFlightDetail();
const { cart } = useCart({});
const { benefitsData } = useBenefits('');
const { pointsBalance } = useBalance();

// ✅ Paralelo con useSuspenseQueries
const [flight, cart, benefits, balance] = useSuspenseQueries({
  queries: [flightQueryOptions(pnr), cartQueryOptions(pnr), ...],
});
```

#### C2. Query keys como strings sueltos

```bash
grep -rn "invalidateQueries.*queryKey.*\['" src/
grep -rn "setQueryData.*\['" src/
```

Strings sueltos en 3+ lugares → usar `queryOptions` helper para centralizar.

#### C3. Mutaciones sin invalidación

```bash
grep -A20 "useMutation(" src/**/*.viewModel.ts | grep -L "onSettled\|invalidateQueries"
```

Con `staleTime: Infinity`, toda mutación que modifica datos **debe** tener `onSettled` con `invalidateQueries`. Sin esto el usuario ve datos stale indefinidamente.

#### C4. Doble cache: Redux + TanStack Query

```bash
# Detectar viewModels que usan useEffect para sincronizar query data con Redux
grep -B5 -A10 "dispatch(" src/**/*.viewModel.ts | grep -B5 "data\b"
```

```typescript
// ❌ Patrón — useBenefits.viewModel.ts
useEffect(() => {
  if (data) dispatch(addToCache({ data, params })); // duplica en Redux lo que TQ ya cachea
}, [data]);
```

Datos que TanStack Query ya cachea no deben duplicarse en Redux. Eliminar el slice de cache y leer directamente desde TQ.

**Checklist:**
- [ ] Fetches independientes usan `useSuspenseQueries` (paralelo)
- [ ] Query keys centralizadas con `queryOptions`
- [ ] Toda mutación tiene `onSettled` + `invalidateQueries`
- [ ] `setQueryData` manual tiene `onError` con rollback
- [ ] Sin doble cache Redux + TanStack Query para los mismos datos
- [ ] Queries que deben refrescarse al volver a pantalla usan `useFocusEffect` + `refetch`

---

### 3D. Acciones Async — React 19

> Referencia completa: `references/react19.md`

**Detectar el patrón de sincronización manual:**

```bash
# Controllers con useState(isLoading) + useEffect([isPending])
grep -n "useState(false)" src/**/*.controller.ts
grep -n "setIsLoading" src/**/*.controller.ts
```

```typescript
// ❌ Patrón costoso — 3 useState + 3 useEffect para sincronizar
const [isLoading, setIsLoading] = useState(false);
useEffect(() => { setIsLoading(isPending); }, [isPending]);
useEffect(() => { navigation.setOptions({ headerShown: !isLoading }); }, [isLoading]);

// ✅ useTransition — isPending automático, sin useEffect de sincronización
const [isPending, startTransition] = useTransition();
const handlePay = () => startTransition(async () => { await payReservation(params); });
```

**Checklist:**
- [ ] Acciones async usan `useTransition` o `useActionState` en lugar de `useState(isLoading)`
- [ ] `useOptimistic` siempre dentro de `startTransition`
- [ ] `use()` con promesas — promesa estable (no recreada en render)

---

### 3E. Listas y Virtualización

> Referencia completa: `references/performance.md` → FlatList / SectionList

```bash
# Detectar FlatList sin keyExtractor estable
grep -n "keyExtractor" src/**/*.component.tsx
grep -n "index)" src/**/*.component.tsx  # keyExtractor con índice
```

**Checklist:**
- [ ] `keyExtractor` usa ID único estable (no índice)
- [ ] `renderItem` memoizado con `useCallback` o `React.memo`
- [ ] `getItemLayout` definido para items de altura fija
- [ ] `removeClippedSubviews` en listas > 20 items
- [ ] `initialNumToRender` ajustado al viewport

---

### 3F. Memoria — Leaks y Cleanup

```bash
# useEffect sin cleanup
grep -A10 "useEffect(" src/**/*.controller.ts | grep -v "return () =>"
```

**Señales de memory leak:**
- `useEffect` con `addListener`, `subscribe`, `setInterval`, `setTimeout` sin `return () => cleanup()`
- Componentes que actualizan estado después de desmontarse
- `BackHandler.addEventListener` sin `remove()`

```typescript
// ❌ Memory leak
useEffect(() => {
  const handler = BackHandler.addEventListener('hardwareBackPress', onBack);
  // falta return
}, []);

// ✅ Con cleanup
useEffect(() => {
  const handler = BackHandler.addEventListener('hardwareBackPress', onBack);
  return () => handler.remove();
}, []);
```

**Checklist:**
- [ ] Todo `addEventListener` tiene su `removeEventListener` en cleanup
- [ ] Todo `setInterval`/`setTimeout` tiene `clearInterval`/`clearTimeout` en cleanup
- [ ] Subscripciones de Redux/EventEmitter tienen cleanup
- [ ] Sin `setState` en componentes desmontados (verificar con `isMounted` ref si aplica)

---

### 3G. Animaciones

> Referencia completa: `references/performance.md` → Animaciones

```bash
grep -n "Animated.timing\|Animated.spring" src/**/*.controller.ts src/**/*.component.tsx
```

**Checklist:**
- [ ] `opacity`/`transform` usan `useNativeDriver: true`
- [ ] Sin `setState` dentro de callbacks de animación
- [ ] Reanimated 2: usa `useSharedValue` + `useAnimatedStyle` (no `Animated.Value`)

---

## Paso 4 — Generar Reporte de Performance

### Formato del reporte

Guardar en `.kiro/reviews/performance-[YYYYMMDD-HHmmss].md`:

```markdown
# Performance Review — [módulo o rama]
**Fecha:** [fecha] | **Scope:** [archivos analizados]

## Resumen Ejecutivo
[2-3 líneas: hallazgos más críticos y su impacto estimado en UX]

## 🔴 Crítico — Bloquean merge o requieren fix inmediato (N)

### [Archivo:Línea] — [Categoría]
**Problema:** descripción
**Impacto:** qué experimenta el usuario (jank, datos stale, crash, loop)
**Fix:**
```código```

## 🟡 Importante — Degradan performance perceptiblemente (N)

## 🟢 Oportunidades — Mejoras con React 19 / TanStack v5 (N)
[Migraciones sugeridas que reducirían complejidad y mejorarían performance]

## 📊 Métricas de Deuda
| Métrica | Valor | Límite | Estado |
|---------|-------|--------|--------|
| Controllers con 5+ useEffect | N | 0 | 🔴/✅ |
| Fetches seriales detectados | N | 0 | 🔴/✅ |
| Mutaciones sin invalidateQueries | N | 0 | 🔴/✅ |
| useEffect sin cleanup | N | 0 | 🔴/✅ |
| keyExtractor con índice | N | 0 | 🔴/✅ |
```

### Modo conciso (si el usuario pide "quick" o "rápido")

Una línea por hallazgo:
```
ManageBaggage.controller.ts:L60-102: 🔴 waterfall 4 fetches seriales. useSuspenseQueries.
ReviewAndPay.controller.ts:L537: 🟡 callback en Context sin ref estable → re-renders cascada.
useBenefits.viewModel.ts:L30: 🟡 doble cache Redux+TQ. Eliminar slice, leer desde TQ.
FlightList.component.tsx:L45: 🔴 keyExtractor con índice. Usar item.id.
```

---

## Referencias

| Cuándo leer | Archivo |
|-------------|---------|
| Renders, memoización, listas, animaciones, hooks | `references/performance.md` |
| `useTransition`, `useActionState`, `useOptimistic`, React Compiler | `references/react19.md` |
| `queryOptions`, `useSuspenseQuery`, cache, invalidación | `references/tanstack-query-v5.md` |
