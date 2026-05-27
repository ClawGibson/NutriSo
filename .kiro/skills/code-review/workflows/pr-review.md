# Workflow: PR Review

Revisión formal de un Pull Request. Analiza el diff completo, clasifica hallazgos por severidad y genera reporte con veredicto.

> Activar con: "review este PR", "revisa el PR #N", "review pull request", "review commits", "revisar rama"

---

## Paso 1 — Obtener el diff

### Desde GitHub (PR con número)

```
MCP get_files → lista de archivos + patches individuales
MCP get_diff  → diff completo (puede fallar en PRs > 500 archivos, usar get_files en ese caso)
```

Paginar `get_files` si hay más de 100 archivos. Procesar en lotes.

### Desde rama local

```bash
# Archivos modificados vs rama base
git diff <rama-base>..HEAD --name-only

# Diff completo
git diff <rama-base>..HEAD

# Último commit
git show HEAD
```

### Desde cambios no commiteados

```bash
git diff
git diff --staged
```

---

## Paso 2 — Clasificar archivos del diff

Clasificar **todos** los archivos antes de analizar. No omitir categorías.

| Categoría | Patrón | Checklist |
|-----------|--------|-----------|
| Config nativa | `android/**`, `ios/**`, `*.kt`, `*.java`, `Podfile`, `build.gradle` | `references/checklists.md` → Config Nativa |
| Config proyecto | `package.json`, `tsconfig.json`, `metro.config.js`, `babel.config.js` | `references/checklists.md` → Config Proyecto |
| Componentes MVVM | `*.component.tsx`, `*.controller.ts`, `*.model.ts`, `*.styled.ts` | `references/checklists.md` → Component / Controller / Model / Styled |
| Transformers | `*.transformer.ts` | `references/checklists.md` → Transformer |
| Servicios / estado | `*.service.ts`, `*.slice.ts` | `references/checklists.md` → Service/Slice |
| Custom hooks | `use*.ts` | `references/checklists.md` → Hooks |
| Navegación | `*.navigator.tsx`, `*.routes.ts` | `references/checklists.md` → Navegación |
| Constantes / Enums | `*.constants.ts`, `*.enums.ts` | `references/checklists.md` → Constantes y Enums |
| Utilidades | `utils/**`, `helpers/**` | `references/checklists.md` → Utilidades |
| Tests / mocks | `*.test.ts`, `__mocks__/**` | `references/checklists.md` → Tests |
| Storybook | `*.stories.tsx` | `references/checklists.md` → Storybook |
| CI/CD / tooling | `.husky/**`, `.github/**`, scripts | `references/checklists.md` → CI/CD |
| Archivos eliminados | status `removed` | `references/checklists.md` → Eliminados |

**PRs grandes (>100 archivos):** priorizar en este orden:
config nativa → seguridad → archivos eliminados → lógica de negocio → estilos

---

## Paso 3 — Aplicar reglas transversales

Leer `references/rules.md` y verificar en todos los archivos:
- Estilo de código, naming, TypeScript
- Seguridad y datos sensibles
- Violaciones críticas bloqueantes
- Anti-patrones conocidos
- Manejo de errores, criptografía

Cargar referencias especializadas **solo si el diff las requiere**:

| Si el diff contiene... | Leer |
|------------------------|------|
| `FlatList`, `SectionList`, animaciones, imágenes | `references/performance.md` |
| Deep links, `WebView`, auth, tokens, permisos | `references/security-advanced.md` |
| Datos sensibles, PII, PCI, credenciales | `references/sensitive-data.md` |
| Funciones > 50 líneas, lógica duplicada, complejidad alta | `references/clean-code.md` |
| Navegación, RTK selectors, props drilling | `references/maintainability.md` |
| Flujo de datos entre capas, transformaciones de API | `references/mvvm.md` |
| `useQuery`, `useMutation`, `queryOptions`, `useSuspenseQuery` | `references/tanstack-query-v5.md` |
| `useTransition`, `useOptimistic`, `useActionState`, `use()` | `references/react19.md` |
| Actualización de deps mayores, migración de framework | `references/migrations.md` |

---

## Paso 4 — Generar reporte

