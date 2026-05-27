# React 19 — Nuevas APIs y Recomendaciones

> Versión del proyecto: React 19.0.0 · React Native 0.79.0
> Docs oficiales: https://react.dev/blog/2024/04/25/react-19

## Table of Contents

- [Actions y useTransition async](#1-actions-y-usetransition-async)
- [useActionState](#2-useactionstate)
- [useOptimistic](#3-useoptimistic)
- [use() — leer promesas y contexto](#4-use--leer-promesas-y-contexto)
- [React Compiler (auto-memoización)](#5-react-compiler-auto-memoización)
- [Patrones combinados con TanStack Query](#patrones-combinados-con-tanstack-query)
- [Qué NO usar en React Native](#qué-no-usar-en-react-native)
- [Impacto en el codebase actual](#impacto-en-el-codebase-actual)
- [Checklist para Code Review](#checklist-para-code-review)

---

## 1. Actions y useTransition async

`startTransition` ahora acepta funciones async. React gestiona automáticamente `isPending` durante la ejecución.

**Patrón actual en el proyecto:**
```typescript
// ❌ ReviewAndPay.controller.ts — 3 useState + 3 useEffect para sincronizar
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);

const handlePay = async () => {
  setIsLoading(true);
  try {
    await payReservation(params);
  } catch {
    setIsError(true);
  } finally {
    setIsLoading(false);
  }
};
```

**Con React 19 Actions:**
```typescript
// ✅ isPending automático — sin useState extra
const [isPending, startTransition] = useTransition();

const handlePay = () => {
  startTransition(async () => {
    try {
      await payReservation(params);
      navigate('Confirmation');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  });
};
```

**Cuándo usar:** submit de formularios, navegación con fetch previo, cualquier acción async que muestre loading.

**Cuándo NO usar:** inputs controlados (deben ser síncronos), estados de error urgentes.

**Docs:** https://react.dev/reference/react/useTransition

---

## 2. useActionState

Reemplaza el patrón `useState + handler async` para acciones con estado de resultado. Maneja pending + error + resultado en un solo hook.

```typescript
import { useActionState } from 'react';

const [state, submitAction, isPending] = useActionState(
  async (prevState: PaymentState, paymentData: PaymentDetailsState) => {
    try {
      const result = await payReservation(paymentData);
      return { status: 'success' as const, data: result };
    } catch (error) {
      return { status: 'error' as const, message: getErrorMessage(error) };
    }
  },
  { status: 'idle' as const } // estado inicial
);

// isPending     → reemplaza isLoading
// state.status  → reemplaza isError + isSuccess
// state.data    → resultado de la acción
```

**Ventaja directa:** elimina 3-4 `useState` + `useEffect` de sincronización. Aplicable a `ReviewAndPay.controller.ts` que tiene 7 `useEffect` para este propósito.

**Docs:** https://react.dev/reference/react/useActionState

---

## 3. useOptimistic

Muestra estado optimista inmediato mientras la mutación está en vuelo. Revierte automáticamente si falla.

```typescript
import { useOptimistic, useTransition } from 'react';

// ✅ Útil para: agregar/quitar equipaje del carrito, selección de asientos
const [optimisticCart, addOptimisticItem] = useOptimistic(
  cart,
  (currentCart, newItem: BaggageItem) => ({
    ...currentCart,
    items: [...currentCart.items, { ...newItem, isPending: true }],
  })
);

const [, startTransition] = useTransition();

const handleAddBaggage = (item: BaggageItem) => {
  startTransition(async () => {
    addOptimisticItem(item);       // UI actualiza inmediatamente
    await addBaggageToCart(item);  // si falla → revierte automáticamente
  });
};
```

**⚠️ Requiere `startTransition`** — sin él el optimistic update flashea y desaparece.

**Docs:** https://react.dev/reference/react/useOptimistic

---

## 4. use() — leer promesas y contexto

`use()` puede leer una promesa o un contexto dentro del render. A diferencia de `useContext`, puede usarse dentro de condicionales.

```typescript
import { use } from 'react';

// ✅ Contexto condicional — antes imposible con useContext
const MyComponent = ({ showDetails }: { showDetails: boolean }) => {
  if (showDetails) {
    const theme = use(GlobalThemeContext); // OK dentro de if
    return <DetailView theme={theme} />;
  }
  return <SummaryView />;
};
```

```typescript
// ✅ Leer promesa — componente suspende hasta resolver
const FlightCard = ({ flightPromise }: { flightPromise: Promise<Flight> }) => {
  const flight = use(flightPromise);
  return <Text>{flight.origin} → {flight.destination}</Text>;
};

<Suspense fallback={<FlightCardSkeleton />}>
  <FlightCard flightPromise={fetchFlight(pnr)} />
</Suspense>
```

**⚠️ Limitación React Native:** la promesa pasada a `use()` debe ser estable (no recreada en cada render). Usar `useMemo` o definirla fuera del componente.

```typescript
// ❌ Nueva promesa en cada render → suspense loop
const MyComponent = ({ pnr }: { pnr: string }) => {
  const flight = use(fetchFlight(pnr)); // se recrea en cada render
};

// ✅ Promesa estable
const MyComponent = ({ pnr }: { pnr: string }) => {
  const flightPromise = useMemo(() => fetchFlight(pnr), [pnr]);
  const flight = use(flightPromise);
};
```

**Docs:** https://react.dev/reference/react/use

---

## 5. React Compiler (auto-memoización)

El compilador transforma código React para agregar memoización automáticamente, eliminando la necesidad de `useMemo`/`useCallback` manuales en la mayoría de casos.

**Verificar si está activo en el proyecto:**
```javascript
// babel.config.js
module.exports = {
  plugins: [
    ['babel-plugin-react-compiler', { target: '19' }],
  ],
};
```

**Si el compilador está activo:**
- `useMemo`/`useCallback` manuales son redundantes (no dañinos, pero innecesarios)
- El compilador los agrega donde son necesarios
- En code review: no bloquear PR por ausencia de `useCallback` en handlers simples

**Si el compilador NO está activo:** aplicar las reglas de `performance.md` → useMemo y useCallback.

**Docs:** https://react.dev/learn/react-compiler

---

## Patrones combinados con TanStack Query

> Ver también: `references/tanstack-query-v5.md`

### useOptimistic + useMutation (carrito)

```typescript
// ✅ useOptimistic para UI inmediata + useMutation para sincronización con servidor
const [optimisticItems, addOptimistic] = useOptimistic(
  cart.items,
  (items, newItem: BaggageItem) => [...items, { ...newItem, isPending: true }]
);

const { mutate } = useMutation({
  mutationFn: addBaggageToCartApi,
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
});

const [, startTransition] = useTransition();

const handleAdd = (item: BaggageItem) => {
  startTransition(async () => {
    addOptimistic(item);
    mutate(item);
  });
};
```

### useActionState + useMutation (formularios de pago)

```typescript
// ✅ Reemplaza el patrón de 7 useEffects en ReviewAndPay.controller.ts
const [paymentState, submitPayment, isPending] = useActionState(
  async (_: PaymentState, formData: PaymentFormData) => {
    try {
      await payReservation(formData);
      navigate('Confirmation');
      return { status: 'success' as const };
    } catch (error) {
      return { status: 'error' as const, message: getErrorMessage(error) };
    }
  },
  { status: 'idle' as const }
);
```

---

## Qué NO usar en React Native

| API | Motivo |
|-----|--------|
| `useFormStatus` | Solo funciona con `<form>` HTML — no existe en RN |
| Server Components | No soportados en React Native |
| Server Actions | No soportados en React Native |
| `use()` con promesas inestables | Causa suspense loop — la promesa debe ser estable |
| `useDeferredValue` en listas muy largas | Puede causar renders duplicados — evaluar con profiler primero |

---

## Impacto en el codebase actual

| Archivo | Patrón actual | Migración sugerida |
|---------|--------------|-------------------|
| `ReviewAndPay.controller.ts` | 7 `useEffect` para loading/error/success | `useActionState` + `useOptimistic` |
| Cualquier controller con `useState(isLoading)` + `useEffect([isPending])` | Sincronización manual | `useTransition` async |

---

## Checklist para Code Review

- [ ] Acciones async usan `useTransition` o `useActionState` en lugar de `useState(isLoading)` + `useEffect`
- [ ] `useOptimistic` siempre dentro de `startTransition`
- [ ] `use()` con promesas — verificar que la promesa es estable (no recreada en render)
- [ ] Si React Compiler está activo — no bloquear por ausencia de `useCallback`/`useMemo` manuales

### Severidad

| Violación | Severidad |
|-----------|-----------|
| `useOptimistic` sin `startTransition` | 🔴 Crítico — optimistic update no funciona |
| `use()` con promesa inestable (inline) | 🔴 Crítico — suspense loop |
| `useState(isLoading)` + `useEffect` para sincronizar estado async | 🟡 Importante — migrar a `useActionState` |
| `useCallback`/`useMemo` manuales con compilador activo | 🟢 Sugerencia — redundante |
