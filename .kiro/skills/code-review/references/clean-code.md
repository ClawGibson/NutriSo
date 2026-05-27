# Clean Code — Reglas y Anti-patrones

## Table of Contents

- [Responsabilidad Única (SRP)](#responsabilidad-única-srp)
- [Parámetros de Funciones](#parámetros-de-funciones)
- [DRY — Don't Repeat Yourself](#dry)
- [Complejidad Ciclomática](#complejidad-ciclomática)
- [Comentarios](#comentarios)
- [Niveles de Abstracción](#niveles-de-abstracción)
- [Dead Code](#dead-code)

---

## Responsabilidad Única (SRP)

Una función, hook o componente debe tener **un solo motivo para cambiar**.

### Señales de violación

- Función con nombre que usa "y" / "and" (`fetchAndFormatData`, `validateAndSubmit`)
- Hook que mezcla: datos remotos + navegación + analytics + validación
- Componente que renderiza UI **y** calcula lógica de negocio

### Severidad

| Caso | Severidad |
|------|-----------|
| Controller con 3+ responsabilidades distintas | 🔴 Crítico |
| Hook que mezcla 2 dominios (ej. datos + navegación) | 🟡 Importante |
| Función con nombre ambiguo que hace 2 cosas | 🟢 Sugerencia |

### Fix

```typescript
// ❌ Una función hace demasiado
const handleSubmit = async () => {
  validateForm();
  await submitPayment();
  trackAnalyticsEvent('payment_submitted');
  navigate('Confirmation');
};

// ✅ Responsabilidades separadas, orquestadas
const handleSubmit = async () => {
  if (!validateForm()) return;
  await submitPayment();
  onSubmitSuccess(); // navega + trackea en el controller
};
```

---

## Parámetros de Funciones

**Límite: máx 3 parámetros.** Si se necesitan más, usar un objeto tipado.

### Severidad

| Caso | Severidad |
|------|-----------|
| Función con 5+ parámetros posicionales | 🔴 Crítico |
| Función con 4 parámetros posicionales | 🟡 Importante |

### Fix

```typescript
// ❌ Difícil de leer, orden importa
const createBooking = (pnr: string, origin: string, dest: string, date: string, passengers: number) => {};

// ✅ Objeto tipado, orden no importa, extensible
interface CreateBookingParams {
  pnr: string;
  origin: string;
  destination: string;
  departureDate: string;
  passengerCount: number;
}
const createBooking = (params: CreateBookingParams) => {};
```

---

## DRY

Lógica duplicada en 2+ lugares debe extraerse a un hook, utilidad o constante compartida.

### Señales de violación

- Mismo bloque de transformación de datos en 2 controllers distintos
- Misma validación reescrita en múltiples formularios
- Misma constante definida en múltiples archivos

### Severidad

| Caso | Severidad |
|------|-----------|
| Lógica de negocio duplicada en 3+ lugares | 🔴 Crítico |
| Lógica duplicada en 2 lugares | 🟡 Importante |
| Constante duplicada | 🟢 Sugerencia |

### Fix

```typescript
// ❌ Misma transformación en CheckinController y BookingController
const formattedDate = date.split('T')[0].replace(/-/g, '/');

// ✅ Extraída a utils
// utils/date.utils.ts
export const formatDisplayDate = (isoDate: string): string =>
  isoDate.split('T')[0].replace(/-/g, '/');
```

---

## Complejidad Ciclomática

**Límite: máx 7 ramas por función** (if, else, switch case, ternario, &&, ||, catch).

Una función de 30 líneas con 8 condicionales es más problemática que una de 50 líneas lineal.

### Señales de violación

- `if/else if/else if/else` con 4+ ramas
- Switch con 6+ cases sin extraer a mapa
- Ternarios anidados (`a ? b ? c : d : e`)

### Severidad

| Caso | Severidad |
|------|-----------|
| Complejidad > 10 | 🔴 Crítico |
| Complejidad 8-10 | 🟡 Importante |
| Complejidad 6-7 | 🟢 Sugerencia |

### Fix

```typescript
// ❌ Switch con lógica compleja por case
switch (status) {
  case 'confirmed': return { color: theme.colors.Status.Success, label: 'Confirmado' };
  case 'pending':   return { color: theme.colors.Status.Warning, label: 'Pendiente' };
  case 'cancelled': return { color: theme.colors.Status.Error,   label: 'Cancelado' };
  default:          return { color: theme.colors.Text.Text3,     label: 'Desconocido' };
}

// ✅ Mapa de configuración
const STATUS_CONFIG: Record<BookingStatus, { color: string; label: CopyID }> = {
  confirmed: { color: theme.colors.Status.Success, label: 'booking.status.confirmed' },
  pending:   { color: theme.colors.Status.Warning, label: 'booking.status.pending' },
  cancelled: { color: theme.colors.Status.Error,   label: 'booking.status.cancelled' },
};
const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.default;
```

---

## Comentarios

### Reglas

- **Prohibido:** comentarios que explican *qué* hace el código (el código debe ser autoexplicativo)
- **Permitido:** comentarios que explican *por qué* se tomó una decisión no obvia
- **Prohibido:** código comentado — eliminarlo o crear ticket
- **Permitido:** `// TODO: [TICKET-123] descripción` con referencia a ticket

### Severidad

| Caso | Severidad |
|------|-----------|
| Código comentado en producción (> 5 líneas) | 🟡 Importante |
| Comentario que explica qué hace el código | 🟢 Sugerencia |
| `// TODO` sin referencia a ticket | 🟢 Sugerencia |

### Ejemplos

```typescript
// ❌ Explica qué (obvio del código)
// Incrementa el contador
setCount(prev => prev + 1);

// ✅ Explica por qué (no obvio)
// RTK Query no invalida automáticamente este endpoint al mutar otro recurso
// Ver: https://aeromexico.atlassian.net/browse/CI-12345
refetch();

// ❌ Código comentado
// const oldHandler = () => { ... };

// ✅ TODO con ticket
// TODO: [CI-20547] Migrar a nuevo endpoint de pagos cuando esté disponible en prod
```

---

## Niveles de Abstracción

Una función debe operar en **un solo nivel de abstracción**. No mezclar lógica de alto nivel (orquestación) con detalles de bajo nivel (manipulación de strings, cálculos).

### Señales de violación

- Función que llama a `navigate()` y también hace `date.split('T')[0]`
- Componente con JSX de alto nivel que incluye cálculos inline complejos

### Severidad: 🟡 Importante

### Fix

```typescript
// ❌ Mezcla niveles: orquestación + detalle de string
const handleConfirm = () => {
  const formattedDate = reservation.date.split('T')[0].replace(/-/g, '/');
  const passengerNames = passengers.map(p => `${p.firstName} ${p.lastName}`).join(', ');
  navigate('Confirmation', { date: formattedDate, names: passengerNames });
};

// ✅ Alto nivel orquesta, bajo nivel en utilidades
const handleConfirm = () => {
  navigate('Confirmation', {
    date: formatDisplayDate(reservation.date),
    names: formatPassengerNames(passengers),
  });
};
```

---

## Dead Code

### Qué buscar

- Variables declaradas pero nunca leídas
- Imports no utilizados (el linter detecta algunos, pero verificar manualmente en diff)
- Funciones exportadas que ningún archivo importa
- Props definidas en el model que el componente nunca usa
- Feature flags permanentemente `false` o `true`

### Severidad

| Caso | Severidad |
|------|-----------|
| Función exportada sin consumidores (verificar con grep) | 🟡 Importante |
| Import no utilizado | 🟢 Sugerencia |
| Variable declarada sin usar | 🟢 Sugerencia |
| Feature flag hardcodeado | 🟡 Importante |
