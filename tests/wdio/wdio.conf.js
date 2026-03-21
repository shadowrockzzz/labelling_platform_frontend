require("dotenv").config({ path: `${__dirname}/../.env.test` });

exports.config = {
  runner: "local",
  baseUrl: process.env.TEST_FRONTEND_URL ?? "http://localhost:5173",
  specs: ["./specs/**/*.spec.js"],
  exclude: [],
  maxInstances: 1,
  
  // Use WebDriver protocol (not DevTools) for better ChromeDriver compatibility
  automationProtocol: "webdriver",
  
  // WebdriverIO v9 - browser configuration
  // Let WDIO v9 auto-download and manage Chrome (avoids snap sandbox issues)
  capabilities: [{
    maxInstances: 1,
    browserName: "chrome",
    browserVersion: "stable",  // Let WDIO auto-detect version
  }],
  
  logLevel: "info",
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,
  framework: "mocha",
  reporters: [
    "spec",
    ["allure", { outputDir: "./reports/allure-results", disableWebdriverStepsReporting: true }],
  ],
  mochaOpts: {
    ui: "bdd",
    timeout: 60000,
  },

  // Hook: run before each test to ensure clean state
  beforeTest: async function () {
    await browser.deleteAllCookies();
    await browser.execute(() => localStorage.clear());
  },

  // Hook: take screenshot on failed tests for Allure
  afterTest: async function (test, context, { error, result, duration, passed }) {
    if (!passed) {
      const allure = require("@wdio/allure-reporter").default;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const screenshotPath = `./reports/screenshots/${test.parent}-${timestamp}.png`;
      await browser.saveScreenshot(screenshotPath);
      allure.addAttachment("Screenshot on Failure", Buffer.from(await browser.takeScreenshot()), "image/png");
    }
  },
};