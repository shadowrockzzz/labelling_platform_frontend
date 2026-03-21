I # Frontend Test Suite

Enterprise-grade test suite for the Labelling Platform frontend.

## Tech Stack

- **WebdriverIO** — E2E browser automation
- **Jest** — Unit/component test runner
- **@testing-library/react** — React component testing utilities
- **Mocha** — Test framework for WebdriverIO
- **Allure** — Rich HTML test reports
- **Chromedriver** — Chrome browser automation

## Quick Start

### Prerequisites

1. Node.js 18+
2. Chrome browser installed
3. Backend API running on port 8001
4. Frontend dev server running on port 5173

### One-Time Setup

**1. Install test dependencies:**
```bash
cd labelling_platform_frontend/tests
npm install
```

**2. Ensure backend is running:**
```bash
cd ../../labelling_platform_backend
uvicorn app.main:app --port 8001
```

**3. Ensure frontend is running:**
```bash
cd ../labelling_platform_frontend
npm run dev
```

### Running Tests

**E2E Tests (WebdriverIO):**
```bash
cd tests
npm run test:e2e           # Local Chrome (headless)
npm run test:e2e:ci        # CI mode with JUnit reporter
```

**Unit Tests (Jest):**
```bash
cd tests
npm run test:unit          # Run all unit tests
npm run test:unit:watch    # Watch mode
```

**All Tests:**
```bash
npm run test:all
```

**View Allure Report:**
```bash
npm run allure:report
```

This will:
1. Generate the Allure report from test results
2. Start a local web server on port 8765
3. Open **http://localhost:8765** in your browser to view the interactive report

> **Note:** Press `Ctrl+C` to stop the report server when done.

## Test Structure

```
tests/
├── package.json              # Test dependencies and scripts
├── jest.config.js            # Jest configuration for unit tests
├── .env.test                 # Test environment variables
├── unit/                     # Jest unit/component tests
│   ├── __mocks__/            # Mock files for CSS, images, etc.
│   │   ├── styleMock.js
│   │   └── fileMock.js
│   └── components/           # Component tests
│       ├── AllAnnotationsList.test.jsx
│       └── ReviewTaskWorkspace.test.jsx
├── wdio/                     # WebdriverIO E2E tests
│   ├── wdio.conf.js          # Local development config
│   ├── wdio.conf.ci.js       # CI-specific config
│   ├── pages/                # Page Object Models
│   │   ├── LoginPage.js
│   │   ├── DashboardPage.js
│   │   └── ProjectDetailPage.js
│   ├── specs/                # Test specifications
│   │   ├── auth/             # Authentication tests
│   │   │   └── login.spec.js
│   │   ├── rbac/             # Role-based access tests
│   │   │   └── roleBasedVisibility.spec.js
│   │   ├── annotation/       # Annotation workflow tests
│   │   │   └── annotatorWorkflow.spec.js
│   │   ├── review/           # Review workflow tests
│   │   │   └── reviewerWorkflow.spec.js
│   │   └── admin/            # Admin functionality tests
│   │       └── allAnnotations.spec.js
│   └── reports/              # Test output
│       └── allure-results/
└── README.md                 # This file
```

## Test Users

Four test users are expected in the backend:

| Role | Email | Password |
|------|-------|----------|
| Admin | test_admin@labelling.example.com | TestAdmin@123 |
| Project Manager | test_pm@labelling.example.com | TestPM@123 |
| Reviewer | test_reviewer@labelling.example.com | TestReviewer@123 |
| Annotator | test_annotator@labelling.example.com | TestAnnotator@123 |

## Test User Management (Seed → Test → Clean)

### Setting Admin Credentials

The seed script requires an existing admin account to create test users. You have two options:

**Option 1 - Command Line (Recommended for Security):**
```bash
EXISTING_ADMIN_EMAIL=your_admin@example.com EXISTING_ADMIN_PASSWORD=YourPassword npm run seed:test-users -- --with-existing-admin
```

