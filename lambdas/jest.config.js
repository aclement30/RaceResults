/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(lodash-es|@babel))'
  ],
  moduleNameMapper: {
    '^lodash-es$': 'lodash',
    '^lodash-es/(.*)$': 'lodash/$1'
  },
  testMatch: ['**/*.test.(ts|js)'],
  collectCoverageFrom: [
    '**/*.(ts|js)',
    '!**/*.test.(ts|js)',
    '!**/node_modules/**',
    '!**/coverage/**',
  ]
};

module.exports = config;