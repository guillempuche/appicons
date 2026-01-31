# Complete Test File Examples

## Example 1: Shopping Cart Component

Tests a component with state management, user interactions, and conditional rendering.

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ShoppingCart } from './ShoppingCart'

const mockItems = [
    { id: '1', name: 'Blue T-Shirt', price: 25.0, quantity: 2 },
    { id: '2', name: 'Running Shoes', price: 89.99, quantity: 1 },
]

describe('ShoppingCart', () => {
    const onRemove = vi.fn()
    const onUpdateQuantity = vi.fn()

    beforeEach(() => {
        onRemove.mockClear()
        onUpdateQuantity.mockClear()
    })

    it('should display empty state when cart has no items', () => {
        // GIVEN an empty cart
        render(<ShoppingCart items={[]} onRemove={onRemove} />)

        // THEN empty message should be visible
        expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
        // AND no item list should be rendered
        expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })

    it('should render all cart items with details', () => {
        // GIVEN a cart with items
        render(<ShoppingCart items={mockItems} onRemove={onRemove} />)

        // THEN each item should be displayed
        expect(screen.getByText('Blue T-Shirt')).toBeInTheDocument()
        expect(screen.getByText('Running Shoes')).toBeInTheDocument()
        // AND prices should be formatted
        expect(screen.getByText('$25.00')).toBeInTheDocument()
        expect(screen.getByText('$89.99')).toBeInTheDocument()
    })

    it('should calculate total price correctly', () => {
        // GIVEN a cart with multiple items
        render(<ShoppingCart items={mockItems} onRemove={onRemove} />)

        // THEN total should reflect quantities
        // (25 * 2) + (89.99 * 1) = 139.99
        expect(screen.getByTestId('cart-total')).toHaveTextContent('$139.99')
    })

    it('should call onRemove when delete button is clicked', () => {
        // GIVEN a cart with items
        render(<ShoppingCart items={mockItems} onRemove={onRemove} />)

        // WHEN delete button for first item is clicked
        const deleteButtons = screen.getAllByRole('button', { name: /remove/i })
        fireEvent.click(deleteButtons[0])

        // THEN onRemove should be called with item id
        expect(onRemove).toHaveBeenCalledWith('1')
        expect(onRemove).toHaveBeenCalledTimes(1)
    })

    it('should update quantity when selector changes', () => {
        // GIVEN a cart with updateQuantity handler
        render(
            <ShoppingCart
                items={mockItems}
                onRemove={onRemove}
                onUpdateQuantity={onUpdateQuantity}
            />
        )

        // WHEN quantity is changed
        const quantityInputs = screen.getAllByRole('spinbutton')
        fireEvent.change(quantityInputs[0], { target: { value: '5' } })

        // THEN onUpdateQuantity should be called
        expect(onUpdateQuantity).toHaveBeenCalledWith('1', 5)
    })
})
```

## Example 2: Data Fetching Hook

Tests a hook with async operations, loading states, and error handling.

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'

import { useProducts } from './useProducts'
import { fetchProducts } from '~/services/api'

vi.mock('~/services/api', () => ({
    fetchProducts: vi.fn(),
}))

const fetchProductsMock = fetchProducts as Mock

describe('useProducts', () => {
    beforeEach(() => {
        fetchProductsMock.mockClear()
    })

    it('should start in loading state', () => {
        // GIVEN the API will return data eventually
        fetchProductsMock.mockResolvedValue([])

        // WHEN the hook is rendered
        const { result } = renderHook(() => useProducts())

        // THEN initial state should be loading
        expect(result.current.isLoading).toBe(true)
        expect(result.current.products).toEqual([])
        expect(result.current.error).toBeNull()
    })

    it('should return products after successful fetch', async () => {
        // GIVEN the API returns products
        const mockProducts = [
            { id: '1', name: 'Laptop', price: 999 },
            { id: '2', name: 'Mouse', price: 29 },
        ]
        fetchProductsMock.mockResolvedValue(mockProducts)

        // WHEN the hook is rendered
        const { result } = renderHook(() => useProducts())

        // THEN products should be available after loading
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })
        expect(result.current.products).toEqual(mockProducts)
        expect(result.current.error).toBeNull()
    })

    it('should handle API errors gracefully', async () => {
        // GIVEN the API fails
        fetchProductsMock.mockRejectedValue(new Error('Server unavailable'))

        // WHEN the hook is rendered
        const { result } = renderHook(() => useProducts())

        // THEN error should be captured
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })
        expect(result.current.error).toBe('Server unavailable')
        // AND products should remain empty
        expect(result.current.products).toEqual([])
    })

    it('should filter products by category', async () => {
        // GIVEN the API returns products
        const mockProducts = [
            { id: '1', name: 'Laptop', category: 'electronics' },
            { id: '2', name: 'Desk', category: 'furniture' },
        ]
        fetchProductsMock.mockResolvedValue(mockProducts)

        // WHEN filtering by category
        const { result } = renderHook(() => useProducts({ category: 'electronics' }))

        // THEN API should be called with filter
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })
        expect(fetchProductsMock).toHaveBeenCalledWith({ category: 'electronics' })
    })
})
```

