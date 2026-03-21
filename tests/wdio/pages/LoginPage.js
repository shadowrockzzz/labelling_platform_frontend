class LoginPage {
  // Selectors — use data-testid attributes wherever possible
  get emailInput()      { return $('[data-testid="login-email-input"]'); }
  get passwordInput()   { return $('[data-testid="login-password-input"]'); }
  get submitButton()    { return $('[data-testid="login-submit-btn"]'); }
  get errorMessage()    { return $('[data-testid="login-error-message"]'); }
  get pageHeading()     { return $('[data-testid="login-heading"]'); }

  /**
   * Navigate to the login page
   */
  async open() {
    const baseUrl = process.env.TEST_FRONTEND_URL ?? "http://localhost:5173";
    await browser.url(`${baseUrl}/login`);
    console.log(`Navigated to: ${baseUrl}/login`);
    
    // Wait for page to load
    await this.pageHeading.waitForDisplayed({ timeout: 10000 });
    console.log("Login page heading displayed");
  }

  /**
   * Fill in credentials and submit the form
   */
  async login(email, password) {
    await this.emailInput.setValue(email);
    await this.passwordInput.setValue(password);
    await this.submitButton.click();
  }

  /**
   * Login and wait for redirect to dashboard
   */
  async loginAndWaitForDashboard(email, password) {
    console.log(`Attempting login with: ${email}`);
    await this.login(email, password);
    
    // Wait for either redirect to dashboard OR error message
    let loggedIn = false;
    let attempts = 0;
    const maxAttempts = 16; // 8 seconds total
    
    while (!loggedIn && attempts < maxAttempts) {
      const currentUrl = await browser.getUrl();
      if (currentUrl.includes("/dashboard")) {
        loggedIn = true;
        console.log("Successfully logged in - redirected to dashboard");
        break;
      }
      
      // Check for error message (login failed)
      const errorDisplayed = await this.errorMessage.isDisplayed().catch(() => false);
      if (errorDisplayed) {
        const errorText = await this.errorMessage.getText().catch(() => "Unknown error");
        throw new Error(`Login failed: ${errorText}. Check if test user exists in database.`);
      }
      
      await browser.pause(500);
      attempts++;
    }
    
    if (!loggedIn) {
      const finalUrl = await browser.getUrl();
      throw new Error(`Login timed out. Current URL: ${finalUrl}. Test user may not exist or credentials may be incorrect.`);
    }
  }
}

module.exports = new LoginPage();