// setup file for jest
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./setup-jest.js'],
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(e2e|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'js'],
  verbose: true,
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  coverageReporters: ['html', 'text-summary']
};