## Example 3: Form Validation Utility

Tests a pure function with various input scenarios and edge cases.

```typescript
import { describe, expect, it } from 'vitest'

import {
    validateEmail,
    validatePassword,
    validateUsername,
    validateForm,
} from './validators'

describe('Form Validators', () => {
    describe('validateEmail', () => {
        it('should accept valid email addresses', () => {
            // GIVEN valid email formats
            // THEN validation should pass
            expect(validateEmail('user@example.com')).toEqual({ valid: true })
            expect(validateEmail('name.surname@company.co.uk')).toEqual({ valid: true })
            expect(validateEmail('user+tag@gmail.com')).toEqual({ valid: true })
        })

        it('should reject invalid email formats', () => {
            // GIVEN invalid emails
            // THEN validation should fail with message
            expect(validateEmail('notanemail')).toEqual({
                valid: false,
                error: 'Invalid email format',
            })
            expect(validateEmail('@missing-local.com')).toEqual({
                valid: false,
                error: 'Invalid email format',
            })
            expect(validateEmail('missing@domain')).toEqual({
                valid: false,
                error: 'Invalid email format',
            })
        })

        it('should handle empty input', () => {
            // GIVEN empty string
            // THEN should return required error
            expect(validateEmail('')).toEqual({
                valid: false,
                error: 'Email is required',
            })
        })
    })

    describe('validatePassword', () => {
        it('should accept passwords meeting all requirements', () => {
            // GIVEN a strong password
            // THEN validation should pass
            expect(validatePassword('SecureP@ss123')).toEqual({ valid: true })
        })

        it('should reject passwords without uppercase', () => {
            // GIVEN password without uppercase
            // THEN should require uppercase letter
            expect(validatePassword('lowercase123!')).toEqual({
                valid: false,
                error: 'Password must contain an uppercase letter',
            })
        })

        it('should reject passwords shorter than minimum length', () => {
            // GIVEN short password
            // THEN should require minimum length
            expect(validatePassword('Ab1!')).toEqual({
                valid: false,
                error: 'Password must be at least 8 characters',
            })
        })

        it('should reject passwords without special character', () => {
            // GIVEN password without special char
            // THEN should require special character
            expect(validatePassword('SecurePass123')).toEqual({
                valid: false,
                error: 'Password must contain a special character',
            })
        })
    })

    describe('validateUsername', () => {
        it('should accept alphanumeric usernames with underscores', () => {
            // GIVEN valid usernames
            // THEN validation should pass
            expect(validateUsername('john_doe')).toEqual({ valid: true })
            expect(validateUsername('user123')).toEqual({ valid: true })
            expect(validateUsername('CamelCase')).toEqual({ valid: true })
        })

        it('should reject usernames with spaces or special chars', () => {
            // GIVEN username with invalid characters
            // THEN should reject
            expect(validateUsername('john doe')).toEqual({
                valid: false,
                error: 'Username can only contain letters, numbers, and underscores',
            })
            expect(validateUsername('user@name')).toEqual({
                valid: false,
                error: 'Username can only contain letters, numbers, and underscores',
            })
        })

        it('should enforce length constraints', () => {
            // GIVEN too short username
            // THEN should require minimum length
            expect(validateUsername('ab')).toEqual({
                valid: false,
                error: 'Username must be 3-20 characters',
            })

            // GIVEN too long username
            // THEN should require maximum length
            expect(validateUsername('a'.repeat(21))).toEqual({
                valid: false,
                error: 'Username must be 3-20 characters',
            })
        })
    })

    describe('validateForm', () => {
        it('should return all field errors when multiple fields invalid', () => {
            // GIVEN form with multiple invalid fields
            const form = {
                email: 'invalid',
                password: 'weak',
                username: 'a',
            }

            // WHEN validating entire form
            const result = validateForm(form)

            // THEN should return errors for each field
            expect(result.valid).toBe(false)
            expect(result.errors).toHaveProperty('email')
            expect(result.errors).toHaveProperty('password')
            expect(result.errors).toHaveProperty('username')
        })

        it('should return valid when all fields pass', () => {
            // GIVEN form with all valid fields
            const form = {
                email: 'user@example.com',
                password: 'SecureP@ss123',
                username: 'validuser',
            }

            // WHEN validating entire form
            const result = validateForm(form)

            // THEN should be valid with no errors
            expect(result.valid).toBe(true)
            expect(result.errors).toEqual({})
        })
    })
})
```

