module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterFramework: ["@testing-library/jest-dom"],
  moduleNameMapper: {
    "\\.(css|scss)$": "<rootDir>/tests/unit/__mocks__/styleMock.js",
    "\\.(jpg|png|svg)$": "<rootDir>/tests/unit/__mocks__/fileMock.js",
  },
  testMatch: ["**/tests/unit/**/*.test.jsx", "**/tests/unit/**/*.test.js"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  rootDir: "..",
  reporters: [
    "default",
    ["jest-allure2-reporter", { resultsDir: "tests/unit/reports/allure-results" }],
  ],
};
