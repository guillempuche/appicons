# BDD Test Patterns

## Test File Structure

```typescript
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, renderHook, act, waitFor, fireEvent } from '@testing-library/react'

// Mocks - DO NOT re-declare mocks already in setup.ts

describe('FeatureName', () => {
    beforeEach(() => {
        // Reset mocks
    })

    it('should [describe observable behavior]', () => {
        // Use flexible GIVEN/WHEN/THEN/AND combinations
    })
})
```

## BDD Comment Combinations

Use the combination that best fits the test:

```typescript
// Full form: GIVEN/WHEN/THEN
it('should add item to cart', () => {
    // GIVEN an empty shopping cart
    // WHEN a product is added
    // THEN the cart should contain one item
})

// Simple form: GIVEN/THEN (no action needed)
it('should start with zero balance', () => {
    // GIVEN a new wallet instance
    // THEN balance should be zero
})

// Multiple assertions: GIVEN/WHEN/THEN/AND
it('should update order summary after checkout', () => {
    // GIVEN a cart with items
    // WHEN checkout is completed
    // THEN order confirmation should appear
    // AND cart should be emptied
})

// Multiple preconditions: GIVEN/AND/WHEN/THEN
it('should apply discount for premium members', () => {
    // GIVEN a cart total over $100
    // AND the user is a premium member
    // WHEN calculating final price
    // THEN 15% discount should be applied
})

// Multiple actions: GIVEN/WHEN/AND/THEN
it('should save draft after editing', () => {
    // GIVEN an existing document
    // WHEN the user modifies content
    // AND triggers auto-save
    // THEN draft should be persisted
})
```

## Mock Handling

### Module Mocks

```typescript
vi.mock('~/services/api', () => ({
    fetchUser: vi.fn(),
    updateUser: vi.fn(),
}))

const fetchUserMock = fetchUser as Mock
const updateUserMock = updateUser as Mock
```

### Reset in beforeEach

```typescript
beforeEach(() => {
    fetchUserMock.mockClear()
    updateUserMock.mockClear()
})
```

### Different Return Values

```typescript
// Success scenario
fetchUserMock.mockResolvedValue({
    id: 'usr_123',
    name: 'Alice',
    email: 'alice@example.com',
})

// Error scenario
fetchUserMock.mockRejectedValue(new Error('Network timeout'))

// Conditional behavior
fetchUserMock.mockImplementation((id) => {
    if (id === 'invalid') return Promise.reject(new Error('Not found'))
    return Promise.resolve({ id, name: 'User' })
})
```

## React Testing Patterns

### Test Wrapper for Providers

```typescript
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={mockTheme}>
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    </ThemeProvider>
)

const { result } = renderHook(() => useCart(), {
    wrapper: TestWrapper,
})
```

### Testing Components

```typescript
it('should display product name and price', () => {
    // GIVEN a product with details
    const product = { name: 'Wireless Mouse', price: 29.99 }

    // WHEN the component renders
    render(<ProductCard product={product} />)

    // THEN product information should be visible
    expect(screen.getByText('Wireless Mouse')).toBeInTheDocument()
    expect(screen.getByText('$29.99')).toBeInTheDocument()
})
```

### Testing User Interactions

```typescript
it('should increment quantity when plus button is clicked', () => {
    // GIVEN a quantity selector starting at 1
    const onChange = vi.fn()
    render(<QuantitySelector value={1} onChange={onChange} />)

    // WHEN the plus button is clicked
    fireEvent.click(screen.getByRole('button', { name: '+' }))

    // THEN onChange should be called with incremented value
    expect(onChange).toHaveBeenCalledWith(2)
})
```

### Testing Async Behavior

```typescript
it('should display search results after typing', async () => {
    // GIVEN a search input
    render(<SearchBox />)

    // WHEN the user types a query
    fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'laptop' },
    })

    // THEN results should appear after debounce
    await waitFor(() => {
        expect(screen.getByText('3 results found')).toBeInTheDocument()
    })
})
```

### Testing Hooks

```typescript
it('should toggle between light and dark theme', () => {
    // GIVEN the theme hook initialized
    const { result } = renderHook(() => useTheme())

    // THEN initial theme should be light
    expect(result.current.theme).toBe('light')

    // WHEN toggle is called
    act(() => {
        result.current.toggle()
    })

    // THEN theme should switch to dark
    expect(result.current.theme).toBe('dark')
})
```

## Utility Function Patterns

```typescript
describe('formatCurrency', () => {
    it('should format number with currency symbol', () => {
        // GIVEN a numeric amount
        // WHEN formatCurrency is called
        // THEN it should return formatted string
        expect(formatCurrency(1234.5)).toBe('$1,234.50')
    })

    it('should handle zero amount', () => {
        // GIVEN zero
        // THEN it should display as currency
        expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should handle negative amounts', () => {
        // GIVEN a negative number
        // THEN it should preserve the negative sign
        expect(formatCurrency(-50)).toBe('-$50.00')
    })
})
```

## Constants Testing

```typescript
describe('Feature Flags', () => {
    it('should have all required flags defined', () => {
        expect(FEATURE_FLAGS).toHaveProperty('DARK_MODE')
        expect(FEATURE_FLAGS).toHaveProperty('BETA_FEATURES')
        expect(FEATURE_FLAGS).toHaveProperty('ANALYTICS')
    })

    it('should have boolean values', () => {
        Object.values(FEATURE_FLAGS).forEach((value) => {
            expect(typeof value).toBe('boolean')
        })
    })
})
```

## BDD Description Guidelines

**Good descriptions** - behavior-focused:

- `'should add item to cart when add button is clicked'`
- `'should display error message for invalid email'`
- `'should persist selection after page refresh'`
- `'should disable submit button while loading'`

**Avoid** - implementation-focused:

- `'test addToCart function'` (not descriptive)
- `'calls setState'` (testing internals)
- `'works correctly'` (too vague)
- `'should set _internalFlag to true'` (exposes internals)
