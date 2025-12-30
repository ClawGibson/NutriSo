All React components must use PascalCase naming convention. 

All component props must have TypeScript types or PropTypes defined.

All React components must be under 200 lines of code.

All props must be destructured in component function signature.

All React hooks must be called at the top level of components, never inside conditions or loops.

All useEffect hooks must include correct dependency arrays.

All useEffect hooks with subscriptions or timers must include cleanup functions.

All state updates must be immutable and not mutate existing state directly.

All API keys and secrets must use environment variables, never hardcoded strings.

All user inputs must be validated and sanitized before use.

All dangerouslySetInnerHTML usage must sanitize HTML content first.

All components exceeding 3 levels of prop drilling must use Context API or state management.

All images must implement lazy loading when appropriate.

All route components must use React. lazy() for code splitting.

All event handler functions must use descriptive names starting with "handle" (handleClick, handleSubmit).

All boolean check functions must use descriptive names starting with "is" or "has" (isValid, hasPermission).

All custom hooks must start with "use" prefix. 

All interactive elements must have proper ARIA attributes for accessibility.

All form inputs must have associated labels for accessibility.

All repeated code blocks must be extracted into reusable functions or components.

All functions must be under 30 lines when possible.

All CSS styling must use CSS Modules or styled-components, not inline styles except for dynamic values.

All global immutable constants must use UPPER_SNAKE_CASE naming. 
