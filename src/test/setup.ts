import '@testing-library/jest-dom/vitest'

// Mock crypto.randomUUID
let uuidCounter = 0
vi.stubGlobal('crypto', {
  ...globalThis.crypto,
  randomUUID: () => `test-uuid-${++uuidCounter}`,
})

// Reset UUID counter between tests
beforeEach(() => {
  uuidCounter = 0
  localStorage.clear()
})

// Mock highlight.js
vi.mock('highlight.js', () => ({
  default: { highlightElement: vi.fn() },
}))

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: new Proxy(
      {},
      {
        get: (_target, prop: string) => {
          // Return a forwardRef component that renders the HTML element
          const Component = actual.motion[prop as keyof typeof actual.motion]
          if (Component) return Component
          // Fallback: render a plain element
          return ({ children, ...props }: Record<string, unknown>) => {
            const element = document.createElement(prop)
            return { type: prop, props: { ...props, children } }
          }
        },
      }
    ),
  }
})

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  writable: true,
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
