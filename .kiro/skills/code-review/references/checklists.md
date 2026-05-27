# Checklists por Tipo de Archivo

## Table of Contents

- [Component (.component.tsx / .view.tsx)](#component)
- [Controller (.controller.ts)](#controller)
- [Model (.model.ts)](#model)
- [Styled (.styled.ts)](#styled)
- [Transformer (.transformer.ts)](#transformer)
- [Service / Slice (.service.ts / .slice.ts)](#serviceslice)
- [Custom Hooks](#hooks)
- [Tests](#tests)
- [Navegación](#navegación)
- [Constantes y Enums](#constantes-y-enums)
- [Storybook](#storybook)
- [Configuración Nativa](#configuración-nativa)
- [Configuración de Proyecto](#configuración-de-proyecto)
- [Utilidades y Helpers](#utilidades-y-helpers)
- [CI/CD y Tooling](#cicd-y-tooling)
- [Archivos Eliminados](#archivos-eliminados)

> **Referencias extendidas:**
> - Reglas de Clean Code (SRP, DRY, complejidad): `references/clean-code.md`
> - Reglas de Maintainability (navegación, RTK, barrel exports): `references/maintainability.md`
> - Reglas avanzadas de MVVM (flujo de datos, transformers): `references/mvvm.md`
> - Reglas de Performance (FlatList, re-renders, animaciones): `references/performance.md`
> - Seguridad avanzada (deep links, WebView, tokens): `references/security-advanced.md`

---

## Component

Archivo `.component.tsx` o `.view.tsx` — Solo UI, sin lógica de negocio.

### Checklist

- [ ] Componente puramente presentacional (sin business logic)
- [ ] Datos recibidos vía props o desde controller, NO de otros componentes
- [ ] Usa `useComponentNameController` para lógica
- [ ] < 160 líneas (ideal < 120)
- [ ] Sin `useState`, `useEffect` directos (van en controller)
- [ ] Sin llamadas a APIs o servicios
- [ ] Sin cálculos o transformaciones de datos (van en transformer)
- [ ] Sin imports de `react-redux` (`useSelector`, `useDispatch`)
- [ ] Sin llamadas a hooks de RTK Query directamente
- [ ] Usa `copyID` para todos los textos visibles (no strings hardcodeados)
- [ ] Elementos interactivos tienen `testID` y `accessibilityLabel`
- [ ] Touch targets >= 44x44pt
- [ ] Usa componentes de la librería (`TextBase`, `AppButton`, etc.)
- [ ] Imports organizados: externos → internos → locales
- [ ] Sin `eslint-disable` injustificados
- [ ] Sin ternarios vacíos (`condition ? <X /> : null`), usar `{condition && <X />}`
- [ ] Un solo componente por archivo
- [ ] Composición con micro-componentes si es complejo
- [ ] Items de lista envueltos en `React.memo`
- [ ] Sin objetos/arrays inline en props (`style={{ margin: 10 }}` → extraer constante)

### Ejemplo correcto

```typescript
const MyComponent = ({ data, onPress }: MyComponentProps) => {
  const { isExpanded, handlePress } = useMyComponentController({ data, onPress });

  return (
    <Container>
      <TouchableOpacity onPress={handlePress} testID="my-button" accessibilityLabel="Action button">
        <TextBase copyID="my.copy.id" textType="body1" />
      </TouchableOpacity>
      {isExpanded && <DetailSection data={data} />}
    </Container>
  );
};
```

### Anti-patrones

- Lógica de negocio en el componente
- Obtener datos de otro componente (coupling)
- Componente monolítico > 300 líneas sin composición
- Múltiples componentes en un archivo
- Objetos/arrays inline en props de componentes memoizados

> Ver también: `references/performance.md` → Re-renders Innecesarios

---

## Controller

Archivo `.controller.ts` — Lógica de UI, hooks, event handlers.

### Checklist

- [ ] Exporta hook `use{ComponentName}Controller`
- [ ] < 160 líneas
- [ ] < 15 imports
- [ ] Recibe props tipadas del model
- [ ] Retorna objeto con estado y handlers
- [ ] Usa `useCallback` para funciones pasadas como props o usadas en `useEffect`
- [ ] Un `useEffect` por responsabilidad
- [ ] `useEffect` con cleanup cuando hay subscripciones o timers
- [ ] Dependencias de `useEffect` correctas — sin `eslint-disable` injustificado
- [ ] Sin JSX ni renderizado
- [ ] Sin estilos ni referencias a styled-components
- [ ] Sin imports de otros controllers del mismo nivel
- [ ] Nombres descriptivos para funciones (`handleSubmitPayment`, no `handle1`)
- [ ] Sin variables genéricas (`data`, `temp`, `val`)
- [ ] Sin magic strings (usar constantes)
- [ ] Lógica de negocio compleja delegada a servicios/hooks especializados
- [ ] Máx 3 parámetros por función (si más, usar objeto tipado)
- [ ] Sin funciones > 50 líneas

### Ejemplo correcto

```typescript
export const useMyComponentController = ({ data, onPress }: MyComponentProps) => {
  const navigation = useNavigation();
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePress = useCallback(() => {
    onPress();
    logAnalyticsEvent('component_pressed');
  }, [onPress]);

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return { isExpanded, handlePress, handleToggle };
};
```

### Anti-patrones

- Controller > 500 líneas con múltiples responsabilidades
- Más de 15 imports (señal de que necesita split)
- UI logic mezclada (animaciones, layout)
- Variables con lógica extensa sin fragmentar
- Múltiples useEffects complejos sin separar en hooks
- `useEffect` sin cleanup con subscripciones o timers (memory leak)

> Ver también: `references/clean-code.md` → SRP, Complejidad Ciclomática
> Ver también: `references/mvvm.md` → Flujo de Datos, Model vs Controller
> Ver también: `references/performance.md` → useMemo y useCallback, useEffect y Dependencias

---

## Model

Archivo `.model.ts` — Tipos, interfaces, enums, constantes.

### Checklist

- [ ] Interfaces con sufijo `Props` para props del componente
- [ ] Tipos exportados y reutilizables
- [ ] Enums con valores string explícitos
- [ ] Constantes con `as const`
- [ ] Sin lógica ejecutable (solo declaraciones de tipos)
- [ ] Sin funciones de transformación (van en `.transformer.ts`)
- [ ] Sin imports de React o componentes
- [ ] Nombres descriptivos en PascalCase para tipos/interfaces
- [ ] Props opcionales marcadas con `?`
- [ ] `CopyID` importado para props de texto
- [ ] Tipos de respuesta de API separados de tipos de display (UI)

### Ejemplo correcto

```typescript
import { CopyID } from 'amlibcomponents/src/translations/translations.types';

export interface PaymentCardProps {
  cardData: CardInfo;
  onSelect: (cardId: string) => void;
  title?: CopyID;
  isActive?: boolean;
}

export interface CardInfo {
  id: string;
  lastFourDigits: string;
  cardType: CardType;
}

export enum CardType {
  Visa = 'VISA',
  Mastercard = 'MASTERCARD',
  Amex = 'AMEX',
}

export const CARD_LIMITS = {
  MAX_CARDS: 5,
  MIN_AMOUNT: 100,
} as const;
```

---

## Styled

Archivo `.styled.ts` — Styled-components con theme.

### Checklist

- [ ] Usa `styled-components/native`
- [ ] Nombres descriptivos en PascalCase (propósito, no apariencia)
- [ ] Props tipadas con interfaces
- [ ] Colores desde `theme.colors`, NO hex hardcodeados
- [ ] Tipografía desde theme, NO valores directos
- [ ] Spacing consistente
- [ ] Touch targets >= 44x44pt para elementos interactivos
- [ ] Sin lógica de negocio
- [ ] Sin imports de React hooks
- [ ] Responsive considerado (useBreakpoint o Dimensions)

### Anti-patrones

```typescript
// ❌ Hex hardcodeado
background-color: #FF0000;

// ✅ Desde theme
background-color: ${({ theme }) => theme.colors.Background.Background1};

// ❌ Styled component creado dentro del render
const MyComponent = () => {
  const StyledView = styled.View`...`; // ❌ Se recrea en cada render
  return <StyledView />;
};
```

---

## Transformer

Archivo `.transformer.ts` — Transformaciones de datos API → modelo de UI.

### Checklist

- [ ] Funciones puras (mismo input → mismo output)
- [ ] Maneja campos opcionales/nulos de la API sin crashear
- [ ] Nombre descriptivo: `transformFlightResponse`, `mapPassengerToDisplay`
- [ ] Sin side effects (no llama a servicios, no modifica estado)
- [ ] Sin imports de React o componentes
- [ ] Testeable de forma aislada

> Ver también: `references/mvvm.md` → Capa de Transformación

---

## Service/Slice

Archivos `.service.ts` y `.slice.ts` — RTK Query y Redux slices.

### Checklist

- [ ] Service usa `createApi` de RTK Query
- [ ] Endpoints tipados con request/response
- [ ] Slice usa `createSlice` de Redux Toolkit
- [ ] Estado inicial tipado
- [ ] Reducers puros (sin side effects)
- [ ] Selectores exportados
- [ ] Selectores complejos usan `createSelector` (memoización)
- [ ] Selectores no retornan nuevos objetos/arrays sin `createSelector`
- [ ] Sin lógica de UI (colores, labels, strings de display)
- [ ] `extraReducers` maneja pending, fulfilled y rejected
- [ ] Transformaciones de datos en `transformResponse` o en transformer separado
- [ ] Error handling definido

> Ver también: `references/maintainability.md` → Redux / RTK Selectors

---

## Hooks

Custom hooks (`use*.ts`).

### Checklist

- [ ] Nombre empieza con `use`
- [ ] camelCase: `useFeatureName`
- [ ] Una sola responsabilidad
- [ ] Parámetros y retorno tipados
- [ ] `useCallback` y `useMemo` donde aplique (ver criterios en `references/performance.md`)
- [ ] Cleanup de subscripciones en return de useEffect
- [ ] Dependencias de useEffect correctas
- [ ] Retorna objeto estructurado: `{ state, computedValues, actions, utilities }`
- [ ] Testeable de forma aislada

---

## Tests

Archivos `*.test.ts` / `*.spec.ts`.

### Checklist

- [ ] Datos de prueba ficticios (NO datos reales de personas)
- [ ] Nombres descriptivos en `describe` e `it`
- [ ] Arrange-Act-Assert pattern
- [ ] Mocks limpios entre tests
- [ ] Sin `console.log` en tests
- [ ] Cobertura de happy path y edge cases
- [ ] Sin dependencia de orden de ejecución
- [ ] Usa `renderHook` para hooks, `render` para componentes


---

## Navegación

Archivos `*.navigator.tsx`, `*.routes.ts`, `*.navigation.ts`.

### Checklist

- [ ] Rutas definidas como constantes tipadas (no strings sueltos)
- [ ] Params de navegación tipados con `RootStackParamList` o equivalente
- [ ] Sin lógica de negocio en el navigator
- [ ] Deep link handlers sanitizan parámetros antes de usarlos
- [ ] Navegación condicional (auth guard) en un solo lugar

> Ver detalles y ejemplos: `references/maintainability.md` → Archivos de Navegación
> Ver seguridad de deep links: `references/security-advanced.md` → Deep Links

---

## Constantes y Enums

Archivos `*.constants.ts`, `*.enums.ts`.

### Checklist

- [ ] Constantes con `as const` y tipo inferido o explícito
- [ ] Enums con valores string explícitos (no numéricos implícitos)
- [ ] Sin lógica ejecutable — solo declaraciones
- [ ] Agrupadas por dominio, no un archivo global con todo

> Ver detalles y ejemplos: `references/maintainability.md` → Archivos de Constantes y Enums

---

## Storybook

Archivos `*.stories.tsx`.

### Checklist

- [ ] Story cubre el estado por defecto (happy path)
- [ ] Story cubre estado de error o vacío si el componente lo maneja
- [ ] Story cubre estado de loading si aplica
- [ ] Props del story usan datos ficticios (no datos reales)
- [ ] Story no importa lógica de negocio — solo props del componente

> Ver detalles: `references/maintainability.md` → Storybook

---

## Configuración Nativa

Archivos `android/**`, `ios/**`, `*.kt`, `*.java`, `*.swift`, `*.m`, `Podfile`, `build.gradle`.

### Checklist

- [ ] Package name / Bundle ID correcto y consistente
- [ ] `applicationId` en `build.gradle` coincide con package en `MainActivity.kt`
- [ ] Inicialización de módulos nativos correcta en `MainApplication`
- [ ] Permisos en `AndroidManifest.xml` completos para dependencias nuevas
- [ ] `Podfile` — deployment target compatible con dependencias
- [ ] `build.gradle` — `compileSdkVersion`, `targetSdkVersion`, `minSdkVersion` correctos
- [ ] No hay credenciales, signing keys o keystores en el diff
- [ ] Archivos migrados (Java→Kotlin, ObjC→Swift) mantienen funcionalidad completa

---

## Configuración de Proyecto

Archivos `package.json`, `tsconfig.json`, `metro.config.js`, `babel.config.js`, `.eslintrc.*`.

### Checklist

- [ ] Versiones de dependencias consistentes entre root y packages del monorepo
- [ ] No hay dependencias en versiones alpha/beta/dev sin justificación
- [ ] `@types/*` alineados con las versiones de las librerías correspondientes
- [ ] Scripts de package.json funcionales y actualizados
- [ ] `metro.config.js` — resolver y transformer compatibles con la versión de RN
- [ ] `babel.config.js` — presets y plugins compatibles
- [ ] `tsconfig.json` — paths y configuración de tipos correctos
- [ ] Lock file actualizado y consistente

---

## Utilidades y Helpers

Archivos en `utils/**`, `helpers/**`, funciones puras.

### Checklist

- [ ] Funciones de criptografía usan APIs seguras (NO `Math.random()` para tokens/UUIDs)
- [ ] Manejo de errores con contexto (no re-throw genérico)
- [ ] Funciones puras sin side effects inesperados
- [ ] Tipado correcto, sin `any`
- [ ] Si reemplazan una librería, mantienen el mismo contrato/formato de salida
- [ ] Documentación de funciones complejas o no obvias

---

## CI/CD y Tooling

Archivos `.husky/**`, `.github/**`, scripts de CI.

### Checklist

- [ ] Hooks de pre-commit activos (lint-staged, validaciones de testID)
- [ ] Si hay hooks comentados/deshabilitados → reportar como 🔴 CRÍTICO
- [ ] Scripts de CI/CD actualizados para nuevas versiones de dependencias
- [ ] Archivos de configuración de linters actualizados y funcionales

---

## Archivos Eliminados

Archivos con status `removed` en el diff.

### Checklist

- [ ] Lógica de negocio fue migrada a otro lugar (no se perdió funcionalidad)
- [ ] Imports que referenciaban el archivo eliminado fueron actualizados
- [ ] Si era hook/servicio/utilidad, confirmar que su funcionalidad sigue disponible
- [ ] Documentar en el reporte qué se eliminó y preguntar si fue intencional
