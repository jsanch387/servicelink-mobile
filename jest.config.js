/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)'],
  modulePathIgnorePatterns: ['<rootDir>/.expo/'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.expo/'],
  /** Avoid Watchman when it is unavailable (e.g. some CI/sandbox environments). */
  watchman: false,
};
