class DashboardPage {
  get heading()          { return $('[data-testid="dashboard-heading"]'); }
  get projectList()      { return $('[data-testid="project-list"]'); }
  get projectCards()     { return $$('[data-testid="project-card"]'); }
  get createProjectBtn() { return $('[data-testid="create-project-btn"]'); }
  get userMenuBtn()      { return $('[data-testid="user-menu-btn"]'); }
  get logoutBtn()        { return $('[data-testid="logout-btn"]'); }
  get navUsers()         { return $('[data-testid="nav-users"]'); }

  async open() {
    await browser.url("/dashboard");
    await this.heading.waitForDisplayed({ timeout: 5000 });
  }

  async logout() {
    await this.userMenuBtn.click();
    await this.logoutBtn.waitForClickable({ timeout: 3000 });
    await this.logoutBtn.click();
    await browser.waitUntil(
      async () => (await browser.getUrl()).includes("/login"),
      { timeout: 5000, timeoutMsg: "Expected redirect to /login after logout" }
    );
  }

  async clickFirstProject() {
    const cards = await this.projectCards;
    if (cards.length > 0) {
      await cards[0].click();
    } else {
      throw new Error("No project cards found on dashboard");
    }
  }
}

module.exports = new DashboardPage();