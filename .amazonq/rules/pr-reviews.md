Todas las revisiones, comentarios y sugerencias deben redactarse en **español**. 

All React components must use PascalCase naming convention.
All React components must have descriptive and clear names.
All React components must be under 200 lines of code.
All component props must have TypeScript types or PropTypes defined.
All props must be destructured in the component function signature.

All React hooks must be called at the top level of components, never inside conditions or loops.
All useEffect hooks must include correct dependency arrays.
All useEffect hooks with subscriptions, timers, or event listeners must include cleanup functions.
All useEffect hooks with empty dependency arrays must have clear justification in comments.
All useMemo and useCallback usage must be justified by costly calculations or preventing unnecessary re-renders.
All complex reusable logic must be extracted into custom hooks.
All custom hooks must start with the "use" prefix.

All useState initializations must be correct and state updates must be immutable.
All prop drilling beyond 3 levels must use Context API or state management library.
All derived state must be calculated during render instead of duplicated in state.

All styling must use CSS Modules or styled-components consistently across the project.
All CSS class names must be descriptive and follow BEM convention if using traditional CSS.
All UI components must be responsive and consider different screen sizes.
All inline styles must be avoided except for dynamic values.

All route components and heavy components must use React.lazy() for code splitting.
All React. memo usage must be justified by evident re-render issues.
All images must implement lazy loading when appropriate.
All images must use modern optimized formats (WebP, AVIF) when possible.
All images must have descriptive alt text for accessibility.
All large unnecessary imports must be avoided to reduce bundle size.

All interactive elements must have proper ARIA attributes (labels, roles, descriptions).
All text-background combinations must have sufficient color contrast for accessibility.
All interactive elements must be accessible via keyboard navigation.

All new complex logic must include appropriate tests.
All test names must be descriptive and explain what they verify.
All tests must prefer Testing Library queries by role or label over testId.

All variables must use camelCase naming convention and be descriptive.
All global immutable constants must use UPPER_SNAKE_CASE naming convention.
All function names must be verbs describing the action (handleClick, fetchData, isValid).
All event handler functions must start with "handle" prefix.
All boolean check functions must start with "is" or "has" prefix.
All repeated code blocks must be extracted into reusable functions or components.
All functions must be under 30 lines when possible.
All comments must explain "why" rather than "what" when the code intent is not obvious.

All imports must follow order: React first, external libraries second, local files third.
All unused imports must be removed. 
All barrel exports should use index.js files for clean module exports.

All user inputs must be validated and sanitized.
All dangerouslySetInnerHTML usage must sanitize HTML content before rendering.
All API keys and secrets must use environment variables, never hardcoded in source code.
All new dependencies in package.json must be justified and necessary.
All dependency versions should use specific versions rather than broad ranges when possible.
All imports from libraries must use named imports for better tree shaking when available.

All Git commits must be atomic with a single clear purpose.
All commit messages must be descriptive and use present tense (e.g., "Add feature" not "Added feature").
All binary files or very large files in commits must be justified.

All code reviews must be constructive and explain the reasoning behind suggestions.
All code reviews must recognize well-written code with positive feedback.
All code reviews should include links to relevant documentation when appropriate.
All code reviews must balance code perfection with development velocity pragmatically.

All bugs, security issues, and severe performance violations are critical and must be fixed.
All accessibility violations, hard-to-maintain code, and missing error handling are important and should be fixed.
All minor optimizations, style improvements, and optional refactors are nice-to-have suggestions.
All review suggestions must avoid personal style preferences if the code is functional.
All review suggestions must avoid requesting massive refactors without clear justification. 
All review suggestions must not require tests for trivial changes like typos or minor styling.
All review suggestions must not be overly strict with legacy code if the change is small. 
