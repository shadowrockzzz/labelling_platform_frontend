const { config } = require("./wdio.conf");

// CI-specific overrides
config.maxInstances = 1;

// Use both JUnit (for CI status) and Allure (for rich reports)
config.reporters = [
  "spec",
  ["junit", { outputDir: "./reports/junit" }],
  ["allure", { outputDir: "./reports/allure-results", disableWebdriverStepsReporting: true }],
];

exports.config = config;
