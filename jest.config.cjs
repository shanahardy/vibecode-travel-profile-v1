/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  maxWorkers: 1,
  modulePathIgnorePatterns: ['<rootDir>/.cache/', '<rootDir>/dist/'],
  projects: [
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/server/__tests__/**/*.test.ts'],
      setupFiles: ['<rootDir>/jest.setup.js'],
      setupFilesAfterEnv: ['<rootDir>/jest.afterEnv.js'],
      modulePathIgnorePatterns: ['<rootDir>/.cache/', '<rootDir>/dist/'],
      moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/shared/$1',
      },
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.json',
          },
        ],
      },
      collectCoverageFrom: [
        'server/**/*.ts',
        'shared/**/*.ts',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/__tests__/**',
        '!**/__mocks__/**',
        '!**/coverage/**',
      ],
      coverageThreshold: {
        global: {
          lines: 80,
          statements: 80,
          functions: 75,
          branches: 70,
        },
      },
    },
  ],
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,
};
