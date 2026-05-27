# Reglas Transversales de Code Review

## Table of Contents

- [Estilo de Código](#estilo-de-código)
- [Seguridad](#seguridad)
- [Violaciones Críticas (Bloqueantes)](#violaciones-críticas)
- [Anti-patrones Conocidos](#anti-patrones-conocidos)
- [Configuración Nativa (Android/iOS)](#configuración-nativa-androidios)
- [Consistencia de Dependencias (Monorepo)](#consistencia-de-dependencias-monorepo)
- [Manejo de Errores](#manejo-de-errores)
- [Criptografía y Generación de IDs](#criptografía-y-generación-de-ids)
- [Archivos Eliminados y Lógica Migrada](#archivos-eliminados-y-lógica-migrada)

> **Referencias especializadas — leer cuando aplique:**
> - `references/clean-code.md` — SRP, DRY, complejidad ciclomática, comentarios, dead code
> - `references/maintainability.md` — Navegación, RTK selectors, props drilling, barrel exports, Storybook
> - `references/mvvm.md` — Flujo de datos unidireccional, transformers, Screen vs Component
> - `references/performance.md` — FlatList, re-renders, useMemo/useCallback, animaciones, imágenes, bundle size
> - `references/security-advanced.md` — Deep links, WebView, tokens de sesión, permisos, certificate pinning

---

## Estilo de Código

### Imports

Orden obligatorio:
1. Externos (react, react-native, librerías)
2. Internos (libs del proyecto, store, services)
3. Locales (./controller, ./model, ./styled)

```typescript
// ✅ Correcto
import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TextBase from 'amlibcomponents/src/Components/TextBase/TextBase';
import { useMyController } from './My.controller';
import { MyProps } from './My.model';
import { Container } from './My.styled';
```

### Naming

- Componentes: PascalCase (`FlightCard`, `SeatSelector`)
- Hooks: camelCase con prefijo `use` (`useFlightData`, `useBreakpoint`)
- Handlers: prefijo `handle` (`handlePress`, `handleSubmit`)
- Booleanos: prefijo `is`/`has`/`should` (`isActive`, `hasError`)
- Constantes: UPPER_SNAKE_CASE (`MAX_RETRIES`, `API_TIMEOUT`)
- Archivos: `ComponentName.{type}.{ext}`

### TypeScript

- Sin `any` — usar tipos específicos o `unknown`
- Sin `@ts-ignore` — resolver el error de tipos
- Interfaces para props, types para uniones
- Enums con valores string explícitos
- `as const` para objetos constantes

### Formato

- Sin `console.log` en código productivo (usar logger del proyecto)
- Sin `eslint-disable` sin justificación en comentario
- Sin código comentado (eliminarlo o crear ticket con referencia)
- Sin `var` — usar `const` o `let`
- Ternarios simples, no anidados
- Máx 3 parámetros por función — si más, usar objeto tipado
- Máx 7 ramas de complejidad ciclomática por función

> Ver reglas detalladas de Clean Code: `references/clean-code.md`

---

## Seguridad

### Datos Sensibles

- NUNCA loguear datos personales (PII): nombres, emails, teléfonos, documentos
- NUNCA loguear datos de pago (PCI): números de tarjeta, CVV, fechas de expiración
- NUNCA almacenar tokens o credenciales en código fuente
- Enmascarar datos sensibles en logs: `**** **** **** 1234`
- Usar `[PLACEHOLDER]` en datos de prueba, no datos que parezcan reales

### Inputs y Validación

- Sanitizar inputs del usuario antes de procesarlos
- Validar datos de APIs antes de renderizar
- No confiar en datos del cliente para decisiones de seguridad
- Escapar contenido dinámico para prevenir injection

### Almacenamiento

- Datos sensibles en secure storage (Keychain/Keystore), no AsyncStorage
- No persistir tokens en estado global sin cifrado
- Limpiar datos sensibles al cerrar sesión

### Comunicación

- Solo HTTPS para comunicación con APIs
- Validar certificados SSL
- No incluir API keys en código fuente (usar variables de entorno)

> Ver seguridad avanzada (deep links, WebView, tokens, permisos): `references/security-advanced.md`

---

## Violaciones Críticas

Estas violaciones BLOQUEAN el PR y deben corregirse antes de merge:

### 🔴 Arquitectura

| Violación | Descripción |
|-----------|-------------|
| Lógica de negocio en componente | Business logic debe ir en controller o service |
| Componente obtiene datos de otro componente | Coupling directo, usar controller como intermediario |
| Controller con JSX | Controllers no deben renderizar UI |
| Múltiples componentes en un archivo | Un componente por archivo |

### 🔴 Seguridad

| Violación | Descripción |
|-----------|-------------|
| Datos reales en código/tests | Usar datos ficticios claramente identificables |
| Credenciales en código fuente | Usar variables de entorno |
| Console.log con datos sensibles | Eliminar o enmascarar |
| API keys hardcodeadas | Mover a configuración segura |

### 🔴 Calidad

| Violación | Descripción |
|-----------|-------------|
| Tipo `any` sin justificación | Tipar correctamente |
| Función > 50 líneas | Extraer en funciones más pequeñas |
| Función con 5+ parámetros posicionales | Usar objeto tipado |
| Complejidad ciclomática > 10 | Extraer ramas a funciones o mapas de configuración |
| Componente > 160 líneas | Dividir en micro-componentes |
| Colores hex hardcodeados | Usar theme.colors |
| Textos hardcodeados | Usar copyID con sistema i18n |
| `useEffect` sin cleanup con subscripción/timer | Memory leak — agregar cleanup |
| Lógica duplicada en 3+ lugares | Extraer a hook o utilidad compartida |

> Ver criterios detallados: `references/clean-code.md`

### 🔴 Accesibilidad

| Violación | Descripción |
|-----------|-------------|
| Elemento interactivo sin `testID` | Agregar testID |
| Elemento interactivo sin `accessibilityLabel` | Agregar label descriptivo |
| Touch target < 44x44pt | Aumentar área de toque |

---

## Anti-patrones Conocidos

### Componente Monolítico

```typescript
// ❌ Componente que hace todo
const PaymentScreen = () => {
  const [data, setData] = useState(null);
  useEffect(() => { fetchData().then(setData); }, []);
  const handlePay = () => { /* lógica de pago */ };
  return (/* 300+ líneas de JSX */);
};

// ✅ Separado en MVVM
const PaymentScreen = (props: PaymentScreenProps) => {
  const { paymentData, handlePay, isLoading } = usePaymentScreenController(props);
  return (
    <Container>
      <PaymentSummary data={paymentData} />
      <PaymentButton onPress={handlePay} isLoading={isLoading} />
    </Container>
  );
};
```

### Controller Sobrecargado

```typescript
// ❌ Controller con 500+ líneas y múltiples responsabilidades
export const useScreenController = () => {
  // navegación + datos + validación + analytics + toast + perfil...
};

// ✅ Responsabilidades separadas en hooks
export const useScreenController = () => {
  const { data, isLoading } = useScreenData();
  const { navigate } = useScreenNavigation();
  const { validate } = useScreenValidation();
  const { trackEvent } = useScreenAnalytics();
  return { data, isLoading, navigate, validate, trackEvent };
};
```

### Condicionales Profundamente Anidados

```typescript
// ❌ Nesting profundo
if (user) {
  if (user.isActive) {
    if (user.hasPermission) {
      // lógica
    }
  }
}

// ✅ Early returns / guard clauses
if (!user) return null;
if (!user.isActive) return <InactiveMessage />;
if (!user.hasPermission) return <NoPermissionMessage />;
// lógica principal
```

### Nombres No Descriptivos

```typescript
// ❌ Genéricos
const data = getData();
const temp = process(data);
const val = temp.result;

// ✅ Descriptivos
const flightDetails = getFlightDetails();
const formattedItinerary = formatItinerary(flightDetails);
const departureTime = formattedItinerary.departure;
```

### Magic Strings

```typescript
// ❌ Strings hardcodeados
if (status === 'confirmed') { ... }
if (type === 'premium') { ... }

// ✅ Constantes tipadas
const BOOKING_STATUS = { CONFIRMED: 'confirmed', PENDING: 'pending' } as const;
const UPGRADE_TYPES = { PREMIUM: 'premium', BUSINESS: 'business' } as const;
if (status === BOOKING_STATUS.CONFIRMED) { ... }
```


---

## Performance (React Native)

Verificar cuando el PR toca listas, animaciones, o componentes de alta frecuencia de render.

| Violación | Severidad |
|-----------|-----------|
| `keyExtractor` usando índice en FlatList | 🔴 Crítico |
| `useEffect` sin cleanup con subscripción/timer | 🔴 Crítico (memory leak) |
| Objeto/array inline en prop de componente memoizado | 🔴 Crítico (anula memoización) |
| `renderItem` sin memoizar en lista larga | 🟡 Importante |
| Animación de `opacity`/`transform` sin `useNativeDriver: true` | 🟡 Importante |
| Import de librería completa (lodash, moment) | 🟡 Importante |
| `Image` nativo para imágenes remotas en lista | 🟡 Importante |

> Ver checklist completo: `references/performance.md`

---

## Configuración Nativa (Android/iOS)

### 🔴 Bloqueadores de Compilación

| Violación | Descripción |
|-----------|-------------|
| Package name incorrecto en `MainActivity.kt` | Debe coincidir con `applicationId` en `build.gradle` y estructura de carpetas |
| Bundle ID incorrecto en iOS | Debe coincidir con el configurado en Xcode y provisioning profiles |
| Archivo nativo migrado con funcionalidad faltante | Java→Kotlin o ObjC→Swift debe mantener la misma funcionalidad |
| Permisos faltantes en AndroidManifest | Permisos requeridos por nuevas dependencias deben estar declarados |

### Qué Buscar

```bash
# Package name en archivos Kotlin/Java
grep -r "^package " android/app/src/main/java/

# ApplicationId en build.gradle
grep "applicationId" android/app/build.gradle

# Bundle ID en iOS
grep "PRODUCT_BUNDLE_IDENTIFIER" ios/*.xcodeproj/project.pbxproj
```

---

## Consistencia de Dependencias (Monorepo)

### 🔴 Crítico

| Violación | Descripción |
|-----------|-------------|
| Versiones alpha/beta/dev en producción | No usar versiones inestables sin justificación documentada |
| `@types/*` desalineados | `@types/react` debe corresponder a la versión de `react` instalada |
| Dependencias duplicadas con versiones diferentes | Packages del monorepo deben usar las mismas versiones que el root |

### Qué Buscar

```bash
# Versiones alpha/beta/dev
grep -rE "(alpha|beta|dev|rc|canary)" package.json packages/*/package.json

# Comparar versiones entre root y packages
diff <(jq '.devDependencies' package.json) <(jq '.devDependencies' packages/*/package.json)
```

---

## Manejo de Errores

### 🟡 Importante

| Violación | Descripción |
|-----------|-------------|
| Re-throw genérico sin contexto | `catch (e) { throw e; }` pierde contexto de debugging |
| Catch vacío | `catch (e) {}` silencia errores |
| `error: any` sin tipado | Usar `unknown` y validar tipo antes de acceder a propiedades |

### Ejemplo

```typescript
// ❌ Re-throw genérico
catch (error: any) {
  throw error;
}

// ❌ Catch vacío
catch (error) {
  // silencio
}

// ✅ Con contexto
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('[moduleName] Operation failed:', message);
  throw new Error(`[moduleName] Operation failed: ${message}`);
}
```

---

## Criptografía y Generación de IDs

### 🔴 Crítico

| Violación | Descripción |
|-----------|-------------|
| `Math.random()` para UUIDs/tokens | No es criptográficamente seguro, riesgo de colisiones predecibles |
| Algoritmos débiles (MD5, SHA1) para hashing de contraseñas | Usar bcrypt, scrypt o Argon2 |
| Implementación custom de crypto sin justificación | Preferir librerías auditadas |

### Qué Buscar

```bash
# Math.random en contexto de IDs/tokens
grep -rn "Math.random" src/ --include="*.ts" --include="*.tsx"

# Algoritmos débiles
grep -rn "MD5\|SHA1\|sha1\|md5" src/ --include="*.ts"
```

---

## Archivos Eliminados y Lógica Migrada

### 🟡 Importante

Cuando se eliminan archivos que contenían lógica de negocio:

| Verificación | Descripción |
|-------------|-------------|
| Hooks eliminados | ¿La lógica fue movida a otro hook o absorbida por un controller? |
| Servicios eliminados | ¿El endpoint/flujo sigue disponible desde otro servicio? |
| ViewModels eliminados | ¿La pantalla/flujo que los usaba fue eliminada o refactorizada? |
| Utilidades eliminadas | ¿Las funciones fueron reemplazadas por una librería o reimplementadas? |

Reportar como 🟡 Importante si no es claro que la lógica fue migrada. Preguntar explícitamente al autor del PR.
