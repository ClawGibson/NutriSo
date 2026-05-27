# TanStack Query v5 — Nuevas APIs y Recomendaciones

> Versión del proyecto: @tanstack/react-query 5.59.16 · @tanstack/query-async-storage-persister 5.59.16
> Docs oficiales: https://tanstack.com/query/v5/docs

## Table of Contents

- [queryOptions helper](#1-queryoptions-helper)
- [useSuspenseQuery](#2-usesuspensequery)
- [useSuspenseQueries — fetches paralelos](#3-usesuspensqueries--fetches-paralelos)
- [Infinite Queries v5](#4-infinite-queries-v5)
- [Optimistic Updates con useMutation](#5-optimistic-updates-con-usemutation)
- [Nota sobre DataProvider.tsx](#nota-sobre-dataprovidertsx)
- [Impacto en el codebase actual](#impacto-en-el-codebase-actual)
- [Checklist para Code Review](#checklist-para-code-review)

---

## 1. queryOptions helper

Centraliza `queryKey` + `queryFn` + opciones en un objeto reutilizable y type-safe. Elimina query keys duplicadas como strings sueltos.

**Problema actual en el proyecto:**
```typescript
// ❌ useBenefits.viewModel.ts — queryKey definida implícitamente en el service
useGetBenefitsQuery(queryParams, { skip: !legCode });

// ❌ mutationFlightDetail.viewModel.ts — key como string suelto
queryClient.invalidateQueries({ queryKey: ['EligibilityBenefits'] });
// ¿Es el mismo key que usa useGetBenefitsQuery? No hay garantía.
```

**Con queryOptions:**
```typescript
import { queryOptions } from '@tanstack/react-query';

// ✅ Definir una vez en el service/viewModel
export const benefitsQueryOptions = (params: BenefitsParams) =>
  queryOptions({
    queryKey: ['benefits', params],
    queryFn: () => fetchBenefits(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!params.legCode,
  });

// En el viewModel:
const { data } = useQuery(benefitsQueryOptions(queryParams));

// En invalidación — mismo key garantizado
queryClient.invalidateQueries(benefitsQueryOptions(queryParams));

// En prefetch:
await queryClient.prefetchQuery(benefitsQueryOptions(queryParams));
```

**Docs:** https://tanstack.com/query/v5/docs/framework/react/guides/query-options

---

## 2. useSuspenseQuery

Versión de `useQuery` que suspende el componente en lugar de retornar `isLoading`. `data` es siempre `T` — nunca `T | undefined`.

```typescript
// ❌ Patrón actual — manejo manual de loading + type guards
const { data, isLoading, isError } = useGetFlightDetailQuery(params);
if (isLoading) return <Skeleton />;
if (isError) return <ErrorView />;
if (!data) return null; // type guard extra
return <FlightDetail data={data} />;

// ✅ useSuspenseQuery — data siempre definida, loading/error manejados por Suspense/ErrorBoundary
import { useSuspenseQuery } from '@tanstack/react-query';

const FlightDetailView = ({ pnr }: { pnr: string }) => {
  const { data } = useSuspenseQuery(flightDetailQueryOptions(pnr));
  return <FlightDetail data={data} />; // data: FlightDetail — nunca undefined
};

// En el screen/navigator — OBLIGATORIO:
<Suspense fallback={<FlightDetailSkeleton />}>
  <ErrorBoundary fallback={<ErrorView />}>
    <FlightDetailView pnr={pnr} />
  </ErrorBoundary>
</Suspense>
```

**⚠️ Requiere `<Suspense>` + `<ErrorBoundary>` en el árbol padre** — sin ellos la app crashea.

**Docs:** https://tanstack.com/query/v5/docs/framework/react/reference/useSuspenseQuery

---

## 3. useSuspenseQueries — fetches paralelos

Reemplaza el patrón waterfall de hooks en cadena. Todos los fetches se disparan en paralelo; el componente suspende hasta que todos resuelven.

**Problema actual — ManageBaggage.controller.ts:**
```typescript
// ❌ Waterfall — tiempo total = suma de todos los tiempos
const { currentFlight } = useFlightDetail();   // fetch 1
const { cart } = useCart({});                  // fetch 2
const { benefitsData } = useBenefits('');      // fetch 3
const { pointsBalance } = useBalance();        // fetch 4
```

**Con useSuspenseQueries:**
```typescript
import { useSuspenseQueries } from '@tanstack/react-query';

// ✅ Paralelo — tiempo total = max(t1, t2, t3, t4)
const [flightResult, cartResult, benefitsResult, balanceResult] = useSuspenseQueries({
  queries: [
    flightDetailQueryOptions(pnr),
    cartQueryOptions(pnr),
    benefitsQueryOptions({ legCode, pnr }),
    balanceQueryOptions(userId),
  ],
});

const { data: currentFlight } = flightResult;
const { data: cart } = cartResult;
// ...
```

**Nota:** si alguna query falla, el `ErrorBoundary` más cercano captura el error. Configurar `ErrorBoundary` por sección si se necesita manejo granular.

**Docs:** https://tanstack.com/query/v5/docs/framework/react/reference/useSuspenseQueries

---

## 4. Infinite Queries v5

API cambiada en v5 — `initialPageParam` es requerido y `getNextPageParam` recibe el parámetro de página como tercer argumento.

```typescript
// ❌ v4 — initialPageParam implícito
const { data } = useInfiniteQuery({
  queryKey: ['flights', filters],
  queryFn: ({ pageParam = 0 }) => fetchFlights({ ...filters, page: pageParam }),
  getNextPageParam: (lastPage) => lastPage.nextPage,
});

// ✅ v5 — initialPageParam explícito y requerido
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['flights', filters],
  queryFn: ({ pageParam }) => fetchFlights({ ...filters, page: pageParam }),
  initialPageParam: 0,                                    // ← requerido en v5
  getNextPageParam: (lastPage, _, lastPageParam) =>
    lastPage.hasMore ? lastPageParam + 1 : undefined,
});
```

**Docs:** https://tanstack.com/query/v5/docs/framework/react/guides/infinite-queries

---

## 5. Optimistic Updates con useMutation

v5 estandariza el patrón `onMutate`/`onError`/`onSettled` para optimistic updates con rollback automático.

```typescript
// ✅ Optimistic update — agregar equipaje al carrito
const { mutate: addBaggage } = useMutation({
  mutationFn: (item: BaggageItem) => addBaggageToCartApi(item),

  onMutate: async (newItem) => {
    // 1. Cancelar refetches en vuelo para evitar sobreescribir el optimistic update
    await queryClient.cancelQueries({ queryKey: ['cart', pnr] });

    // 2. Snapshot del estado anterior para rollback
    const previousCart = queryClient.getQueryData(['cart', pnr]);

    // 3. Actualizar cache optimistamente
    queryClient.setQueryData(['cart', pnr], (old: Cart) => ({
      ...old,
      items: [...old.items, { ...newItem, isPending: true }],
    }));

    return { previousCart };
  },

  onError: (_, __, context) => {
    // Revertir si falla
    queryClient.setQueryData(['cart', pnr], context?.previousCart);
  },

  onSettled: () => {
    // Siempre refetch para sincronizar con el servidor
    queryClient.invalidateQueries({ queryKey: ['cart', pnr] });
  },
});
```

**Diferencia con el patrón actual** (`mutationFlightDetail.viewModel.ts`): el patrón actual usa `setQueryData` manual sin `onMutate`/`onError` — si la mutación falla, el cache queda en estado incorrecto sin rollback.

**Docs:** https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates

---

## Nota sobre DataProvider.tsx

El proyecto configura `staleTime: Infinity` + `gcTime: Infinity` globalmente:

```typescript
// DataProvider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: Infinity,
      staleTime: Infinity, // ninguna query se refresca automáticamente
    },
  },
});
```

**Implicación:** `invalidateQueries` es la **única** forma de obtener datos frescos. Sin invalidación explícita tras una mutación, el usuario ve datos stale indefinidamente.

**Verificar en cada nuevo feature:**
- [ ] Toda mutación que modifica datos tiene `onSettled: () => queryClient.invalidateQueries(...)`
- [ ] Las queries que deben refrescarse al volver a la pantalla usan `useFocusEffect` + `refetch` o `invalidateQueries`
- [ ] `shouldDehydrateQuery` en `DataProvider.tsx` incluye las nuevas query keys que deben persistirse offline

**Para queries que SÍ deben refrescarse:** sobreescribir `staleTime` a nivel de query con `queryOptions`:
```typescript
export const flightStatusQueryOptions = (pnr: string) =>
  queryOptions({
    queryKey: ['flightStatus', pnr],
    queryFn: () => fetchFlightStatus(pnr),
    staleTime: 60 * 1000, // 1 min — sobreescribe el Infinity global
  });
```

---

## Impacto en el codebase actual

| Archivo | Patrón actual | Migración sugerida |
|---------|--------------|-------------------|
| `useBenefits.viewModel.ts` | `useEffect` para cachear en Redux + query key implícita | `queryOptions` con `staleTime` apropiado — elimina el slice de cache |
| `mutationFlightDetail.viewModel.ts` | `setQueryData` manual sin rollback | `onMutate` optimistic + `onError` rollback + `onSettled` invalidate |
| `ManageBaggage.controller.ts` | 4 hooks en waterfall | `useSuspenseQueries` paralelo |
| Cualquier viewModel con `isLoading` + `if (!data) return null` | Type guards manuales | `useSuspenseQuery` — `data` siempre definida |
| `DataProvider.tsx` | `staleTime: Infinity` global | Sobreescribir por query con `queryOptions` donde aplique |

---

## Checklist para Code Review

- [ ] Query keys definidas con `queryOptions` helper — no strings sueltos duplicados
- [ ] `useSuspenseQuery` envuelto en `<Suspense>` + `<ErrorBoundary>` en el árbol padre
- [ ] `useSuspenseQueries` para fetches independientes que antes eran seriales
- [ ] `initialPageParam` presente en `useInfiniteQuery` (requerido en v5, TypeScript error si falta)
- [ ] Optimistic updates usan `onMutate`/`onError`/`onSettled` — no `setQueryData` manual sin rollback
- [ ] Mutaciones tienen `onSettled` con `invalidateQueries` (dado `staleTime: Infinity` global)
- [ ] Nuevos features no duplican en Redux lo que TanStack Query ya cachea

### Severidad

| Violación | Severidad |
|-----------|-----------|
| `useSuspenseQuery` sin `<Suspense>` wrapper | 🔴 Crítico — crash en runtime |
| `useInfiniteQuery` sin `initialPageParam` | 🔴 Crítico — TypeScript error + runtime |
| `setQueryData` en mutación sin `onError` rollback | 🟡 Importante — cache queda stale si falla |
| Mutación sin `invalidateQueries` en `onSettled` | 🟡 Importante — datos stale indefinidos (dado `staleTime: Infinity`) |
| Query key como string suelto en 3+ lugares | 🟡 Importante — usar `queryOptions` |
| Fetch serial donde `useSuspenseQueries` aplica | 🟡 Importante — impacta tiempo de carga |
| Datos duplicados en Redux + TanStack Query cache | 🟢 Sugerencia — doble fuente de verdad |
