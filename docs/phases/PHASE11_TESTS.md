# Phase 11 - Tests Documentation

## Test Setup

### Required Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

### Configuration Files

- `vitest.config.ts` - Vitest configuration
- `src/test/setup.ts` - Test setup file

## Test Files Created

### Unit Tests
1. `src/services/ai/__tests__/prompts.test.ts`
   - Tests for all prompt builders
   - Validates prompt structure and content

2. `src/services/ai/__tests__/guardrails.test.ts`
   - Tests for suggestion validation
   - Tests for risk warnings
   - Tests for safety checks

3. `src/services/ai/__tests__/contextBuilder.test.ts`
   - Tests for context building
   - Tests for different modes

### Component Tests
4. `src/components/ai/__tests__/AiChatWidget.test.tsx`
   - Tests for chat widget rendering
   - Tests for user interactions
   - Tests for message sending

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Test Coverage Goals

- ✅ Prompts: 100% coverage
- ✅ Guardrails: 100% coverage
- ✅ Context Builder: 80%+ coverage
- ✅ Components: 70%+ coverage

## Notes

- Tests use Vitest as the test runner
- React Testing Library for component tests
- Mocked Supabase client for integration tests
- Mocked AI client for component tests

