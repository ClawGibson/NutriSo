All React hooks must be called at the top level of components, never inside conditions or loops.

All useEffect hooks must include correct dependency arrays.

All useEffect hooks with subscriptions, timers, or event listeners must include cleanup functions.

All useEffect hooks with empty dependency arrays must have clear justification in comments.

All useMemo and useCallback usage must be justified by costly calculations or preventing unnecessary re-renders. 

All complex reusable logic must be extracted into custom hooks.

All custom hooks must start with the "use" prefix. 
