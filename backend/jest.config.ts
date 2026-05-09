import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src/tests"],
  testMatch: ["**/*.test.ts"],
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/src/tests/tsconfig.json",
    },
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/tests/**",
    "!src/index.ts",
  ],
  testTimeout: 15000,
};

export default config;
