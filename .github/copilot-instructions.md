# Pull Request Review Instructions

## Overview

This document provides guidelines for reviewing pull requests in the Colibrí Beta App 2.0 project. It includes code conventions, patterns to follow, anti-patterns to avoid, and a structured review checklist.

## Table of Contents

1. [General Principles](#general-principles)
2. [Issue Categories & Severity Levels](#issue-categories--severity-levels)
3. [Review Comment Format](#review-comment-format)
4. [Architecture Patterns](#architecture-patterns)
5. [Code Conventions](#code-conventions)
6. [Common Anti-Patterns](#common-anti-patterns)
7. [Specific Rules to Verify](#specific-rules-to-verify)
8. [Review Checklist](#review-checklist)
9. [Metrics & Reporting](#metrics--reporting)
10. [Examples](#examples)
11. [Summary Report Template](#summary-report-template)

---

## Issue Categories & Severity Levels

### Issue Categories

All issues found during review should be categorized into one of the following:

#### 🔒 Security
Issues that could lead to security vulnerabilities or data exposure.

**Examples**:
- Exposed API keys or secrets
- Insecure data storage
- Missing input validation
- XSS vulnerabilities
- Insecure authentication/authorization
- PII (Personally Identifiable Information) in logs or analytics

#### ⚡ Performance
Issues that could negatively impact app performance or user experience.

**Examples**:
- Unnecessary re-renders
- Missing memoization
- Inefficient algorithms
- Memory leaks
- Large bundle sizes
- Unoptimized images
- Blocking operations on main thread

#### 🏗️ Architecture
Issues related to code structure, patterns, and maintainability.

**Examples**:
- MVVM pattern violations
- Improper separation of concerns
- Tight coupling
- Missing abstractions
- Inconsistent patterns
- Poor file organization

#### 🐛 Bugs
Actual or potential bugs in the code.

**Examples**:
- Logic errors
- Edge cases not handled
- Race conditions
- Null/undefined handling
- Incorrect type usage
- Missing error handling

#### 🎨 Code Quality
Issues related to code readability, maintainability, and best practices.

**Examples**:
- Code duplication
- Complex/unreadable code
- Missing documentation
- Inconsistent naming
- Magic numbers
- Dead code

#### ♿ Accessibility
Issues that affect accessibility for users with disabilities.

**Examples**:
- Missing accessibility labels
- Insufficient touch target sizes
- Poor color contrast
- Missing keyboard navigation
- Screen reader incompatibility

#### 🌐 Internationalization
Issues related to localization and internationalization.

**Examples**:
- Hardcoded strings
- Missing copyID
- Date/time formatting issues
- Currency handling
- RTL support missing

#### 📊 Analytics
Issues related to tracking and analytics implementation.

**Examples**:
- Missing event tracking
- Incorrect funnel/screen context
- PII in analytics data
- Inconsistent event naming

### Severity Levels

Each issue should be assigned a severity level:

#### 🚫 BLOCKER
**Must be fixed before merge**. Critical issues that prevent the PR from being merged.

**Criteria**:
- Security vulnerabilities
- Data loss risks
- App crashes
- Breaking changes without migration
- Critical bugs affecting core functionality

**Example**:
```markdown
🚫 **BLOCKER - Security**: API key exposed in code

**Risk**: Production API key is hardcoded and will be exposed in the repository.

**Action Required**: Move to environment variables immediately.
```

#### 🔴 CRITICAL
**Should be fixed before merge**. Serious issues that significantly impact quality or functionality.

**Criteria**:
- Major bugs
- Performance issues affecting UX
- Architecture violations
- Missing error handling for critical paths
- Accessibility blockers

**Example**:
```markdown
🔴 **CRITICAL - Performance**: Unnecessary re-renders causing lag

**Impact**: Component re-renders on every parent update, causing noticeable lag.

**Suggestion**: Wrap with React.memo and use useCallback for handlers.
```

#### 🟡 MAJOR
**Should be addressed**. Important issues that should be fixed but don't block merge.

**Criteria**:
- Code quality issues
- Missing tests for important logic
- Incomplete error handling
- Minor performance issues
- Documentation gaps

**Example**:
```markdown
🟡 **MAJOR - Code Quality**: Complex logic needs refactoring

**Issue**: Function has 50+ lines with nested conditionals.

**Suggestion**: Extract helper functions for better readability.
```

#### 🟢 MINOR
**Nice to have**. Suggestions for improvement that can be addressed later.

**Criteria**:
- Code style inconsistencies
- Minor optimizations
- Documentation improvements
- Refactoring opportunities

**Example**:
```markdown
🟢 **MINOR - Code Style**: Consider using destructuring

**Suggestion**: `const { name, email } = user` is more concise.
```

#### 💡 SUGGESTION
**Optional improvement**. Ideas for enhancement without requiring changes.

**Criteria**:
- Alternative approaches
- Future improvements
- Learning opportunities
- Best practice recommendations

**Example**:
```markdown
💡 **SUGGESTION**: Consider using useMemo for this calculation

**Benefit**: Could improve performance if this component re-renders frequently.
```

---

## Review Comment Format

### Standard Comment Structure

All review comments should follow this structure:

```markdown
[SEVERITY] **[CATEGORY]**: [Brief description]

**[Context Section]**: [Detailed explanation]

**[Action Section]**: [What needs to be done]

**[Example Section]** (optional):
```[language]
// Current code
[problematic code]

// Suggested fix
[improved code]
```

**[Reference Section]** (optional): [Link to documentation or pattern guide]
```

### Comment Templates by Severity

#### Blocker Comment Template

```markdown
🚫 **BLOCKER - [Category]**: [Issue title]

**Risk**: [Explain the critical risk or impact]

**Action Required**: [Specific steps to fix]

**Example**:
```typescript
// ❌ Current (BLOCKING)
[problematic code]

// ✅ Required fix
[fixed code]
```

**Must be resolved before merge.**
```

#### Critical Comment Template

```markdown
🔴 **CRITICAL - [Category]**: [Issue title]

**Impact**: [Explain the serious impact]

**Suggestion**: [How to fix]

**Example**:
```typescript
// ❌ Current
[problematic code]

// ✅ Suggested fix
[improved code]
```

**Should be fixed before merge.**
```

#### Major Comment Template

```markdown
🟡 **MAJOR - [Category]**: [Issue title]

**Issue**: [Describe the problem]

**Suggestion**: [How to improve]

**Reference**: [Link to pattern guide if applicable]
```

#### Minor Comment Template

```markdown
🟢 **MINOR - [Category]**: [Issue title]

**Suggestion**: [Brief improvement suggestion]
```

#### Suggestion Comment Template

```markdown
💡 **SUGGESTION**: [Improvement idea]

**Benefit**: [Why this would be better]

**Example** (optional):
```typescript
[suggested approach]
```
```

### Praise Comment Template

```markdown
✅ **Well done**: [What was done well]

[Optional: Why this is good practice or what can be learned from it]
```

---

## General Principles

### Code Quality Standards

- **Readability First**: Code should be self-documenting with clear naming
- **Type Safety**: Leverage TypeScript's type system fully
- **Separation of Concerns**: Follow MVVM pattern strictly
- **DRY Principle**: Avoid code duplication through reusable components/hooks
- **Performance**: Consider React Native performance implications
- **Accessibility**: Ensure UI components are accessible
- **Internationalization**: Use `copyID` for all user-facing text

### Review Mindset

- Be constructive and respectful
- Focus on code, not the person
- Explain the "why" behind suggestions
- Distinguish between blocking issues and suggestions
- Acknowledge good practices

---

## Architecture Patterns

### ✅ MVVM Component Structure

**Required**: All components must follow the 4-file MVVM pattern:

```
ComponentName/
├── ComponentName.component.tsx    # UI only, no logic
├── ComponentName.controller.ts    # UI logic, events, hooks
├── ComponentName.model.ts         # Types, interfaces, enums
└── ComponentName.styled.ts        # Styled components
```

**Review Points**:
- [ ] Component file contains only JSX and structure
- [ ] Controller exports a `use{ComponentName}Controller` hook
- [ ] All types are defined in model file
- [ ] Styled components use theme values

### ✅ Redux State Management

**Pattern**: Use Redux Toolkit with RTK Query

```typescript
// ✅ GOOD: Proper slice structure
export const myFeatureSlice = createSlice({
  name: 'myFeature',
  initialState,
  reducers: {
    // Grouped logically
    setData: (state, action) => { },
    addItem: (state, action) => { },
    updateItem: (state, action) => { },
    removeItem: (state, action) => { },
    setLoading: (state, action) => { },
    setError: (state, action) => { },
    resetState: () => initialState,
  },
});
```

**Review Points**:
- [ ] Slice has clear, single responsibility
- [ ] Initial state is properly typed
- [ ] Includes reset action
- [ ] Uses Immer for immutable updates
- [ ] Selectors are exported

### ✅ API Services with RTK Query

```typescript
// ✅ GOOD: Proper API service
export const myApi = createApi({
  reducerPath: 'myApi',
  baseQuery: baseQuery,
  tagTypes: ['Items', 'ItemDetail'],
  endpoints: (builder) => ({
    getItems: builder.query<ItemsResponse, ItemsRequest>({
      query: (params) => ({ url: '/items', params }),
      providesTags: (result) => 
        result ? [...result.items.map(({ id }) => ({ type: 'Items', id })), 'Items'] : ['Items'],
      transformResponse: (response: ApiResponse) => transformApiToUI(response),
    }),
  }),
});
```

**Review Points**:
- [ ] Proper tag types for cache invalidation
- [ ] Response transformation in service
- [ ] Error handling implemented
- [ ] Optimistic updates where appropriate

---

## Code Conventions

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `TripDetail`, `FlightCard` |
| Files | `Name.type.ext` | `TripDetail.component.tsx` |
| Hooks | `use + Name` | `useMyTrips`, `useAuth` |
| Controllers | `use{Name}Controller` | `useTripDetailController` |
| Styled Components | PascalCase | `Container`, `TouchableOpacity` |
| Constants | UPPER_SNAKE_CASE | `MAX_PASSENGERS`, `API_TIMEOUT` |
| Enums | PascalCase | `TripStatus`, `PassengerType` |
| Interfaces | PascalCase + suffix | `TripDetailProps`, `ApiResponse` |
| Functions | camelCase | `handlePress`, `fetchData` |
| Variables | camelCase | `selectedTrip`, `isLoading` |

### TypeScript Usage

```typescript
// ✅ GOOD: Explicit types
interface TripDetailProps {
  tripId: string;
  onPress: () => void;
  title?: CopyID;
}

export const useTripDetailController = ({ 
  tripId, 
  onPress 
}: TripDetailProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // ...
};

// ❌ BAD: Implicit any, missing types
export const useTripDetailController = ({ tripId, onPress }) => {
  const [isLoading, setIsLoading] = useState(false);
  // ...
};
```

**Review Points**:
- [ ] No implicit `any` types
- [ ] Props interfaces are defined
- [ ] Return types specified for functions
- [ ] Enums used for fixed value sets
- [ ] Generic types used appropriately

### Styled Components

```typescript
// ✅ GOOD: Theme usage, typed props
interface ContainerProps {
  isActive?: boolean;
  spacing?: number;
}

export const Container = styled.View<ContainerProps>`
  padding: ${({ spacing }) => spacing || 16}px;
  background-color: ${({ theme, isActive }) => 
    isActive 
      ? theme.colors.Background.Active 
      : theme.colors.Background.Background1};
  border-radius: 8px;
`;

// ❌ BAD: Hardcoded values, no types
export const Container = styled.View`
  padding: 16px;
  background-color: #FFFFFF;
  border-radius: 8px;
`;
```

**Review Points**:
- [ ] Uses theme for colors and spacing
- [ ] Props are typed with interfaces
- [ ] No hardcoded color values
- [ ] Responsive considerations included
- [ ] Accessibility (min touch targets 44x44)

### Hooks and Effects

```typescript
// ✅ GOOD: Proper dependencies, cleanup
export const useMyFeature = (userId: string) => {
  const [data, setData] = useState<Data[]>([]);

  useEffect(() => {
    const subscription = subscribeToData(userId, setData);
    
    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const handleAction = useCallback((id: string) => {
    // Action logic
  }, []);

  return { data, handleAction };
};

// ❌ BAD: Missing dependencies, no cleanup
export const useMyFeature = (userId) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    subscribeToData(userId, setData);
  }, []); // Missing userId dependency

  const handleAction = (id) => {
    // Action logic
  };

  return { data, handleAction };
};
```

**Review Points**:
- [ ] Dependencies array is correct
- [ ] Cleanup functions for subscriptions
- [ ] `useCallback` for functions passed as props
- [ ] `useMemo` for expensive computations
- [ ] No unnecessary re-renders

### Analytics Implementation

```typescript
// ✅ GOOD: Structured analytics with context
export const useTripDetailController = ({ tripId }: Props) => {
  const analytics = useAnalytics({
    funnel: Funnels.MY_TRIPS,
    screen: 'TripDetail',
  });

  useEffect(() => {
    analytics.logScreenView();
  }, [analytics]);

  const handleCheckIn = useCallback(() => {
    analytics.logButtonPress('check_in_button', {
      trip_id: tripId,
    });
    // Action logic
  }, [analytics, tripId]);

  return { handleCheckIn };
};

// ❌ BAD: Direct Firebase calls, no context
export const useTripDetailController = ({ tripId }) => {
  useEffect(() => {
    logFirebaseEvent().logEvent('screen_view', 'MY_TRIPS', {});
  }, []);

  const handleCheckIn = () => {
    logFirebaseEvent().logEvent('button_press', 'MY_TRIPS', {});
    // Action logic
  };

  return { handleCheckIn };
};
```

**Review Points**:
- [ ] Uses `useAnalytics` hook with context
- [ ] Screen views logged on mount
- [ ] Button presses tracked
- [ ] Metadata includes relevant context
- [ ] No PII in analytics data

---

## Common Anti-Patterns

### ❌ Logic in Component Files

```typescript
// ❌ BAD: Logic in component
const TripDetail = ({ tripId }: Props) => {
  const [data, setData] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchTripData(tripId).then(setData);
  }, [tripId]);

  const handlePress = () => {
    navigation.navigate('CheckIn', { tripId });
  };

  return <Container>{/* JSX */}</Container>;
};

// ✅ GOOD: Logic in controller
const TripDetail = ({ tripId }: Props) => {
  const { data, handlePress } = useTripDetailController({ tripId });
  return <Container>{/* JSX */}</Container>;
};
```

### ❌ Hardcoded Values

```typescript
// ❌ BAD: Hardcoded colors and text
export const Button = styled.TouchableOpacity`
  background-color: #E30613;
  padding: 16px;
`;

const Component = () => (
  <Text>Click here</Text>
);

// ✅ GOOD: Theme and copyID
export const Button = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.Elements.Primary};
  padding: ${({ theme }) => theme.spacing.medium}px;
`;

const Component = () => (
  <TextBase copyID="BUTTON_CLICK_HERE" />
);
```

### ❌ Missing Error Handling

```typescript
// ❌ BAD: No error handling
const fetchData = async () => {
  const response = await api.getData();
  setData(response);
};

// ✅ GOOD: Proper error handling
const fetchData = async () => {
  try {
    setLoading(true);
    const response = await api.getData();
    setData(response);
    setError(null);
  } catch (err) {
    setError(err.message);
    analytics.logError('FETCH_DATA_ERROR', err.message);
  } finally {
    setLoading(false);
  }
};
```

### ❌ Prop Drilling

```typescript
// ❌ BAD: Prop drilling through multiple levels
<Parent userId={userId}>
  <Child userId={userId}>
    <GrandChild userId={userId} />
  </Child>
</Parent>

// ✅ GOOD: Use Redux or Context
const GrandChild = () => {
  const userId = useSelector(selectUserId);
  // Use userId
};
```

### ❌ Unnecessary Re-renders

```typescript
// ❌ BAD: Creates new function on every render
const Component = () => {
  const handlePress = () => {
    doSomething();
  };
  
  return <Button onPress={handlePress} />;
};

// ✅ GOOD: Memoized callback
const Component = () => {
  const handlePress = useCallback(() => {
    doSomething();
  }, []);
  
  return <Button onPress={handlePress} />;
};
```

### ❌ Complex Logic in Styled Components

```typescript
// ❌ BAD: Complex conditional logic in template literals
export const SafeAreaView = styled.View<SafeAreaViewProps>`
  background-color: ${{ setHeaderColorWithTheme, theme }} => setHeaderColorWithTheme ? theme.colors.Background.Background1 : theme.colors.Background.Background0};
  border-bottom-color: ${{ theme }} => theme.colors.Elements.DividerNavBar};
  border-bottom-width: ${{ showBorderBottom }} => showBorderBottom ? '1px' : '0px'};
  flex-direction: row;
  min-height: 52px;
  padding: 12px ${HORIZONTAL_PADDING}px;
  ${{ paddingTop }} => isIOS && paddingTop && `padding-top: ${paddingTop + 15}px;`};
  z-index: 9999;
`;
```

**Problems**:
1. Unreadable nested ternary operators
2. Complex conditional logic mixed with styles
3. Platform-specific logic in styled component
4. Magic numbers (15, 9999)
5. Inconsistent quote usage ('1px' vs "0px")
6. Hard to test and maintain

```typescript
// ✅ GOOD: Extract logic to helper functions
interface SafeAreaViewProps {
  setHeaderColorWithTheme?: boolean;
  showBorderBottom?: boolean;
  paddingTop?: number;
}

// Helper functions for complex logic
const getBackgroundColor = (theme: Theme, setHeaderColor?: boolean) => {
  return setHeaderColor 
    ? theme.colors.Background.Background1 
    : theme.colors.Background.Background0;
};

const getBorderWidth = (showBorder?: boolean) => {
  return showBorder ? 1 : 0;
};

const getTopPadding = (paddingTop?: number) => {
  if (!paddingTop) return 12;
  return Platform.OS === 'ios' ? paddingTop + 15 : paddingTop;
};

// Clean styled component
export const SafeAreaView = styled.View<SafeAreaViewProps>`
  /* Layout */
  flex-direction: row;
  min-height: 52px;
  
  /* Spacing */
  padding: ${({ paddingTop }) => getTopPadding(paddingTop)}px ${HORIZONTAL_PADDING}px 12px;
  
  /* Colors */
  background-color: ${({ theme, setHeaderColorWithTheme }) => 
    getBackgroundColor(theme, setHeaderColorWithTheme)};
  
  /* Border */
  border-bottom-width: ${({ showBorderBottom }) => getBorderWidth(showBorderBottom)}px;
  border-bottom-color: ${({ theme }) => theme.colors.Elements.DividerNavBar};
  
  /* Z-index */
  z-index: ${({ theme }) => theme.zIndex.header || 100};
`;
```

**Improvements**:
1. ✅ Logic extracted to testable helper functions
2. ✅ Readable and maintainable
3. ✅ Platform logic isolated
4. ✅ Uses theme for z-index
5. ✅ Consistent units (px)
6. ✅ Clear separation of concerns
7. ✅ Grouped by category (Layout, Spacing, Colors, etc.)

**Alternative: Use props for complex cases**

```typescript
// ✅ ALTERNATIVE: Compute styles in component
const SafeAreaContainer = ({ 
  setHeaderColorWithTheme, 
  showBorderBottom, 
  paddingTop,
  children 
}: SafeAreaViewProps & { children: React.ReactNode }) => {
  const theme = useTheme();
  
  const containerStyle = useMemo(() => ({
    backgroundColor: setHeaderColorWithTheme 
      ? theme.colors.Background.Background1 
      : theme.colors.Background.Background0,
    borderBottomWidth: showBorderBottom ? 1 : 0,
    paddingTop: Platform.OS === 'ios' && paddingTop ? paddingTop + 15 : paddingTop || 12,
  }), [setHeaderColorWithTheme, showBorderBottom, paddingTop, theme]);

  return (
    <BaseContainer style={containerStyle}>
      {children}
    </BaseContainer>
  );
};

// Simple base styled component
const BaseContainer = styled.View`
  flex-direction: row;
  min-height: 52px;
  padding-horizontal: ${HORIZONTAL_PADDING}px;
  padding-bottom: 12px;
  border-bottom-color: ${({ theme }) => theme.colors.Elements.DividerNavBar};
  z-index: ${({ theme }) => theme.zIndex.header || 100};
`;
```

---

## Specific Rules to Verify

### Critical Rules (BLOCKER if violated)

#### Security Rules
- [ ] **SEC-001**: No API keys, tokens, or secrets in code
- [ ] **SEC-002**: No PII (email, phone, address) in logs or analytics
- [ ] **SEC-003**: User input is validated and sanitized
- [ ] **SEC-004**: Sensitive data is encrypted in storage
- [ ] **SEC-005**: Authentication tokens are stored securely

#### Data Integrity Rules
- [ ] **DATA-001**: No direct state mutations in Redux
- [ ] **DATA-002**: All API responses are validated before use
- [ ] **DATA-003**: Error boundaries implemented for critical components
- [ ] **DATA-004**: Data transformers handle null/undefined safely

### High Priority Rules (CRITICAL if violated)

#### Architecture Rules
- [ ] **ARCH-001**: Components follow MVVM pattern (4 files)
- [ ] **ARCH-002**: No business logic in .component.tsx files
- [ ] **ARCH-003**: Controllers export use{Name}Controller hook
- [ ] **ARCH-004**: All types defined in .model.ts files
- [ ] **ARCH-005**: Styled components in separate .styled.ts file

#### Performance Rules
- [ ] **PERF-001**: useCallback for functions passed as props
- [ ] **PERF-002**: useMemo for expensive computations
- [ ] **PERF-003**: FlatList used for lists with >10 items
- [ ] **PERF-004**: Images are optimized and properly sized
- [ ] **PERF-005**: No blocking operations on main thread

#### Type Safety Rules
- [ ] **TYPE-001**: No implicit 'any' types
- [ ] **TYPE-002**: All function parameters are typed
- [ ] **TYPE-003**: All function return types are specified
- [ ] **TYPE-004**: Props interfaces are defined
- [ ] **TYPE-005**: Enums used for fixed value sets

### Medium Priority Rules (MAJOR if violated)

#### Code Quality Rules
- [ ] **QUAL-001**: No code duplication (DRY principle)
- [ ] **QUAL-002**: Functions are single-purpose and focused
- [ ] **QUAL-003**: No magic numbers (use named constants)
- [ ] **QUAL-004**: Complex logic is documented
- [ ] **QUAL-005**: No dead/commented code

#### Redux Rules
- [ ] **REDUX-001**: Slices have clear single responsibility
- [ ] **REDUX-002**: Initial state is properly typed
- [ ] **REDUX-003**: Includes resetState action
- [ ] **REDUX-004**: Selectors are exported
- [ ] **REDUX-005**: RTK Query used for API calls

#### Styling Rules
- [ ] **STYLE-001**: Theme used for all colors
- [ ] **STYLE-002**: Theme used for all spacing
- [ ] **STYLE-003**: No hardcoded color values
- [ ] **STYLE-004**: Props are typed with interfaces
- [ ] **STYLE-005**: Minimum touch targets are 44x44

#### Hook Rules
- [ ] **HOOK-001**: Dependencies array is correct
- [ ] **HOOK-002**: Cleanup functions for subscriptions
- [ ] **HOOK-003**: Custom hooks start with 'use'
- [ ] **HOOK-004**: Hooks return object with named properties
- [ ] **HOOK-005**: No hooks called conditionally

### Low Priority Rules (MINOR if violated)

#### Naming Rules
- [ ] **NAME-001**: Components use PascalCase
- [ ] **NAME-002**: Functions use camelCase
- [ ] **NAME-003**: Constants use UPPER_SNAKE_CASE
- [ ] **NAME-004**: Files follow Name.type.ext pattern
- [ ] **NAME-005**: Interfaces use PascalCase with suffix

#### Internationalization Rules
- [ ] **I18N-001**: All user-facing text uses copyID
- [ ] **I18N-002**: No hardcoded strings in UI
- [ ] **I18N-003**: Copy IDs follow naming convention
- [ ] **I18N-004**: Date/time formatting uses locale

#### Analytics Rules
- [ ] **ANALYTICS-001**: Screen views logged on mount
- [ ] **ANALYTICS-002**: Button presses tracked
- [ ] **ANALYTICS-003**: Proper funnel context provided
- [ ] **ANALYTICS-004**: No PII in analytics data
- [ ] **ANALYTICS-005**: Error events logged

#### Accessibility Rules
- [ ] **A11Y-001**: Accessibility labels provided
- [ ] **A11Y-002**: Touch targets meet minimum size
- [ ] **A11Y-003**: Color contrast is sufficient
- [ ] **A11Y-004**: Screen reader support considered
- [ ] **A11Y-005**: Keyboard navigation works

#### Documentation Rules
- [ ] **DOC-001**: Complex logic has comments
- [ ] **DOC-002**: Public APIs have JSDoc
- [ ] **DOC-003**: README updated if needed
- [ ] **DOC-004**: Breaking changes documented
- [ ] **DOC-005**: Component usage examples provided

---

## Review Checklist

### Architecture & Structure

- [ ] Follows MVVM pattern (4 files per component)
- [ ] Component file contains only JSX
- [ ] Controller handles all logic and events
- [ ] Types defined in model file
- [ ] Styled components in separate file
- [ ] Proper file naming conventions

### Code Quality

- [ ] No TypeScript errors or warnings
- [ ] No ESLint errors or warnings
- [ ] All functions and variables properly typed
- [ ] No `any` types (unless absolutely necessary)
- [ ] Proper error handling implemented
- [ ] Loading states handled
- [ ] Edge cases considered

### React/React Native Best Practices

- [ ] Proper hook dependencies
- [ ] Cleanup functions for effects
- [ ] Memoization where appropriate (`useCallback`, `useMemo`)
- [ ] No unnecessary re-renders
- [ ] Keys provided for list items
- [ ] Accessibility props included

### Redux & State Management

- [ ] Redux slice properly structured
- [ ] RTK Query used for API calls
- [ ] Proper cache invalidation tags
- [ ] Selectors exported and used
- [ ] No direct state mutations
- [ ] Initial state properly typed

### Styling

- [ ] Uses theme for colors and spacing
- [ ] No hardcoded color values
- [ ] Responsive design considered
- [ ] Minimum touch target sizes (44x44)
- [ ] Consistent spacing and layout
- [ ] Platform-specific styles when needed

### Internationalization

- [ ] All user-facing text uses `copyID`
- [ ] No hardcoded strings in UI
- [ ] Copy IDs follow naming convention
- [ ] Translations added to translation files

### Analytics

- [ ] Screen views logged
- [ ] Important user actions tracked
- [ ] Proper funnel and screen context
- [ ] No PII in analytics data
- [ ] Error events logged

### Performance

- [ ] No expensive operations in render
- [ ] Large lists use `FlatList` with optimization
- [ ] Images properly sized and optimized
- [ ] Unnecessary API calls avoided
- [ ] Proper caching strategy

### Testing

- [ ] Unit tests for complex logic
- [ ] Tests for edge cases
- [ ] Mocks properly configured
- [ ] Test coverage adequate
- [ ] Tests are maintainable

### Documentation

- [ ] Complex logic is commented
- [ ] JSDoc for public APIs
- [ ] README updated if needed
- [ ] Breaking changes documented

---

## Examples

### Example 1: Component Review

**Scenario**: Reviewing a new TripCard component

```typescript
// ❌ PROBLEMATIC CODE
const TripCard = ({ trip }) => {
  const navigation = useNavigation();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={{ padding: 16, backgroundColor: '#FFF' }}>
      <TouchableOpacity onPress={() => navigation.navigate('TripDetail', { id: trip.id })}>
        <Text>{trip.origin} - {trip.destination}</Text>
      </TouchableOpacity>
    </View>
  );
};
```

**Review Comments**:

1. ❌ **Architecture**: Missing MVVM structure. Should have 4 files.
2. ❌ **Types**: Props not typed, using implicit `any`.
3. ❌ **Styling**: Inline styles and hardcoded colors.
4. ❌ **Logic**: Navigation logic in component file.
5. ❌ **i18n**: Hardcoded text strings.

**Suggested Fix**:

```typescript
// TripCard.model.ts
export interface TripCardProps {
  trip: Trip;
  onPress?: () => void;
}

// TripCard.controller.ts
export const useTripCardController = ({ trip, onPress }: TripCardProps) => {
  const navigation = useNavigation<TripDetailNavigationProp>();
  const [expanded, setExpanded] = useState(false);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('TripDetail', { tripId: trip.id });
    }
  }, [navigation, trip.id, onPress]);

  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  return {
    expanded,
    handlePress,
    handleToggle,
  };
};

// TripCard.styled.ts
export const Container = styled.View`
  padding: ${({ theme }) => theme.spacing.medium}px;
  background-color: ${({ theme }) => theme.colors.Background.Background1};
  border-radius: 8px;
  margin: 8px 0;
`;

export const TouchableOpacity = styled.TouchableOpacity`
  padding: 12px;
`;

// TripCard.component.tsx
const TripCard = ({ trip, onPress }: TripCardProps) => {
  const { expanded, handlePress, handleToggle } = useTripCardController({ trip, onPress });

  return (
    <Container>
      <TouchableOpacity onPress={handlePress}>
        <TextBase 
          copyID="TRIP_ROUTE" 
          copyIDOptions={{ origin: trip.origin, destination: trip.destination }}
        />
      </TouchableOpacity>
    </Container>
  );
};

export default TripCard;
```

### Example 2: Redux Slice Review

**Scenario**: Reviewing a trips slice

```typescript
// ❌ PROBLEMATIC CODE
export const tripsSlice = createSlice({
  name: 'trips',
  initialState: { trips: [], loading: false },
  reducers: {
    setTrips: (state, action) => {
      state.trips = action.payload;
    },
  },
});
```

**Review Comments**:

1. ❌ **Types**: Initial state not typed.
2. ❌ **Completeness**: Missing error handling, selectors.
3. ❌ **Best Practice**: No reset action.

**Suggested Fix**:

```typescript
// ✅ GOOD CODE
interface TripsState {
  trips: Trip[];
  selectedTrip: Trip | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: TripsState = {
  trips: [],
  selectedTrip: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const tripsSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    setTrips: (state, action: PayloadAction<Trip[]>) => {
      state.trips = action.payload;
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    },
    selectTrip: (state, action: PayloadAction<Trip | null>) => {
      state.selectedTrip = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    resetState: () => initialState,
  },
});

// Selectors
export const selectAllTrips = (state: RootState) => state.trips.trips;
export const selectSelectedTrip = (state: RootState) => state.trips.selectedTrip;
export const selectIsLoading = (state: RootState) => state.trips.isLoading;
export const selectError = (state: RootState) => state.trips.error;
```

### Example 3: Hook Review

**Scenario**: Reviewing a custom hook

```typescript
// ❌ PROBLEMATIC CODE
export const useTrips = (userId) => {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    fetchTrips(userId).then(setTrips);
  }, []);

  return trips;
};
```

**Review Comments**:

1. ❌ **Types**: No TypeScript types.
2. ❌ **Dependencies**: Missing `userId` in dependency array.
3. ❌ **Error Handling**: No error handling.
4. ❌ **Loading State**: No loading indicator.

**Suggested Fix**:

```typescript
// ✅ GOOD CODE
interface UseTripsResult {
  trips: Trip[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTrips = (userId: string): UseTripsResult => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchTrips(userId);
      setTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    trips,
    isLoading,
    error,
    refetch: fetchData,
  };
};
```

---

## Review Response Templates

### Blocking Issue

```markdown
🚫 **Blocking**: [Issue description]

**Why**: [Explanation of why this is blocking]

**Suggestion**: [How to fix]

**Example**:
```typescript
// Current code
[problematic code]

// Suggested fix
[fixed code]
```
```

### Suggestion

```markdown
💡 **Suggestion**: [Improvement description]

**Benefit**: [Why this would be better]

**Example**:
```typescript
// Suggested approach
[improved code]
```
```

### Praise

```markdown
✅ **Nice work**: [What was done well]

[Optional: Why this is good practice]
```

### Question

```markdown
❓ **Question**: [Your question]

[Context or reason for asking]
```

---

## Metrics & Reporting

### Code Metrics to Track

#### Complexity Metrics
- **Lines of Code (LOC)**: Total lines added/removed
- **Files Changed**: Number of files modified
- **Cyclomatic Complexity**: Measure of code complexity
- **Function Length**: Average lines per function
- **File Length**: Lines per file

#### Quality Metrics
- **Type Coverage**: Percentage of code with explicit types
- **Test Coverage**: Percentage of code covered by tests
- **Code Duplication**: Percentage of duplicated code
- **ESLint Violations**: Number of linting errors/warnings
- **TypeScript Errors**: Number of type errors

#### Architecture Metrics
- **MVVM Compliance**: Percentage of components following pattern
- **Component Size**: Average lines per component
- **Hook Usage**: Number of custom hooks created
- **Redux Slices**: Number of slices added/modified
- **API Endpoints**: Number of new endpoints

#### Performance Metrics
- **Bundle Size Impact**: Change in bundle size
- **Render Count**: Components with potential re-render issues
- **Memory Usage**: Potential memory leaks identified
- **API Calls**: Number of new API integrations

### Review Metrics

Track these metrics for each PR review:

```markdown
## Review Metrics

**Review Time**: [Time spent reviewing]
**Files Reviewed**: [Number of files]
**Lines Reviewed**: [Lines of code]

**Issues Found**:
- 🚫 Blockers: [count]
- 🔴 Critical: [count]
- 🟡 Major: [count]
- 🟢 Minor: [count]
- 💡 Suggestions: [count]

**Issues by Category**:
- 🔒 Security: [count]
- ⚡ Performance: [count]
- 🏗️ Architecture: [count]
- 🐛 Bugs: [count]
- 🎨 Code Quality: [count]
- ♿ Accessibility: [count]
- 🌐 i18n: [count]
- 📊 Analytics: [count]

**Rules Violated**:
- Critical Rules: [list of rule IDs]
- High Priority Rules: [list of rule IDs]
- Medium Priority Rules: [list of rule IDs]
- Low Priority Rules: [list of rule IDs]

**Positive Highlights**: [count]
```

---

## Summary Report Template

### PR Review Summary

Use this template to provide a comprehensive summary at the end of each PR review:

```markdown
# 📋 PR Review Summary

## Overview
**PR Title**: [Title]
**Author**: @[username]
**Reviewed By**: @[reviewer]
**Review Date**: [Date]
**Status**: ✅ Approved | ⚠️ Approved with Comments | ❌ Changes Requested

---

## 📊 Metrics

| Metric | Value |
|--------|-------|
| Files Changed | [number] |
| Lines Added | +[number] |
| Lines Removed | -[number] |
| Components Added/Modified | [number] |
| Test Coverage | [percentage]% |
| Type Coverage | [percentage]% |

---

## 🎯 Issue Summary

### By Severity
| Severity | Count | Status |
|----------|-------|--------|
| 🚫 Blocker | [X] | [Resolved/Pending] |
| 🔴 Critical | [X] | [Resolved/Pending] |
| 🟡 Major | [X] | [Resolved/Pending] |
| 🟢 Minor | [X] | [Resolved/Pending] |
| 💡 Suggestion | [X] | [Optional] |

### By Category
| Category | Count | Top Issues |
|----------|-------|------------|
| 🔒 Security | [X] | [Brief description] |
| ⚡ Performance | [X] | [Brief description] |
| 🏗️ Architecture | [X] | [Brief description] |
| 🐛 Bugs | [X] | [Brief description] |
| 🎨 Code Quality | [X] | [Brief description] |
| ♿ Accessibility | [X] | [Brief description] |
| 🌐 i18n | [X] | [Brief description] |
| 📊 Analytics | [X] | [Brief description] |

---

## 🚫 Blocking Issues

[If none, write "None"]

1. **[Issue Title]** - [File:Line]
   - **Category**: [Category]
   - **Description**: [Brief description]
   - **Action Required**: [What needs to be done]

---

## 🔴 Critical Issues

[If none, write "None"]

1. **[Issue Title]** - [File:Line]
   - **Category**: [Category]
   - **Impact**: [Impact description]
   - **Recommendation**: [How to fix]

---

## 🟡 Major Issues

[If none, write "None - Great job!"]

1. **[Issue Title]** - [File:Line]
   - **Category**: [Category]
   - **Suggestion**: [Improvement suggestion]

---

## ✅ Highlights & Praise

[List positive aspects of the PR]

1. ✅ **[What was done well]**
   - [Why this is good/what can be learned]

2. ✅ **[Another positive aspect]**
   - [Explanation]

---

## 📋 Compliance Checklist

### Critical Rules
- [x] SEC-001: No secrets in code
- [x] SEC-002: No PII in logs
- [x] DATA-001: No direct mutations
- [ ] [Any failed rules]

### Architecture Rules
- [x] ARCH-001: MVVM pattern followed
- [x] ARCH-002: No logic in components
- [ ] [Any failed rules]

### Performance Rules
- [x] PERF-001: useCallback used
- [x] PERF-002: useMemo used
- [ ] [Any failed rules]

[Include only relevant sections with failed rules]

---

## 🎓 Learning Opportunities

[Optional: Highlight patterns or techniques that could benefit the team]

1. **[Topic]**: [Brief explanation or link to documentation]
2. **[Topic]**: [Brief explanation or link to documentation]

---

## 📝 Action Items

### Must Fix (Before Merge)
- [ ] [Action item 1] - @[assignee]
- [ ] [Action item 2] - @[assignee]

### Should Fix (Before Merge)
- [ ] [Action item 1] - @[assignee]
- [ ] [Action item 2] - @[assignee]

### Future Improvements (Can be separate PR)
- [ ] [Action item 1]
- [ ] [Action item 2]

---

## 💬 Additional Comments

[Any additional context, concerns, or recommendations]

---

## ✅ Approval Status

**Decision**: [Approved ✅ | Approved with Comments ⚠️ | Changes Requested ❌]

**Reasoning**: [Brief explanation of decision]

**Next Steps**: [What should happen next]

---

**Review completed on**: [Date and Time]
**Estimated time to address issues**: [Time estimate]
```

### Quick Summary Template (For Simple PRs)

For smaller PRs, use this condensed version:

```markdown
# 📋 Quick Review Summary

**Status**: ✅ Approved | ⚠️ Approved with Comments | ❌ Changes Requested

## Issues Found
- 🚫 Blockers: [X]
- 🔴 Critical: [X]
- 🟡 Major: [X]
- 🟢 Minor: [X]

## Top Issues
1. [Most important issue]
2. [Second most important]
3. [Third most important]

## Highlights
- ✅ [Something done well]
- ✅ [Another positive aspect]

## Action Required
[Brief list of what needs to be done before merge]

**Decision**: [Approved/Changes Requested]
```

---

## Final Notes

- **Be thorough but efficient**: Focus on important issues
- **Provide context**: Explain why something matters
- **Offer solutions**: Don't just point out problems
- **Be consistent**: Apply standards uniformly
- **Stay updated**: These guidelines evolve with the project
- **Use metrics**: Track and report on code quality trends
- **Provide summaries**: Always include a summary for PRs with multiple issues
- **Categorize properly**: Use the severity and category system consistently
- **Be constructive**: Balance criticism with praise

Remember: The goal is to maintain code quality while helping the team grow and learn.
