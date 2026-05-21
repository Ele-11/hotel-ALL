const tsJestPath = require.resolve("../api/node_modules/ts-jest");

module.exports = {
  rootDir: "../..",
  testEnvironment: "node",
  testMatch: ["<rootDir>/apps/web/src/**/*.spec.ts", "<rootDir>/apps/web/src/**/*.spec.tsx"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      tsJestPath,
      {
        diagnostics: false,
        tsconfig: "<rootDir>/apps/web/tsconfig.test.json",
      },
    ],
  },
};