## Example 4: Configuration Constants

Tests exported constants for correctness and type safety.

```typescript
import { describe, expect, it } from 'vitest'

import {
    API_CONFIG,
    ROUTE_PATHS,
    BREAKPOINTS,
    DEFAULT_PAGINATION,
} from './constants'

describe('Application Constants', () => {
    describe('API_CONFIG', () => {
        it('should have required configuration properties', () => {
            expect(API_CONFIG).toHaveProperty('BASE_URL')
            expect(API_CONFIG).toHaveProperty('TIMEOUT')
            expect(API_CONFIG).toHaveProperty('RETRY_ATTEMPTS')
        })

        it('should use HTTPS for base URL', () => {
            // GIVEN the API config
            // THEN base URL should be secure
            expect(API_CONFIG.BASE_URL).toMatch(/^https:\/\//)
        })

        it('should have reasonable timeout value', () => {
            // GIVEN timeout configuration
            // THEN should be between 5-30 seconds
            expect(API_CONFIG.TIMEOUT).toBeGreaterThanOrEqual(5000)
            expect(API_CONFIG.TIMEOUT).toBeLessThanOrEqual(30000)
        })
    })

    describe('ROUTE_PATHS', () => {
        it('should define all main application routes', () => {
            expect(ROUTE_PATHS).toMatchObject({
                HOME: '/',
                LOGIN: '/login',
                DASHBOARD: '/dashboard',
                SETTINGS: '/settings',
            })
        })

        it('should have routes starting with forward slash', () => {
            // GIVEN all route paths
            // THEN each should be absolute
            Object.values(ROUTE_PATHS).forEach((path) => {
                expect(path).toMatch(/^\//)
            })
        })
    })

    describe('BREAKPOINTS', () => {
        it('should define responsive breakpoints in ascending order', () => {
            // GIVEN breakpoint values
            // THEN they should increase progressively
            expect(BREAKPOINTS.SM).toBeLessThan(BREAKPOINTS.MD)
            expect(BREAKPOINTS.MD).toBeLessThan(BREAKPOINTS.LG)
            expect(BREAKPOINTS.LG).toBeLessThan(BREAKPOINTS.XL)
        })

        it('should use pixel values as numbers', () => {
            // GIVEN all breakpoints
            // THEN each should be a positive number
            Object.values(BREAKPOINTS).forEach((value) => {
                expect(typeof value).toBe('number')
                expect(value).toBeGreaterThan(0)
            })
        })
    })

    describe('DEFAULT_PAGINATION', () => {
        it('should have sensible default values', () => {
            expect(DEFAULT_PAGINATION).toMatchObject({
                PAGE: 1,
                PAGE_SIZE: 20,
                MAX_PAGE_SIZE: 100,
            })
        })

        it('should not allow page size greater than max', () => {
            // GIVEN pagination limits
            // THEN default should not exceed max
            expect(DEFAULT_PAGINATION.PAGE_SIZE).toBeLessThanOrEqual(
                DEFAULT_PAGINATION.MAX_PAGE_SIZE
            )
        })
    })
})
```
