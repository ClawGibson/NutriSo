# Validación de Migraciones

Checklist condicional para PRs que involucran actualización de dependencias mayores o migración de framework.

## Table of Contents

- [Consistencia de Dependencias](#consistencia-de-dependencias)
- [Cambios de API](#cambios-de-api)
- [Configuración Nativa](#configuración-nativa)
- [Regresiones Visuales y Funcionales](#regresiones-visuales-y-funcionales)
- [Seguridad en Migraciones](#seguridad-en-migraciones)

---

## Consistencia de Dependencias

- [ ] Versiones consistentes entre packages del monorepo
- [ ] `@types/*` corresponden a las versiones de las librerías actualizadas
- [ ] No hay versiones alpha/beta/rc/dev sin justificación documentada
- [ ] `peerDependencies` satisfechas
- [ ] Lock file actualizado y consistente

```bash
# Detectar versiones inestables
grep -rE "(alpha|beta|dev|rc|canary)" package.json packages/*/package.json
```

---

## Cambios de API

- [ ] APIs deprecadas reemplazadas por equivalentes nuevas
- [ ] Cambios de comportamiento documentados o manejados (e.g., BottomSheet v4→v5)
- [ ] Refs manejados según nueva API (e.g., React 19 ref como prop regular)
- [ ] Hooks de React llamados incondicionalmente (React 19 es más estricto)
- [ ] Eliminación de `prevIsOpenRef` o patrones similares verificada contra idempotencia de nueva API

---

## Configuración Nativa

- [ ] Package name / Bundle ID correcto en archivos nativos migrados
- [ ] Archivos migrados Java→Kotlin o ObjC→Swift mantienen misma funcionalidad
- [ ] Permisos de AndroidManifest/Info.plist correctos
- [ ] Podfile y build.gradle compatibles con nueva versión
- [ ] Inicialización de módulos nativos actualizada en MainApplication

---

## Regresiones Visuales y Funcionales

- [ ] `box-shadow` CSS reemplazado por propiedades nativas de sombra en RN
- [ ] Componentes de terceros migrados mantienen mismo UX (carruseles, bottom sheets)
- [ ] Portal/overlay removals no causan problemas de z-index
- [ ] Márgenes negativos verificados con nuevo motor de layout (Yoga/Fabric)
- [ ] Lógica eliminada (hooks, servicios, viewModels) fue migrada, no perdida

---

## Seguridad en Migraciones

- [ ] Funciones de criptografía usan APIs criptográficamente seguras (NO `Math.random()`)
- [ ] Manejo de errores en módulos de seguridad incluye contexto para debugging
- [ ] Tokens y UUIDs generados con misma unicidad y formato que antes
- [ ] Reemplazos de librerías crypto mantienen mismo nivel de seguridad
