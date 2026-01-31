---
name: generate-bdd-tests
description: Generates comprehensive BDD-style test files using vitest and testing-library. Use when creating tests, writing test files, generating test coverage, or when asked to test hooks, components, utilities, or constants.
---

# BDD Test File Generator

Generate behavior-driven test files that focus on public API and observable behavior.

## Quick Start Workflow

1. **Read the source file** to understand what needs to be tested
2. **Identify the public API** - all exported functions, constants, hooks, or component props
3. **Check for existing test setup** - look for `setup.ts`, `vitest.config.ts`, or existing test files
4. **Generate the test file** using patterns from `references/patterns.md`

## Core Principle

Test public API and observable behavior only, never internal implementation:

- **Hooks/Components**: Test user interactions, props, rendered output
- **Functions/Utilities**: Test inputs → outputs, not internal algorithm steps
- **Constants**: Test exported values are correct

## Test Description Style

Use BDD-style descriptions with flexible GIVEN/WHEN/THEN/AND comments:

```typescript
// Full form
// GIVEN an unauthenticated user
// WHEN the protected route is accessed
// THEN the user should be redirected

// With AND for multiple assertions
// GIVEN a user is authenticated
// WHEN the profile page loads
// THEN the username should be displayed
// AND the avatar should be visible

// Simple form (no WHEN needed)
// GIVEN an empty array
// THEN length should be zero

// Multiple conditions
// GIVEN a valid token
// AND the user has admin role
// WHEN accessing admin panel
// THEN access should be granted
```

## Coverage Requirements

- Primary success paths (happy path)
- Edge cases (empty strings, null, boundaries)
- Error states (graceful error handling)
- All exported items

## References

- `references/patterns.md` - Detailed test patterns and mock handling
- `references/examples.md` - Complete example test files
