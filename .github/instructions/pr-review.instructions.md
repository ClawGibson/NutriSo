# Pull Request Review Instructions

## Overview

This document provides guidelines for reviewing pull requests in the Colibrí Beta App 2.0 project. It includes code conventions, patterns to follow, anti-patterns to avoid, and a structured review checklist.

## Table of Contents

1. [General Principles](#general-principles)
2. [Architecture Patterns](#architecture-patterns)
3. [Code Conventions](#code-conventions)
4. [Common Anti-Patterns](#common-anti-patterns)
5. [Review Checklist](#review-checklist)
6. [Examples](#examples)

---

## General Principles

### Code Quality Standards

- _Readability First_: Code should be self-documenting with clear naming
- _Type Safety_: Leverage TypeScript's type system fully
- _Separation of Concerns_: Follow MVVM pattern strictly
- _DRY Principle_: Avoid code duplication through reusable components/hooks
- _Performance_: Consider React Native performance implications
- _Accessibility_: Ensure UI components are accessible
- _Internationalization_: Use copyID for all user-facing text

### Review Mindset

- Be constructive and respectful
- Focus on code, not the person
- Explain the "why" behind suggestions
- Distinguish between blocking issues and suggestions
- Acknowledge good practices

---

## Architecture Patterns

### ✅ MVVM Component Structure

_Required_: All components must follow the 4-file MVVM pattern:

ComponentName/
├── ComponentName.component.tsx # UI only, no logic
├── ComponentName.controller.ts # UI logic, events, hooks
├── ComponentName.model.ts # Types, interfaces, enums
└── ComponentName.styled.ts # Styled components

_Review Points_:

- [ ] Component file contains only JSX and structure
- [ ] Controller exports a use{ComponentName}Controller hook
- [ ] All types are defined in model file
- [ ] Styled components use theme values

### ✅ Redux State Management

_Pattern_: Use Redux Toolkit with RTK Query

typescript
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

_Review Points_:

- [ ] Slice has clear, single responsibility
- [ ] Initial state is properly typed
- [ ] Includes reset action
- [ ] Uses Immer for immutable updates
- [ ] Selectors are exported

### ✅ API Services with RTK Query

typescript
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

_Review Points_:

- [ ] Proper tag types for cache invalidation
- [ ] Response transformation in service
- [ ] Error handling implemented
- [ ] Optimistic updates where appropriate

---

## Code Conventions

### Naming Conventions

| Type              | Convention          | Example                      |
| ----------------- | ------------------- | ---------------------------- |
| Components        | PascalCase          | TripDetail, FlightCard       |
| Files             | Name.type.ext       | TripDetail.component.tsx     |
| Hooks             | use + Name          | useMyTrips, useAuth          |
| Controllers       | use{Name}Controller | useTripDetailController      |
| Styled Components | PascalCase          | Container, TouchableOpacity  |
| Constants         | UPPER_SNAKE_CASE    | MAX_PASSENGERS, API_TIMEOUT  |
| Enums             | PascalCase          | TripStatus, PassengerType    |
| Interfaces        | PascalCase + suffix | TripDetailProps, ApiResponse |
| Functions         | camelCase           | handlePress, fetchData       |
| Variables         | camelCase           | selectedTrip, isLoading      |

### TypeScript Usage

typescript
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

_Review Points_:

- [ ] No implicit any types
- [ ] Props interfaces are defined
- [ ] Return types specified for functions
- [ ] Enums used for fixed value sets
- [ ] Generic types used appropriately

### Styled Components

typescript
// ✅ GOOD: Theme usage, typed props
interface ContainerProps {
isActive?: boolean;
spacing?: number;
}

export const Container = styled.View<ContainerProps>`  padding: ${({ spacing }) => spacing || 16}px;
  background-color: ${({ theme, isActive }) => 
    isActive 
      ? theme.colors.Background.Active 
      : theme.colors.Background.Background1};
  border-radius: 8px;`;

// ❌ BAD: Hardcoded values, no types
export const Container = styled.View`  padding: 16px;
  background-color: #FFFFFF;
  border-radius: 8px;`;

_Review Points_:

- [ ] Uses theme for colors and spacing
- [ ] Props are typed with interfaces
- [ ] No hardcoded color values
- [ ] Responsive considerations included
- [ ] Accessibility (min touch targets 44x44)

### Hooks and Effects

typescript
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

_Review Points_:

- [ ] Dependencies array is correct
- [ ] Cleanup functions for subscriptions
- [ ] useCallback for functions passed as props
- [ ] useMemo for expensive computations
- [ ] No unnecessary re-renders

### Analytics Implementation

typescript
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

_Review Points_:

- [ ] Uses useAnalytics hook with context
- [ ] Screen views logged on mount
- [ ] Button presses tracked
- [ ] Metadata includes relevant context
- [ ] No PII in analytics data

---

## Common Anti-Patterns

### ❌ Logic in Component Files

typescript
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

return <Container>{/_ JSX _/}</Container>;
};

// ✅ GOOD: Logic in controller
const TripDetail = ({ tripId }: Props) => {
const { data, handlePress } = useTripDetailController({ tripId });
return <Container>{/_ JSX _/}</Container>;
};

### ❌ Hardcoded Values

typescript
// ❌ BAD: Hardcoded colors and text
export const Button = styled.TouchableOpacity`  background-color: #E30613;
  padding: 16px;`;

const Component = () => (
<Text>Click here</Text>
);

// ✅ GOOD: Theme and copyID
export const Button = styled.TouchableOpacity`  background-color: ${({ theme }) => theme.colors.Elements.Primary};
  padding: ${({ theme }) => theme.spacing.medium}px;`;

const Component = () => (
<TextBase copyID="BUTTON_CLICK_HERE" />
);

### ❌ Missing Error Handling

typescript
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

### ❌ Prop Drilling

typescript
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

### ❌ Unnecessary Re-renders

typescript
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

### ❌ Complex Logic in Styled Components

typescript
// ❌ BAD: Complex conditional logic in template literals
export const SafeAreaView = styled.View<SafeAreaViewProps>`  background-color: ${{ setHeaderColorWithTheme, theme }} => setHeaderColorWithTheme ? theme.colors.Background.Background1 : theme.colors.Background.Background0};
  border-bottom-color: ${{ theme }} => theme.colors.Elements.DividerNavBar};
  border-bottom-width: ${{ showBorderBottom }} => showBorderBottom ? '1px' : '0px'};
  flex-direction: row;
  min-height: 52px;
  padding: 12px ${HORIZONTAL_PADDING}px;
  ${{ paddingTop }} => isIOS && paddingTop &&`padding-top: ${paddingTop + 15}px;`};
  z-index: 9999;
`;

_Problems_:

1. Unreadable nested ternary operators
2. Complex conditional logic mixed with styles
3. Platform-specific logic in styled component
4. Magic numbers (15, 9999)
5. Inconsistent quote usage ('1px' vs "0px")
6. Hard to test and maintain

typescript
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
/_ Layout _/
flex-direction: row;
min-height: 52px;

/_ Spacing _/
padding: ${({ paddingTop }) => getTopPadding(paddingTop)}px ${HORIZONTAL_PADDING}px 12px;

/_ Colors _/
background-color: ${({ theme, setHeaderColorWithTheme }) =>
getBackgroundColor(theme, setHeaderColorWithTheme)};

/_ Border _/
border-bottom-width: ${({ showBorderBottom }) => getBorderWidth(showBorderBottom)}px;
border-bottom-color: ${({ theme }) => theme.colors.Elements.DividerNavBar};

/_ Z-index _/
z-index: ${({ theme }) => theme.zIndex.header || 100};
`;

_Improvements_:

1. ✅ Logic extracted to testable helper functions
2. ✅ Readable and maintainable
3. ✅ Platform logic isolated
4. ✅ Uses theme for z-index
5. ✅ Consistent units (px)
6. ✅ Clear separation of concerns
7. ✅ Grouped by category (Layout, Spacing, Colors, etc.)

_Alternative: Use props for complex cases_

typescript
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
const BaseContainer = styled.View`  flex-direction: row;
  min-height: 52px;
  padding-horizontal: ${HORIZONTAL_PADDING}px;
  padding-bottom: 12px;
  border-bottom-color: ${({ theme }) => theme.colors.Elements.DividerNavBar};
  z-index: ${({ theme }) => theme.zIndex.header || 100};`;

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
- [ ] No any types (unless absolutely necessary)
- [ ] Proper error handling implemented
- [ ] Loading states handled
- [ ] Edge cases considered

### React/React Native Best Practices

- [ ] Proper hook dependencies
- [ ] Cleanup functions for effects
- [ ] Memoization where appropriate (useCallback, useMemo)
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

- [ ] All user-facing text uses copyID
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
- [ ] Large lists use FlatList with optimization
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

_Scenario_: Reviewing a new TripCard component

typescript
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

_Review Comments_:

1. ❌ _Architecture_: Missing MVVM structure. Should have 4 files.
2. ❌ _Types_: Props not typed, using implicit any.
3. ❌ _Styling_: Inline styles and hardcoded colors.
4. ❌ _Logic_: Navigation logic in component file.
5. ❌ _i18n_: Hardcoded text strings.

_Suggested Fix_:

typescript
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
export const Container = styled.View`  padding: ${({ theme }) => theme.spacing.medium}px;
  background-color: ${({ theme }) => theme.colors.Background.Background1};
  border-radius: 8px;
  margin: 8px 0;`;

export const TouchableOpacity = styled.TouchableOpacity`  padding: 12px;`;

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

### Example 2: Redux Slice Review

_Scenario_: Reviewing a trips slice

typescript
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

_Review Comments_:

1. ❌ _Types_: Initial state not typed.
2. ❌ _Completeness_: Missing error handling, selectors.
3. ❌ _Best Practice_: No reset action.

_Suggested Fix_:

typescript
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

### Example 3: Hook Review

_Scenario_: Reviewing a custom hook

typescript
// ❌ PROBLEMATIC CODE
export const useTrips = (userId) => {
const [trips, setTrips] = useState([]);

useEffect(() => {
fetchTrips(userId).then(setTrips);
}, []);

return trips;
};

_Review Comments_:

1. ❌ _Types_: No TypeScript types.
2. ❌ _Dependencies_: Missing userId in dependency array.
3. ❌ _Error Handling_: No error handling.
4. ❌ _Loading State_: No loading indicator.

_Suggested Fix_:

typescript
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

---

## Review Response Templates

### Blocking Issue

markdown
🚫 **Blocking**: [Issue description]

**Why**: [Explanation of why this is blocking]

**Suggestion**: [How to fix]

**Example**:
typescript
// Current code
[problematic code]

// Suggested fix
[fixed code]

```

### Suggestion

markdown
💡 *Suggestion*: [Improvement description]

*Benefit*: [Why this would be better]

*Example*:
typescript
// Suggested approach
[improved code]



### Praise

markdown
✅ *Nice work*: [What was done well]

[Optional: Why this is good practice]


### Question

markdown
❓ *Question*: [Your question]

[Context or reason for asking]
```

---

## Final Notes

- _Be thorough but efficient_: Focus on important issues
- _Provide context_: Explain why something matters
- _Offer solutions_: Don't just point out problems
- _Be consistent_: Apply standards uniformly
- _Stay updated_: These guidelines evolve with the project

Remember: The goal is to maintain code quality while helping the team grow and learn.
