/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module 'vitest' {
  interface Assertion<T = any> extends TestingLibraryMatchers<typeof expect.stringContaining, T> {
    // Extended with jest-dom matchers
  }
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<typeof expect.stringContaining, any> {
    // Extended with jest-dom matchers
  }
}
