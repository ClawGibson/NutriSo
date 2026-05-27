# Maintainability — Reglas y Checklists

## Table of Contents

- [Archivos de Navegación](#archivos-de-navegación)
- [Archivos de Constantes y Enums](#archivos-de-constantes-y-enums)
- [Props Drilling](#props-drilling)
- [Cohesión de Módulos](#cohesión-de-módulos)
- [Redux / RTK Selectors](#redux--rtk-selectors)
- [Barrel Exports (index.ts)](#barrel-exports-indexts)
- [Storybook](#storybook)

---

## Archivos de Navegación

Archivos `*.navigator.tsx`, `*.routes.ts`, `*.navigation.ts`.

### Checklist

- [ ] Rutas definidas como constantes tipadas (no strings sueltos)
- [ ] Params de navegación tipados con `RootStackParamList` o equivalente
- [ ] Sin lógica de negocio en el navigator (solo estructura de rutas)
- [ ] Deep link handlers sanitizan parámetros antes de usarlos
- [ ] Navegación condicional (auth guard) en un solo lugar, no dispersa

### Anti-patrones

```typescript
// ❌ String suelto en navigate
navigation.navigate('PaymentScreen' as any);

// ✅ Ruta tipada desde constante
import { ROUTES } from 'navigation/routes.constants';
navigation.navigate(ROUTES.PAYMENT);

// ❌ Deep link sin sanitización
const { pnr } = route.params; // pnr podría ser undefined o malformado
fetchBooking(pnr);

// ✅ Deep link con guard
const pnr = route.params?.pnr;
if (!pnr || !PNR_REGEX.test(pnr)) return;
fetchBooking(pnr);
```

### Severidad

| Caso | Severidad |
|------|-----------|
| Deep link sin sanitización de params | 🔴 Crítico |
| Rutas como strings sin tipar | 🟡 Importante |
| Lógica de negocio en navigator | 🟡 Importante |

---

## Archivos de Constantes y Enums

Archivos `*.constants.ts`, `*.enums.ts`.

### Checklist

- [ ] Constantes con `as const` y tipo inferido o explícito
- [ ] Enums con valores string explícitos (no numéricos implícitos)
- [ ] Sin lógica ejecutable — solo declaraciones
- [ ] Agrupadas por dominio, no un archivo global con todo
- [ ] Exportadas desde un barrel si el módulo las necesita externamente

### Anti-patrones

```typescript
// ❌ Enum numérico implícito (frágil al reordenar)
enum Status { Pending, Confirmed, Cancelled }

// ✅ Enum con valores string explícitos
enum BookingStatus {
  Pending = 'PENDING',
  Confirmed = 'CONFIRMED',
  Cancelled = 'CANCELLED',
}

// ❌ Constante mutable
let MAX_RETRIES = 3;

// ✅ Constante inmutable tipada
const MAX_RETRIES = 3 as const;
```

---

## Props Drilling

Pasar props más de **2 niveles** hacia abajo es un smell. A los 3+ niveles, evaluar alternativas.

### Señales de violación

- Prop que pasa por `ScreenComponent → SectionComponent → ItemComponent → ButtonComponent`
- Prop que el componente intermedio no usa, solo la pasa hacia abajo

### Severidad

| Caso | Severidad |
|------|-----------|
| Props drilling 4+ niveles | 🔴 Crítico |
| Props drilling 3 niveles | 🟡 Importante |

### Alternativas

```typescript
// ❌ Drilling: Screen → Section → Item → Button
<Screen onConfirm={handleConfirm}>
  <Section onConfirm={onConfirm}>  {/* Section no usa onConfirm */}
    <Item onConfirm={onConfirm}>   {/* Item no usa onConfirm */}
      <Button onPress={onConfirm} />
    </Item>
  </Section>
</Screen>

// ✅ Opción 1: Composición (render prop / children)
// ✅ Opción 2: Context local del feature
// ✅ Opción 3: Mover el estado al controller del componente que lo necesita
```

---

## Cohesión de Módulos

Un controller con 15+ imports es señal de baja cohesión — hace demasiado.

### Qué hacer cuando se supera el límite de imports

Identificar grupos de imports relacionados y extraerlos a hooks especializados:

```typescript
// ❌ Controller con 18 imports mezclando dominios
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { useGetFlightQuery, useGetSeatsQuery } from 'services/flight.service';
import { useGetPassengersQuery } from 'services/passenger.service';
import { useAnalytics } from 'hooks/useAnalytics';
import { useToast } from 'hooks/useToast';
// ... 12 más

// ✅ Extraer por dominio
const { flightData, seatsData } = useCheckinFlightData(pnr);
const { passengers } = useCheckinPassengers(pnr);
const { trackStep } = useCheckinAnalytics();
```

### Severidad

| Caso | Severidad |
|------|-----------|
| Controller con 20+ imports | 🔴 Crítico |
| Controller con 15-19 imports | 🟡 Importante |

---

## Redux / RTK Selectors

### Checklist

- [ ] Selectores complejos usan `createSelector` (memoización)
- [ ] Selectores no retornan nuevos objetos/arrays en cada llamada sin `createSelector`
- [ ] Estado normalizado — no arrays de objetos cuando se necesita lookup por ID
- [ ] Slice no contiene lógica de UI (colores, labels, strings de display)
- [ ] `extraReducers` maneja los 3 estados de thunks: pending, fulfilled, rejected

### Anti-patrones

```typescript
// ❌ Selector que crea nuevo array en cada llamada → re-render en cada dispatch
const selectActivePassengers = (state: RootState) =>
  state.passengers.list.filter(p => p.isActive); // nuevo array cada vez

// ✅ Memoizado con createSelector
const selectActivePassengers = createSelector(
  (state: RootState) => state.passengers.list,
  (passengers) => passengers.filter(p => p.isActive)
);

// ❌ Lógica de display en el slice
reducers: {
  setStatus: (state, action) => {
    state.statusLabel = action.payload === 'confirmed' ? 'Confirmado' : 'Pendiente'; // ❌
  }
}

// ✅ Display logic en el controller o en un selector de presentación
```

---

## Barrel Exports (index.ts)

Cada módulo MVVM debería tener un `index.ts` que exponga solo la interfaz pública.

### Checklist

- [ ] `index.ts` exporta solo lo que otros módulos necesitan consumir
- [ ] No re-exporta tipos internos que no deberían ser públicos
- [ ] Imports externos usan el barrel, no rutas internas del módulo

### Ejemplo

```typescript
// ✅ index.ts del módulo PaymentCard
export { PaymentCard } from './PaymentCard.component';
export type { PaymentCardProps } from './PaymentCard.model';
// No exportar: controller, styled (son detalles de implementación)

// ✅ Consumidor usa el barrel
import { PaymentCard } from 'components/PaymentCard';

// ❌ Consumidor accede a internos
import { PaymentCard } from 'components/PaymentCard/PaymentCard.component';
```

### Severidad: 🟢 Sugerencia (a menos que cause acoplamiento directo a internos → 🟡)

---

## Storybook

Archivos `*.stories.tsx`.

### Checklist

- [ ] Story cubre el estado por defecto (happy path)
- [ ] Story cubre estado de error o vacío si el componente lo maneja
- [ ] Story cubre estado de loading si aplica
- [ ] Props del story usan datos ficticios (no datos reales)
- [ ] Story no importa lógica de negocio — solo props del componente

### Severidad

| Caso | Severidad |
|------|-----------|
| Story con datos reales (PII) | 🔴 Crítico |
| Story sin estado de error cuando el componente lo maneja | 🟡 Importante |
| Story faltante para componente nuevo | 🟢 Sugerencia |
