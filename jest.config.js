const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
};

module.exports = createJestConfig(config);
