const LoginPage    = require("../../pages/LoginPage");
const DashboardPage = require("../../pages/DashboardPage");
const allure = require("@wdio/allure-reporter").default;

describe("Login Page — E2E", () => {
  allure.addFeature("Authentication");
  allure.addStory("Login Flow");

  beforeEach(async () => {
    await LoginPage.open();
  });

  it("shows login form with email and password fields", async () => {
    allure.addSeverity("normal");
    allure.addDescription("Verify login form elements are visible");
    
    // Assert
    await expect(LoginPage.emailInput).toBeDisplayed();
    await expect(LoginPage.passwordInput).toBeDisplayed();
    await expect(LoginPage.submitButton).toBeDisplayed();
  });

  it("logs in successfully with valid annotator credentials and redirects to dashboard", async () => {
    allure.addSeverity("critical");
    allure.addDescription("Annotator can log in with valid credentials and is redirected to dashboard");
    
    // Act
    await LoginPage.loginAndWaitForDashboard(
      process.env.TEST_ANNOTATOR_EMAIL,
      process.env.TEST_ANNOTATOR_PASSWORD
    );

    // Assert
    await expect(DashboardPage.heading).toBeDisplayed();
    expect(await browser.getUrl()).toContain("/dashboard");
  });

  it("shows an error message for incorrect password", async () => {
    allure.addSeverity("normal");
    allure.addDescription("Login shows error message for wrong password");
    
    // Act
    await LoginPage.login(process.env.TEST_ANNOTATOR_EMAIL, "WrongPassword123");

    // Assert
    await LoginPage.errorMessage.waitForDisplayed({ timeout: 5000 });
    await expect(LoginPage.errorMessage).toBeDisplayed();
  });

  it("shows validation error when email field is empty", async () => {
    allure.addSeverity("minor");
    allure.addDescription("Form validation prevents submission with empty email");
    
    // Act
    await LoginPage.submitButton.click();

    // Assert — browser native validation or custom error
    const emailInput = await LoginPage.emailInput;
    const validationMsg = await browser.execute(
      (el) => el.validationMessage,
      emailInput
    );
    expect(validationMsg).not.toBe("");
  });

  it("redirects unauthenticated users away from protected routes", async () => {
    allure.addSeverity("critical");
    allure.addDescription("Unauthenticated users are redirected to login when accessing protected routes");
    
    // Act — navigate directly to a protected page without logging in
    await browser.url("/dashboard");

    // Assert
    await browser.waitUntil(
      async () => (await browser.getUrl()).includes("/login"),
      { timeout: 5000, timeoutMsg: "Expected redirect to /login for unauthenticated access" }
    );
  });
});