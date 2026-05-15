/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  /**
   * `jest.mock('@expo/vector-icons')` does not always win over package `module` → `build/Icons.js`,
   * so real `createIconSet` still runs and triggers async `setState` → `act()` console errors.
   */
  moduleNameMapper: {
    '^@expo/vector-icons/(.+)$': '<rootDir>/jest/mocks/expoVectorIconsStubSub.js',
    '^@expo/vector-icons$': '<rootDir>/jest/mocks/expoVectorIconsStubRoot.js',
  },
  testMatch: ['**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)'],
  modulePathIgnorePatterns: ['<rootDir>/.expo/'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.expo/'],
  /** Avoid Watchman when it is unavailable (e.g. some CI/sandbox environments). */
  watchman: false,
};
