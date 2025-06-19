// Import jest-dom matchers for Vitest
import '@testing-library/jest-dom';

// You can add other global setup code here if needed.
// For example, mocking global objects or setting up MSW (Mock Service Worker).

// Example: Mock global fetch if you want to do it globally for all tests,
// though often it's better to mock it per test suite or per test.
// global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }));

// Example: Mock localStorage and sessionStorage
const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    }
  };
};

// global.localStorage = createStorageMock(); // Vitest's JSDOM environment usually provides this
// global.sessionStorage = createStorageMock();

// Clean up after each test
// import { afterEach } from 'vitest';
// import { cleanup } from '@testing-library/react';
// afterEach(() => {
//   cleanup(); // Unmounts React trees that were mounted with render
// });
