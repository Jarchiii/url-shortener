const testPathIgnorePatterns = ['/node_modules/'];
if (!process.env.INTEGRATION) {
  testPathIgnorePatterns.push('\\.integration\\.test\\.ts$');
}

export default {
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(ts|js)$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript' },
          target: 'es2022',
        },
        module: { type: 'commonjs' },
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!nanoid)'],
  testMatch: ['**/tests/**/*.test.ts'],
  testPathIgnorePatterns,
};
