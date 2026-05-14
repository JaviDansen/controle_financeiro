import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*_test.ts', '<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@finapp/db$': '<rootDir>/../../packages/db/src/index.ts',
  },
  setupFiles: ['<rootDir>/tests/helpers/setup-env.ts'],
  globalSetup: '<rootDir>/tests/helpers/global-setup.ts',
  globalTeardown: '<rootDir>/tests/helpers/global-teardown.ts',
  passWithNoTests: true,
}

export default config
