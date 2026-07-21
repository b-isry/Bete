/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFiles: ['<rootDir>/src/test/setup-env.ts'],
  clearMocks: true,
  collectCoverageFrom: [
    'src/modules/auth/**/*.ts',
    '!src/modules/auth/**/__tests__/**',
  ],
};
