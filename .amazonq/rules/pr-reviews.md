Todas las revisiones, comentarios y sugerencias deben redactarse en **español**.

# Instrucciones de Revisión para Amazon Q

## Proyecto React Web - Guía de Revisión

### Enfoque General

Este es un proyecto React web. Al revisar Pull Requests, enfócate en:

- Código limpio y mantenible
- Mejores prácticas de React
- Rendimiento y optimización
- Accesibilidad web

---

## Buenas Prácticas React

### Componentes

- **Nombres descriptivos**: Verifica que los componentes usen PascalCase y nombres claros
- **Componentes pequeños**: Sugiere dividir componentes grandes (>200 líneas)
- **Props tipadas**: Asegúrate que las props tengan tipos definidos (TypeScript o PropTypes)
- **Destructuring**: Prefiere destructuring de props en la firma del componente

### Hooks

- **Reglas de Hooks**: Verifica que los hooks se usen solo en el nivel superior
- **useEffect limpio**:
  - Revisa que useEffect tenga dependencias correctas
  - Verifica cleanup functions cuando sea necesario
  - Alerta si el array de dependencias está vacío sin justificación
- **useMemo/useCallback**: Sugiere solo cuando hay cálculos costosos o prevención de re-renders innecesarios
- **Custom Hooks**: Recomienda extraer lógica compleja a hooks personalizados

### Estado

- **useState**: Verifica inicialización correcta y actualizaciones inmutables
- **Evitar prop drilling**: Sugiere Context API o state management si hay más de 3 niveles
- **Estado derivado**: Recomienda calcular en render en lugar de duplicar en estado

---

## Estilos y UI

- **CSS Modules o styled-components**: Verifica uso consistente
- **Nombres de clases**: Deben ser descriptivos y seguir BEM si se usa CSS tradicional
- **Responsive**: Revisa que se consideren diferentes tamaños de pantalla
- **No inline styles**: Desaconsejar estilos inline excepto para valores dinámicos

---

## Rendimiento

- **Lazy loading**: Sugiere React.lazy() para rutas o componentes pesados
- **Memoización**: Solo recomendar React.memo cuando hay re-renders evidentes
- **Imágenes**: Verifica optimización (lazy loading, formatos modernos)
- **Bundle size**: Alerta sobre importaciones grandes innecesarias

---

## ♿ Accesibilidad

- **Atributos ARIA**: Verifica labels, roles y descripciones
- **Contraste**: Menciona si hay problemas evidentes de contraste
- **Navegación por teclado**: Revisa que elementos interactivos sean accesibles
- **Alt text**: Todas las imágenes deben tener texto alternativo descriptivo

---

## Testing

- **Tests incluidos**: Sugiere agregar tests para lógica nueva compleja
- **Nombres descriptivos**: Los tests deben explicar qué verifican
- **Testing Library**: Preferir queries por rol/label sobre testId

---

## Código Limpio

### Nombrado

- **Variables**: camelCase, nombres descriptivos
- **Constantes**: UPPER_SNAKE_CASE para valores inmutables globales
- **Funciones**: Verbos que describan la acción (handleClick, fetchData, isValid)

### Estructura

- **DRY**: Señala código duplicado
- **Funciones pequeñas**: Máximo 20-30 líneas idealmente
- **Comentarios**: Solo cuando el "por qué" no es obvio del código

### Imports

- **Orden**: React primero, luego librerías externas, luego archivos locales
- **Imports no usados**: Señala y sugiere eliminar
- **Barrel exports**: Recomienda index.js para exportaciones limpias

---

## Seguridad

- **Sanitización**: Verifica inputs del usuario
- **dangerouslySetInnerHTML**: Alerta sobre su uso sin sanitización
- **API keys**: No deben estar en el código (usar variables de entorno)
- **Dependencias**: Menciona si hay actualizaciones de seguridad pendientes

---

## Gestión de Dependencias

- **package.json**: Verifica que nuevas dependencias estén justificadas
- **Versiones**: Prefiere versiones específicas sobre rangos amplios
- **Tree shaking**: Usa imports nombrados cuando sea posible

---

## Git y PRs

- **Commits atómicos**: Cada commit debe tener un propósito claro
- **Mensajes**: Deben ser descriptivos y en presente ("Add feature" no "Added feature")
- **Archivos grandes**: Alerta sobre commits de archivos binarios o muy grandes

---

## Qué NO hacer

- No sugerir cambios de estilo personal si el código es funcional
- No pedir refactors masivos sin justificación clara de mejora
- No exigir tests para cambios triviales (typos, estilos menores)
- No ser demasiado estricto con código legacy si el cambio es pequeño

---

## Tono de Revisión

- **Constructivo**: Explica el "por qué" detrás de cada sugerencia
- **Positivo**: Reconoce código bien escrito
- **Educativo**: Incluye enlaces a documentación cuando sea relevante
- **Pragmático**: Balancea perfección con velocidad de desarrollo

---

## Prioridades

### Crítico (debe cambiarse)

- Bugs evidentes
- Problemas de seguridad
- Violaciones graves de rendimiento

### Importante (debería cambiarse)

- Violaciones de accesibilidad
- Código difícil de mantener
- Falta de manejo de errores

### Nice to have (sugerencias)

- Optimizaciones menores
- Mejoras de estilo
- Refactors opcionales
