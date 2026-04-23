module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/frontend/src/$1",
    "^@backend/(.*)$": "<rootDir>/backend/src/$1",
    "^@shared/(.*)$": "<rootDir>/shared/$1",
    "^@stylemart/shared/(.*)$": "<rootDir>/shared/$1",
  },
  collectCoverageFrom: [
    "frontend/src/**/*.{ts,tsx}",
    "backend/src/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  testTimeout: 10000,
};
