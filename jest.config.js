// setup file for jest
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./setup-jest.js'],
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '((\\.|/)(e2e|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'js'],
  verbose: true,
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  coverageReporters: ['html', 'text-summary'],
};