**Option 2 - Add to `.env.test`:**
```env
EXISTING_ADMIN_EMAIL=your_admin@example.com
EXISTING_ADMIN_PASSWORD=YourPassword
```

Then run:
```bash
npm run seed:test-users -- --with-existing-admin
```

> **Note:** The `.env.test` file is gitignored, but command-line env vars are safer since they don't persist on disk.

### Full Test Cycle

**1. Seed Test Users:**
```bash
npm run seed:test-users -- --with-existing-admin
```

**2. Run E2E Tests:**
```bash
npm run test:e2e
```

**3. Clean Up Test Users:**
```bash
EXISTING_ADMIN_EMAIL=your_admin@example.com EXISTING_ADMIN_PASSWORD=YourPassword npm run clean:test-users
```

### One-Liner (Seed + Test + Clean)

```bash
EXISTING_ADMIN_EMAIL=your_admin@example.com EXISTING_ADMIN_PASSWORD=YourPassword \
  npm run seed:test-users -- --with-existing-admin && \
npm run test:e2e && \
EXISTING_ADMIN_EMAIL=your_admin@example.com EXISTING_ADMIN_PASSWORD=YourPassword \
  npm run clean:test-users
```

### Safety

- Only users with `@labelling.example.com` emails are deleted during cleanup
- Your existing admin account is preserved
- Test users are created with known passwords for deterministic testing

## Writing New Tests

### E2E Tests (WebdriverIO)

**Page Object Model:**
```javascript
// wdio/pages/MyPage.js
class MyPage {
  get myButton() { return $('[data-testid="my-button"]'); }
  
  async open() {
    await browser.url("/my-page");
  }
  
  async clickButton() {
    await this.myButton.click();
  }
}

module.exports = new MyPage();
```

**Test Spec:**
```javascript
// wdio/specs/myFeature.spec.js
const MyPage = require("../pages/MyPage");

describe("My Feature", () => {
  beforeEach(async () => {
    await MyPage.open();
  });

  it("should do something", async () => {
    // Act
    await MyPage.clickButton();
    
    // Assert
    await expect(MyPage.myButton).toBeDisplayed();
  });
});
```

### Unit Tests (Jest + React Testing Library)

```jsx
// unit/components/MyComponent.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import MyComponent from "../../../src/components/MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    // Arrange
    const props = { title: "Test" };
    
    // Act
    render(<MyComponent {...props} />);
    
    // Assert
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
```

## Data Test IDs

For reliable E2E selectors, components should use `data-testid` attributes:

```jsx
<button data-testid="submit-btn">Submit</button>
<input data-testid="email-input" type="email" />
```

### Required Test IDs

| Element | data-testid |
|---------|-------------|
| Login email input | `login-email-input` |
| Login password input | `login-password-input` |
| Login submit button | `login-submit-btn` |
| Dashboard heading | `dashboard-heading` |
| Project cards | `project-card` |
| Start Annotating button | `start-annotating-btn` |
| Start Reviewing button | `start-reviewing-btn` |
| Approve button | `approve-btn` |
| Reject button | `reject-btn` |

## CI Integration

Tests run automatically in GitHub Actions. See `.github/workflows/tests.yml`.

Results are uploaded as:
- JUnit XML for test status
- Allure results for rich reports
- Screenshots on failure

## Environment Variables

See `tests/.env.test` for all test configuration. Key variables:

| Variable | Description |
|----------|-------------|
| `TEST_FRONTEND_URL` | Frontend base URL |
| `TEST_API_BASE_URL` | Backend API URL |
| `TEST_ADMIN_EMAIL` | Admin user email |
| `TEST_ADMIN_PASSWORD` | Admin user password |

## Troubleshooting

**Chrome not found:**
```bash
# Install Chrome
sudo apt-get install google-chrome-stable
```

**Connection refused:**
- Ensure backend is running on port 8001
- Ensure frontend is running on port 5173

**Tests timing out:**
- Increase `waitforTimeout` in `wdio.conf.js`
- Check for slow API responses