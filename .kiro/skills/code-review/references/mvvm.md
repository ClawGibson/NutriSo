# MVVM — Reglas Avanzadas y Flujo de Datos

## Table of Contents

- [Flujo de Datos Unidireccional](#flujo-de-datos-unidireccional)
- [Capa de Transformación (Transformers)](#capa-de-transformación-transformers)
- [Model vs Controller — Qué va dónde](#model-vs-controller--qué-va-dónde)
- [Screen vs Component](#screen-vs-component)
- [Barrel Exports del Módulo](#barrel-exports-del-módulo)
- [Checklist Extendido por Capa](#checklist-extendido-por-capa)

---

## Flujo de Datos Unidireccional

El flujo correcto es **siempre descendente**:

```
Service/Store → Controller → Component → (eventos) → Controller → Service/Store
```

### Violaciones bloqueantes

| Violación | Descripción | Severidad |
|-----------|-------------|-----------|
| Componente llama directamente a un service | Saltarse el controller | 🔴 Crítico |
| Componente A importa estado de Componente B | Coupling lateral | 🔴 Crítico |
| Controller importa otro controller | Acoplamiento entre controllers | 🔴 Crítico |
| Service importa desde un componente | Inversión del flujo | 🔴 Crítico |

### Ejemplo de violación y fix

```typescript
// ❌ Componente accede directamente al store
const MyComponent = () => {
  const dispatch = useDispatch(); // ❌ dispatch en el componente
  const data = useGetFlightQuery(pnr); // ❌ query en el componente
  return <View />;
};

// ✅ Todo pasa por el controller
const MyComponent = (props: MyComponentProps) => {
  const { data, handleRefresh } = useMyComponentController(props);
  return <View />;
};

// En el controller:
export const useMyComponentController = (props: MyComponentProps) => {
  const dispatch = useDispatch();
  const { data } = useGetFlightQuery(props.pnr);
  const handleRefresh = useCallback(() => dispatch(refreshAction()), [dispatch]);
  return { data, handleRefresh };
};
```

---

## Capa de Transformación (Transformers)

Las transformaciones de datos de API → modelo de UI **no van en el controller ni en el model**. Van en un archivo `*.transformer.ts` o en el `transformResponse` del RTK Query endpoint.

### Cuándo crear un transformer

- La respuesta del API tiene una estructura diferente a lo que el componente necesita
- Se necesita combinar datos de múltiples endpoints
- Hay cálculos derivados (totales, fechas formateadas, estados calculados)

### Estructura

```typescript
// flight.transformer.ts
import { FlightApiResponse } from './flight.model';
import { FlightDisplayData } from './flight.model';

export const transformFlightResponse = (api: FlightApiResponse): FlightDisplayData => ({
  id: api.flightId,
  route: `${api.origin} → ${api.destination}`,
  departureTime: formatDisplayTime(api.departureUtc),
  isDelayed: api.status === 'DELAYED',
  delayMinutes: api.delayMinutes ?? 0,
});
```

### Severidad

| Caso | Severidad |
|------|-----------|
| Transformación compleja (5+ campos) en el controller | 🟡 Importante |
| Transformación inline en el componente | 🔴 Crítico |
| Transformer duplicado en 2+ controllers | 🟡 Importante |

---

## Model vs Controller — Qué va dónde

Confusión frecuente sobre qué pertenece a cada capa:

| Elemento | Model | Controller | Transformer |
|----------|-------|------------|-------------|
| Interfaces de props | ✅ | ❌ | ❌ |
| Tipos de respuesta de API | ✅ | ❌ | ❌ |
| Enums de dominio | ✅ | ❌ | ❌ |
| Constantes del módulo | ✅ | ❌ | ❌ |
| Funciones de transformación | ❌ | ❌ | ✅ |
| Estado local (useState) | ❌ | ✅ | ❌ |
| Event handlers | ❌ | ✅ | ❌ |
| Llamadas a servicios | ❌ | ✅ | ❌ |
| Lógica de navegación | ❌ | ✅ | ❌ |

### Señales de violación en el Model

```typescript
// ❌ Función ejecutable en el model
export const formatPassengerName = (p: Passenger) => `${p.firstName} ${p.lastName}`;

// ✅ Solo tipos en el model
export interface Passenger {
  firstName: string;
  lastName: string;
}
// La función va en passenger.transformer.ts o utils/passenger.utils.ts
```

---

## Screen vs Component

En el contexto de navegación de React Navigation:

| Aspecto | Screen | Component |
|---------|--------|-----------|
| Recibe `route.params` | ✅ Sí | ❌ No |
| Registrada en el navigator | ✅ Sí | ❌ No |
| Puede tener múltiples sub-componentes | ✅ Sí | Limitado |
| Responsabilidad | Orquestación de la pantalla | UI reutilizable |
| Nombre de archivo | `*.screen.tsx` o `*.component.tsx` | `*.component.tsx` |

### Checklist para Screens

- [ ] Extrae `route.params` en el controller, no en el componente
- [ ] Sanitiza params antes de usarlos (ver `maintainability.md` → Deep Links)
- [ ] No pasa `navigation` como prop a sub-componentes (usar `useNavigation` en el controller)
- [ ] Maneja el estado de carga y error a nivel de pantalla

---

## Barrel Exports del Módulo

Cada módulo MVVM debe exponer solo su interfaz pública vía `index.ts`.

```
PaymentCard/
├── index.ts                    ← Solo exporta lo público
├── PaymentCard.component.tsx
├── PaymentCard.controller.ts   ← Detalle de implementación, no exportar
├── PaymentCard.model.ts
├── PaymentCard.styled.ts       ← Detalle de implementación, no exportar
└── PaymentCard.transformer.ts  ← Detalle de implementación, no exportar
```

```typescript
// index.ts
export { PaymentCard } from './PaymentCard.component';
export type { PaymentCardProps, CardInfo } from './PaymentCard.model';
```

---

## Checklist Extendido por Capa

### Component (extendido)

- [ ] No importa directamente desde `react-redux` (useSelector, useDispatch)
- [ ] No llama a hooks de RTK Query directamente
- [ ] No accede a `route.params` directamente (lo recibe del controller)
- [ ] Datos de display ya transformados cuando llegan (no transforma en JSX)

### Controller (extendido)

- [ ] No importa desde otro controller del mismo nivel
- [ ] `useEffect` con cleanup cuando hay subscripciones o timers
- [ ] Dependencias de `useEffect` correctas — no usar `// eslint-disable-next-line`
- [ ] Retorna solo lo que el componente necesita (no exponer estado interno innecesario)

### Model (extendido)

- [ ] Tipos de respuesta de API separados de tipos de display
- [ ] Props opcionales con `?` y valor por defecto documentado si aplica
- [ ] Sin funciones de transformación (van en transformer)
- [ ] Tipos de error tipados, no `any`

### Transformer (nuevo — si existe)

- [ ] Función pura — mismo input siempre produce mismo output
- [ ] Maneja campos opcionales/nulos de la API sin crashear
- [ ] Testeable de forma aislada
- [ ] Nombre descriptivo: `transformFlightResponse`, `mapPassengerToDisplay`
