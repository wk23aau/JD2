/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    // Add any module name mappings here if needed
    // Example: '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: [
    // '<rootDir>/src/test-setup.ts' // if you have a test setup file
  ],
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // Coverage reporting
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8", // or "babel"
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts", // Exclude test files from coverage
    "!src/server.ts", // Usually exclude server entry point if it's hard to test directly
    "!src/db.ts", // Exclude direct DB connection setup if tested via integration
    "!src/types.ts", // Exclude type definition files
    // Add other exclusions as needed
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/"
  ]
};
