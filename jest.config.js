module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/e2e'],
  testMatch: ['**/*.test.ts', '**/*.e2e.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  // Allow specifying a pattern on the command line
  // Example: npm test -- --testNamePattern="should return the server manifest"
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  // Setup files for e2e tests
  setupFilesAfterEnv: ['<rootDir>/e2e/setup.ts'],
  // Longer timeout for e2e tests
  testTimeout: 30000,
};
