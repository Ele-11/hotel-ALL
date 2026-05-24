const tsJestPath = require.resolve("../api/node_modules/ts-jest");

module.exports = {
  rootDir: "../..",
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/apps/mobile/src/**/*.spec.ts",
    "<rootDir>/apps/mobile/src/**/*.spec.tsx",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": [
      tsJestPath,
      {
        diagnostics: false,
        tsconfig: "<rootDir>/apps/mobile/tsconfig.test.json",
      },
    ],
  },
};
