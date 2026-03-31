# Project: doc-to-dashboard

## Testing

- **Always create or update test cases for every change made.** No code change should land without corresponding tests.
- Test framework: Vitest + React Testing Library (jsdom environment)
- Test setup: `src/test/setup.ts` (mocks for clipboard, hljs, framer-motion, crypto.randomUUID, matchMedia)
- Run tests: `npm test` (or `npm run test:watch` for watch mode)
- Test file convention: colocate in `__tests__/` directories next to source (e.g., `src/hooks/__tests__/useComments.test.ts`)
