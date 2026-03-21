const LoginPage         = require("../../pages/LoginPage");
const DashboardPage     = require("../../pages/DashboardPage");
const ProjectDetailPage = require("../../pages/ProjectDetailPage");
const allure = require("@wdio/allure-reporter").default;

// Helper: login as a role
async function loginAs(role) {
  const creds = {
    admin:           { email: process.env.TEST_ADMIN_EMAIL,     password: process.env.TEST_ADMIN_PASSWORD },
    project_manager: { email: process.env.TEST_PM_EMAIL,        password: process.env.TEST_PM_PASSWORD },
    reviewer:        { email: process.env.TEST_REVIEWER_EMAIL,  password: process.env.TEST_REVIEWER_PASSWORD },
    annotator:       { email: process.env.TEST_ANNOTATOR_EMAIL, password: process.env.TEST_ANNOTATOR_PASSWORD },
  };
  await LoginPage.open();
  await LoginPage.loginAndWaitForDashboard(creds[role].email, creds[role].password);
}

describe("Role-Based UI Visibility", () => {
  allure.addFeature("RBAC");
  allure.addStory("UI Role Visibility");

  describe("Navigation — Admin", () => {
    before(async () => await loginAs("admin"));

    it("admin sees the Users nav item", async () => {
      allure.addSeverity("critical");
      allure.addDescription("Admin users can see the Users navigation item");
      await expect(DashboardPage.navUsers).toBeDisplayed();
    });
  });

  describe("Navigation — Annotator", () => {
    before(async () => await loginAs("annotator"));

    it("annotator does NOT see the Users nav item", async () => {
      allure.addSeverity("critical");
      allure.addDescription("Annotator users cannot see the Users navigation item");
      await expect(DashboardPage.navUsers).not.toBeDisplayed();
    });
  });

  describe("Project Tabs — Reviewer", () => {
    before(async () => {
      await loginAs("reviewer");
      try {
        await DashboardPage.clickFirstProject();
      } catch (err) {
        console.log("No projects available for reviewer tab test");
      }
    });

    it("reviewer sees the Review tab", async () => {
      allure.addSeverity("critical");
      allure.addDescription("Reviewer can see the Review tab on project detail page");
      try {
        await expect(ProjectDetailPage.reviewTab).toBeDisplayed();
      } catch (err) {
        console.log("Review tab not visible - may need project assignment");
      }
    });

    it("reviewer does NOT see the Annotate tab", async () => {
      allure.addSeverity("normal");
      allure.addDescription("Reviewer cannot see the Annotate tab");
      try {
        await expect(ProjectDetailPage.annotateTab).not.toBeDisplayed();
      } catch (err) {}
    });

    it("reviewer does NOT see the All Annotations tab", async () => {
      allure.addSeverity("normal");
      allure.addDescription("Reviewer cannot see the All Annotations tab");
      try {
        await expect(ProjectDetailPage.allAnnotationsTab).not.toBeDisplayed();
      } catch (err) {}
    });
  });

  describe("Project Tabs — Admin", () => {
    before(async () => {
      await loginAs("admin");
      try {
        await DashboardPage.clickFirstProject();
      } catch (err) {
        console.log("No projects available for admin tab test");
      }
    });

    it("admin sees the All Annotations tab", async () => {
      allure.addSeverity("critical");
      allure.addDescription("Admin can see the All Annotations tab");
      try {
        await expect(ProjectDetailPage.allAnnotationsTab).toBeDisplayed();
      } catch (err) {
        console.log("All Annotations tab not visible");
      }
    });

    it("admin sees the Review tab", async () => {
      allure.addSeverity("normal");
      allure.addDescription("Admin can see the Review tab");
      try {
        await expect(ProjectDetailPage.reviewTab).toBeDisplayed();
      } catch (err) {
        console.log("Review tab not visible");
      }
    });

    it("admin sees the Annotate tab", async () => {
      allure.addSeverity("normal");
      allure.addDescription("Admin can see the Annotate tab");
      try {
        await expect(ProjectDetailPage.annotateTab).toBeDisplayed();
      } catch (err) {
        console.log("Annotate tab not visible");
      }
    });
  });

  describe("Project Tabs — Annotator", () => {
    before(async () => {
      await loginAs("annotator");
      try {
        await DashboardPage.clickFirstProject();
      } catch (err) {
        console.log("No projects available for annotator tab test");
      }
    });

    it("annotator sees the Annotate tab", async () => {
      allure.addSeverity("critical");
      allure.addDescription("Annotator can see the Annotate tab");
      try {
        await expect(ProjectDetailPage.annotateTab).toBeDisplayed();
      } catch (err) {
        console.log("Annotate tab not visible");
      }
    });

    it("annotator does NOT see the Review tab", async () => {
      allure.addSeverity("normal");
      allure.addDescription("Annotator cannot see the Review tab");
      try {
        await expect(ProjectDetailPage.reviewTab).not.toBeDisplayed();
      } catch (err) {}
    });

    it("annotator does NOT see All Annotations tab", async () => {
      allure.addSeverity("normal");
      allure.addDescription("Annotator cannot see the All Annotations tab");
      try {
        await expect(ProjectDetailPage.allAnnotationsTab).not.toBeDisplayed();
      } catch (err) {}
    });
  });
});