### Modo completo (default)

Guardar en `.kiro/reviews/code-review-[YYYYMMDD-HHmmss].md`:

```markdown
# Code Review — [título del PR o rama]

**Rama:** [rama] → [base] | **Autor:** [autor] | **Fecha:** [fecha]
**Archivos:** N | **Líneas:** +X -Y

---

## Veredicto: APROBADO ✅ | APROBADO CON OBSERVACIONES ⚠️ | REQUIERE CAMBIOS ❌

---

## 🔴 Crítico (N)
<!-- Bugs, seguridad, violaciones MVVM, bloqueadores de compilación → bloquean merge -->

### [Archivo:Línea] — [Categoría]
**Problema:** descripción
**Código:**
```código relevante```
**Fix:**
```código corregido```

## 🟡 Importante (N)
<!-- Accesibilidad, mantenibilidad, SOLID, lógica eliminada sin migrar -->

## 🟢 Sugerencias (N)
<!-- Optimizaciones menores, mejoras de estilo opcionales -->

## ✅ Aspectos Positivos

## 📋 Recomendaciones
```

**Severidades:**
- 🔴 Crítico → bloquea merge
- 🟡 Importante → debe resolverse antes de merge o en ticket inmediato
- 🟢 Sugerencia → el autor decide
- ✅ Positivos → siempre incluir al menos uno si existe
- 📋 Recomendaciones → mejoras futuras, no bloquean

**Veredicto:**
- `APROBADO ✅` — sin críticos ni importantes
- `APROBADO CON OBSERVACIONES ⚠️` — solo sugerencias o importantes menores
- `REQUIERE CAMBIOS ❌` — hay al menos un crítico o importante bloqueante

### Reporte HTML (opcional)

**Preguntar antes de generar** — consume créditos adicionales.
Si el usuario confirma: guardar `.kiro/reviews/code-review-[YYYYMMDD-HHmmss].html` usando `references/html-template.md`.

---

### Modo conciso (Quick Review)

Activar cuando el usuario pida "review rápido", "quick review", "review conciso" o "review en una línea".

Omitir el reporte MD + HTML. Producir solo lista de hallazgos:

**Formato:** `<archivo>:L<línea>: <severidad> <problema>. <fix>.`

**Prefijos:**
- `🔴 bug:` — comportamiento roto, causará incidente
- `🟡 risk:` — funciona pero frágil
- `🔵 nit:` — estilo, naming, micro-optimización
- `❓ q:` — pregunta genuina, no sugerencia

**Reglas:**
- Sin introducción ni cierre
- Sin repetir lo que hace la línea
- Sin hedging — si no estás seguro, usar `❓ q:`
- El *por qué* solo si el fix no es obvio
- Última línea: veredicto → `✅ APROBADO` | `⚠️ APROBADO CON OBSERVACIONES` | `❌ REQUIERE CAMBIOS`

**Ejemplo:**
```
PaymentController.ts:L42: 🔴 bug: amount puede ser null tras .find(). Guard antes de operar.
BookingModel.ts:L88-140: 🔵 nit: fn de 52 líneas hace 4 cosas. Extraer validate/normalize/persist.
useAuth.ts:L23: 🟡 risk: sin retry en 429. Wrap en withBackoff(3).
SeatMap.component.tsx:L67: ❓ q: ¿por qué se omite accessibilityLabel aquí?

❌ REQUIERE CAMBIOS
```

**Auto-Clarity:** para hallazgos de seguridad críticos (PII, credenciales, CVE) escribir párrafo completo, luego reanudar formato conciso.

---

## Principios

- Comentar SOLO errores, violaciones o issues — no describir lo que hace el código
- Ser constructivo, explicar el razonamiento
- Balancear perfección con pragmatismo
- Para archivos eliminados: SIEMPRE verificar si la lógica fue migrada

## Límites de referencia

| Métrica | Límite |
|---------|--------|
| Componentes | < 160 líneas |
| Controllers | < 15 imports, < 160 líneas |
| Funciones | < 50 líneas |
| Touch targets | >= 44x44pt |
| Elementos interactivos | `testID` + `accessibilityLabel` obligatorios |
