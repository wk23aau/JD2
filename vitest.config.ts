import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config'; // Your existing Vite config

export default mergeConfig(
  viteConfig, // Merge with your existing Vite config
  defineConfig({
    test: {
      globals: true, // Use global APIs like describe, it, expect
      environment: 'jsdom', // Simulate browser environment for React components
      setupFiles: './src/test-setup.ts', // Optional: For setting up testing environment (e.g., jest-dom matchers)
      css: true, // Enable CSS processing if your components import CSS files
      // reporters: ['default', 'html'], // Optional: For HTML report
      coverage: {
        provider: 'v8', // or 'istanbul'
        reporter: ['text', 'json', 'html'],
        reportsDirectory: './coverage/frontend',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/main.tsx', // Or index.tsx
          'src/vite-env.d.ts',
          'src/types.ts', // Usually exclude plain type definitions
          'src/constants.ts', // And constants
          'src/AuthContext.tsx', // Will test this separately, focus on UI components for component tests
          // Add other files/patterns to exclude from component coverage if tested differently
        ],
      },
    },
  })
);
