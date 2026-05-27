# Performance — Reglas y Checklists para React Native

## Table of Contents

- [FlatList / SectionList](#flatlist--sectionlist)
- [Re-renders Innecesarios](#re-renders-innecesarios)
- [useMemo y useCallback](#usememo-y-usecallback)
- [Animaciones](#animaciones)
- [Imágenes](#imágenes)
- [Bundle Size e Imports](#bundle-size-e-imports)
- [useEffect y Dependencias](#useeffect-y-dependencias)

---

## FlatList / SectionList

Las listas son el punto de performance más crítico en apps móviles. Verificar en **todo** PR que toque listas.

### Checklist

- [ ] `keyExtractor` retorna un ID único estable (no el índice)
- [ ] `renderItem` es un componente memoizado (`React.memo`) o usa `useCallback`
- [ ] `getItemLayout` definido si los items tienen altura fija (elimina mediciones)
- [ ] `removeClippedSubviews={true}` en listas largas (>20 items)
- [ ] `maxToRenderPerBatch` configurado (default 10, reducir si items son pesados)
- [ ] `windowSize` configurado (default 21, reducir para listas muy largas)
- [ ] `initialNumToRender` ajustado al número visible en pantalla
- [ ] Sin funciones inline en `renderItem`

### Severidad

| Caso | Severidad |
|------|-----------|
| `keyExtractor` usando índice (`(_, index) => index`) | 🔴 Crítico |
| `renderItem` con función inline sin memoizar | 🟡 Importante |
| Lista larga sin `getItemLayout` (items altura fija) | 🟡 Importante |
| Sin `removeClippedSubviews` en lista > 50 items | 🟢 Sugerencia |

### Ejemplo

```typescript
// ❌ keyExtractor con índice + renderItem inline
<FlatList
  data={flights}
  keyExtractor={(_, index) => String(index)}
  renderItem={({ item }) => <FlightCard flight={item} onPress={() => handlePress(item.id)} />}
/>

// ✅ keyExtractor estable + renderItem memoizado
const renderFlightItem = useCallback(
  ({ item }: { item: Flight }) => (
    <FlightCard flight={item} onPress={handlePress} />
  ),
  [handlePress]
);

<FlatList
  data={flights}
  keyExtractor={(item) => item.id}
  renderItem={renderFlightItem}
  getItemLayout={(_, index) => ({ length: FLIGHT_CARD_HEIGHT, offset: FLIGHT_CARD_HEIGHT * index, index })}
  removeClippedSubviews
  maxToRenderPerBatch={5}
  windowSize={10}
  initialNumToRender={8}
/>
```

---

## Re-renders Innecesarios

### Señales de violación

#### 1. Objetos/arrays inline en JSX

```typescript
// ❌ Nuevo objeto en cada render → re-render del hijo
<MyComponent style={{ marginTop: 16 }} config={{ timeout: 3000 }} />

// ✅ Fuera del componente o memoizado
const COMPONENT_STYLE = { marginTop: 16 } as const;
const COMPONENT_CONFIG = { timeout: 3000 } as const;
<MyComponent style={COMPONENT_STYLE} config={COMPONENT_CONFIG} />
```

#### 2. Funciones inline en props

```typescript
// ❌ Nueva función en cada render
<Button onPress={() => handlePayment(item.id)} />

// ✅ useCallback o función estable
const handlePaymentPress = useCallback(() => handlePayment(item.id), [item.id, handlePayment]);
<Button onPress={handlePaymentPress} />
```

#### 3. Componentes que deberían estar memoizados

```typescript
// ❌ Componente hijo se re-renderiza aunque sus props no cambien
const FlightCard = ({ flight, onPress }) => { ... };

// ✅ Memoizado cuando el padre re-renderiza frecuentemente
const FlightCard = React.memo(({ flight, onPress }: FlightCardProps) => { ... });
```

### Cuándo aplicar `React.memo`

Aplicar cuando el componente:
- Es un item de lista (`renderItem`)
- Recibe props que raramente cambian
- Tiene un render costoso (muchos elementos, cálculos)

**No aplicar** en componentes simples o que siempre reciben props nuevas.

### Severidad

| Caso | Severidad |
|------|-----------|
| Item de lista sin `React.memo` | 🟡 Importante |
| Objeto/array inline en prop de componente memoizado | 🔴 Crítico (anula la memoización) |
| Función inline en `renderItem` | 🟡 Importante |

---

## useMemo y useCallback

### Cuándo usar `useMemo`

- Cálculos costosos (filtrar/ordenar arrays grandes, transformaciones complejas)
- Valor pasado como prop a un componente memoizado
- Dependencia de otro `useEffect` o `useCallback`

### Cuándo usar `useCallback`

- Función pasada como prop a un componente memoizado
- Función usada como dependencia de `useEffect`
- Handler en items de lista

### Cuándo NO usar (over-optimization)

- Cálculos triviales (`const label = isActive ? 'Activo' : 'Inactivo'`)
- Componentes que no están memoizados (no hay beneficio)
- Funciones que no se pasan como props

```typescript
// ❌ useMemo innecesario
const label = useMemo(() => isActive ? 'Activo' : 'Inactivo', [isActive]);

// ✅ Directo
const label = isActive ? 'Activo' : 'Inactivo';

// ✅ useMemo justificado
const sortedFlights = useMemo(
  () => [...flights].sort((a, b) => a.departureTime.localeCompare(b.departureTime)),
  [flights]
);
```

### Severidad

| Caso | Severidad |
|------|-----------|
| Función pasada a componente memoizado sin `useCallback` | 🟡 Importante |
| Cálculo costoso (sort/filter de array grande) sin `useMemo` | 🟡 Importante |
| `useMemo`/`useCallback` en cálculo trivial | 🟢 Sugerencia (over-engineering) |

---

## Animaciones

### Checklist

- [ ] Animaciones con `Animated.Value` usan `useNativeDriver: true` cuando es posible
- [ ] `useNativeDriver: true` solo para propiedades soportadas: `opacity`, `transform`
- [ ] `useNativeDriver: false` solo para propiedades de layout: `width`, `height`, `margin`
- [ ] Animaciones de Reanimated 2 usan `useSharedValue` y `useAnimatedStyle`
- [ ] Sin `setState` dentro de callbacks de animación (bloquea JS thread)

### Severidad

| Caso | Severidad |
|------|-----------|
| Animación de `opacity`/`transform` sin `useNativeDriver: true` | 🟡 Importante |
| `setState` dentro de `Animated.timing` callback | 🔴 Crítico |
| Animación compleja en JS thread que causa jank | 🟡 Importante |

```typescript
// ❌ Sin useNativeDriver en transform
Animated.timing(translateX, {
  toValue: 100,
  duration: 300,
  // useNativeDriver no especificado → JS thread
}).start();

// ✅ Con useNativeDriver
Animated.timing(translateX, {
  toValue: 100,
  duration: 300,
  useNativeDriver: true, // corre en UI thread
}).start();
```

---

## Imágenes

### Checklist

- [ ] Usa `FastImage` (de `react-native-fast-image`) en lugar de `Image` para imágenes remotas
- [ ] `resizeMode` apropiado para el caso de uso
- [ ] Imágenes locales importadas estáticamente (no con path dinámico)
- [ ] Sin imágenes de alta resolución para thumbnails (usar URL con parámetros de tamaño si el API lo soporta)
- [ ] `defaultSource` o placeholder mientras carga

### Severidad

| Caso | Severidad |
|------|-----------|
| `Image` de RN para imágenes remotas en lista | 🟡 Importante |
| Imagen sin `resizeMode` en contenedor de tamaño fijo | 🟢 Sugerencia |
| Sin placeholder en imagen de carga lenta | 🟢 Sugerencia |

```typescript
// ❌ Image nativo para imágenes remotas
<Image source={{ uri: passenger.photoUrl }} style={styles.avatar} />

// ✅ FastImage con cache y placeholder
<FastImage
  source={{ uri: passenger.photoUrl, priority: FastImage.priority.normal }}
  style={styles.avatar}
  resizeMode={FastImage.resizeMode.cover}
  defaultSource={require('assets/images/avatar-placeholder.png')}
/>
```

---

## Bundle Size e Imports

### Señales de violación

```typescript
// ❌ Import de librería completa cuando solo se necesita una función
import _ from 'lodash';
const result = _.debounce(fn, 300);

// ✅ Import específico
import debounce from 'lodash/debounce';

// ❌ Import de toda la librería de iconos
import { Icon1, Icon2 } from 'react-native-vector-icons';

// ✅ Import del pack específico
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
```

### Qué buscar en el diff

- Imports de `lodash`, `moment`, `date-fns` sin path específico
- Librerías nuevas en `package.json` — evaluar si ya existe alternativa en el proyecto
- Re-exports de módulos grandes sin tree-shaking

### Severidad

| Caso | Severidad |
|------|-----------|
| Import de librería completa (lodash, moment) | 🟡 Importante |
| Dependencia nueva que duplica funcionalidad existente | 🟡 Importante |

---

## useEffect y Dependencias

### Checklist

- [ ] Dependencias del array son correctas y completas
- [ ] Sin `// eslint-disable-next-line react-hooks/exhaustive-deps` sin justificación
- [ ] Cleanup implementado para subscripciones, timers, event listeners
- [ ] Sin `useEffect` que se dispara en cada render por dependencia inestable (objeto/función inline)

### Señales de violación

```typescript
// ❌ Dependencia inestable — objeto nuevo en cada render
useEffect(() => {
  fetchData(config); // config es { timeout: 3000 } definido inline arriba
}, [config]); // se dispara en cada render

// ✅ Dependencia estable
const stableConfig = useMemo(() => ({ timeout: 3000 }), []);
useEffect(() => {
  fetchData(stableConfig);
}, [stableConfig]);

// ❌ Sin cleanup en subscripción
useEffect(() => {
  const subscription = eventEmitter.addListener('event', handler);
  // falta return cleanup
}, []);

// ✅ Con cleanup
useEffect(() => {
  const subscription = eventEmitter.addListener('event', handler);
  return () => subscription.remove();
}, []);
```

### Severidad

| Caso | Severidad |
|------|-----------|
| `useEffect` sin cleanup con subscripción/timer | 🔴 Crítico (memory leak) |
| `eslint-disable` en exhaustive-deps sin comentario explicativo | 🟡 Importante |
| Dependencia inestable que causa loop de renders | 🔴 Crítico |

---

## Hooks — Patrones Bloqueantes y Circulares

Esta sección cubre patrones encontrados en el codebase real de am-mobile-app.

### 1. useEffect([callback]) — Loop potencial

Patrón más frecuente y peligroso: `useEffect` cuya única dependencia es un `useCallback`.
Si el `useCallback` tiene dependencias que cambian, recrea la función → dispara el effect → puede mutar estado → recrea el callback → loop.

```typescript
// ⚠️ Patrón a auditar — AssignSavedPassengers.controller.ts
const loadPassengerList = useCallback(async () => {
  // ...fetch y setPassengerList(...)
}, [passengerType, date, profileDataUiModel?.accountNumber]);

useEffect(() => {
  loadPassengerList();
}, [loadPassengerList]); // ← se dispara cada vez que loadPassengerList cambia
```

**Cuándo es 🔴 Crítico:** si dentro del callback hay un `setState` cuyo valor es dependencia del `useCallback`.

**Cuándo es 🟡 Importante:** si las dependencias del `useCallback` son estables (primitivos, refs) — el loop no ocurre pero el patrón es frágil.

**Fix:** mover las dependencias directamente al `useEffect`:

```typescript
// ✅ Dependencias directas en el effect, callback sin deps inestables
useEffect(() => {
  loadPassengerList();
}, [passengerType, date, profileDataUiModel?.accountNumber]);

const loadPassengerList = useCallback(async () => { ... }, []);
```

---

### 2. useEffect que registra un callback en contexto externo

Patrón encontrado en `ReviewAndPay.controller.ts`:

```typescript
// ⚠️ ReviewAndPay.controller.ts — L537
const handleAddPaymentMethod = useCallback((paymentMethod) => {
  // usa currencyProducts.total y currentFlight.currency.currencyCode
}, [currentFlight.currency.total, currentFlight.currency.currencyCode]);

useEffect(() => {
  setPaymentHandler(handleAddPaymentMethod); // registra en Context externo
}, [handleAddPaymentMethod]);
```

**Problema:** cada vez que `currentFlight.currency` cambia → `handleAddPaymentMethod` se recrea → `useEffect` se dispara → `setPaymentHandler` actualiza el Context → cualquier consumidor del Context re-renderiza.

**Severidad:** 🟡 Importante — no es loop pero causa re-renders en cascada vía Context.

**Fix:** usar `useRef` para estabilizar el callback registrado:

```typescript
// ✅ Ref estable — el Context siempre llama a la versión más reciente sin re-registrar
const handleAddPaymentMethodRef = useRef(handleAddPaymentMethod);
useEffect(() => {
  handleAddPaymentMethodRef.current = handleAddPaymentMethod;
}, [handleAddPaymentMethod]);

useEffect(() => {
  setPaymentHandler((...args) => handleAddPaymentMethodRef.current(...args));
}, []); // solo registra una vez
```

---

### 3. Controller con 6+ useEffects — Señal de SRP violado

`ReviewAndPay.controller.ts` tiene **7 useEffects** con responsabilidades distintas:
loading state, header visibility, error modal, success navigation, payment handler registration, default card, rewards.

**Severidad:** 🔴 Crítico — cada effect es un motivo de cambio independiente. El controller tiene 7 razones para cambiar.

**Fix:** extraer por dominio:

```typescript
// ✅ Hooks especializados
const { isLoading } = usePaymentLoadingState(isPending, navigationRP);
const { isOpen, failureCount } = usePaymentErrorState(isError, isPending, isSuccess);
usePaymentHandlerRegistration(setPaymentHandler, handleAddPaymentMethod);
```

---

### 4. useMemo con dependencia `[passengers]` donde passengers es un `useRef`

Encontrado en `ReviewAndPay.controller.ts`:

```typescript
// ⚠️ passengers es useRef — .current nunca cambia como referencia
const currencyProducts = useMemo(() => {
  // usa passengers.current internamente
}, [passengers]); // ← passengers (el ref) nunca cambia → useMemo nunca se recalcula
```

**Problema:** si `passengers.current` muta (se actualiza el array), `useMemo` no lo detecta porque la referencia del `ref` es estable. El valor calculado queda stale.

**Severidad:** 🔴 Crítico — bug silencioso: muestra precios desactualizados si los pasajeros cambian.

**Fix:**

```typescript
// ✅ Opción 1: dependencia en el valor, no en el ref
const currencyProducts = useMemo(() => { ... }, [passengers.current]);

// ✅ Opción 2: convertir a estado si los pasajeros pueden cambiar
const [passengers, setPassengers] = useState(currentFlight.getPassengers2());
```

---

### 5. Hooks bloqueantes en cadena (waterfall)

Patrón donde hook A espera resultado de hook B que espera resultado de hook C — cada uno con su propio loading state.

```typescript
// ⚠️ Waterfall — ManageBaggage.controller.ts
const { currentFlight } = useFlightDetail();           // fetch 1
const { cart } = useCart({ ... });                     // fetch 2 (depende de currentFlight)
const { benefitsData } = useBenefits('');              // fetch 3 (depende de cart)
const { pointsBalance } = useBalance();                // fetch 4 (independiente pero serial)
```

**Problema:** si cada hook tiene su propio `useEffect` que dispara al montar, los fetches son seriales en vez de paralelos. Tiempo total = suma de todos los tiempos.

**Severidad:** 🟡 Importante — impacta tiempo de carga percibido.

**Fix:** identificar qué fetches son independientes y dispararlos en paralelo con `Promise.all` o usando RTK Query con `skip` correctamente configurado.

---

### Checklist de Hooks para Code Review

- [ ] `useEffect([callback])` — verificar si el callback tiene deps que mutan estado → loop potencial
- [ ] `useEffect` que registra callback en Context/ref externo — usar ref estable para evitar re-renders en cascada
- [ ] Controller con 5+ `useEffect` — evaluar split por dominio
- [ ] `useMemo` con `useRef` como dependencia — bug silencioso de valor stale
- [ ] Hooks en cadena con fetches seriales — evaluar paralelización
- [ ] `useCallback` cuyas deps incluyen valores derivados de otros hooks — verificar estabilidad

### Severidad Resumen

| Patrón | Severidad |
|--------|-----------|
| `useEffect([callback])` con loop confirmado | 🔴 Crítico |
| `useMemo([ref])` — valor stale | 🔴 Crítico |
| Controller con 7+ useEffects | 🔴 Crítico |
| `useEffect` registra callback en Context sin ref estable | 🟡 Importante |
| Hooks en waterfall (fetches seriales evitables) | 🟡 Importante |
| `useEffect([callback])` sin loop pero frágil | 🟡 Importante |
