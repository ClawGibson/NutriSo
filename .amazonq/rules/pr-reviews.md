# Guía de Revisión React para Amazon Q Developer

## Prioridad 1: Crítico ⛔
- **Seguridad**: Sin API keys hardcoded, validar inputs, no usar `dangerouslySetInnerHTML` sin sanitización
- **Bugs evidentes**: Lógica incorrecta, estados inconsistentes, memory leaks
- **Hooks**:  Cumplir reglas de hooks, dependencias correctas en `useEffect`, cleanup cuando sea necesario

## Prioridad 2: Importante ⚠️
- **Componentes**: Props tipadas (TypeScript/PropTypes), nombres en PascalCase, máximo 200 líneas
- **Estado**: Actualizaciones inmutables, evitar prop drilling >3 niveles
- **Rendimiento**: Lazy loading para rutas, no importaciones innecesarias grandes
- **Accesibilidad**:  Atributos ARIA, semántica HTML correcta

## Prioridad 3: Sugerencias 💡
- **Código limpio**: DRY, funciones <30 líneas, nombres descriptivos (camelCase)
- **Optimizaciones**: `React.memo`/`useMemo`/`useCallback` solo si hay re-renders evidentes
- **Custom hooks**: Extraer lógica compleja reutilizable

## Qué NO revisar
- Preferencias de estilo personal si el código funciona
- Código legacy si el cambio es menor
- Tests para cambios triviales (typos, CSS)

## Notas
- Destructuring de props preferido
- CSS Modules/styled-components sobre inline styles
- Estado derivado:  calcular en render, no duplicar en state
