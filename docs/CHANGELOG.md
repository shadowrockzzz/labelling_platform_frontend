# Changelog - Frontend

All notable changes to the frontend will be documented in this file.

## [2.2.0] - 2026-03-22

### Rejected Tasks Management

#### New Components
- **MyRejectedTasks** (`src/components/tasks/MyRejectedTasks.jsx`)
  - Shows annotators their rejected tasks that need correction
  - Displays resource name, rejection date, and review comment
  - "Resume" button to start working on a rejected task
  - "Skip" button to move task to backlog
  - Supports both text and image annotation types

- **BacklogManagement** (`src/components/tasks/BacklogManagement.jsx`)
  - Admin/PM view of all skipped-rejected tasks
  - Shows task ID, resource name, annotator, and skip date
  - "Release" button to return task to available pool
  - "Delete" button to soft-delete a task

- **Tasks Index** (`src/components/tasks/index.js`)
  - Clean exports for task-related components

#### Updated Components
- **ProjectDetail.jsx**
  - Added "My Rejections" tab for annotators
  - Tab visible only to users with annotator role
  - Shows count badge with number of rejected tasks
  - Integrates `MyRejectedTasks` component

#### Updated Services
- **annotationTaskService.js**
  - `getMyRejectedTasks(projectId, projectType)` - Get annotator's rejected tasks
  - `getMyRejectedCount(projectId, projectType)` - Get rejected tasks count
  - `skipRejectedTask(taskId, projectId, projectType)` - Skip a rejected task
  - `resumeRejectedTask(taskId, projectId, projectType)` - Resume a rejected task
  - `getBacklog(projectId, projectType)` - Get backlog (Admin/PM only)
  - `releaseFromBacklog(taskId, projectId, projectType, action)` - Release from backlog

#### Features
- Annotators can view all their rejected tasks in one place
- Annotators can resume working on rejected tasks
- Annotators can skip rejected tasks to deal with later
- Admins/PMs can manage the backlog of skipped-rejected tasks
- Full support for both text and image annotation projects

#### Backend Companion
- Requires backend v2.2.0 for rejected tasks API endpoints

## [2.1.0] - 2026-03-21

### Testing Infrastructure Added

#### E2E Tests (WebdriverIO)
- **Page Object Model** pattern for maintainable selectors
- **Allure reporting** for rich HTML test reports
- **Headless Chrome** for CI execution

#### E2E Test Files Created
- `tests/wdio/pages/LoginPage.js` — Login page selectors and actions
- `tests/wdio/pages/DashboardPage.js` — Dashboard page object
- `tests/wdio/pages/ProjectDetailPage.js` — Project detail page object
- `tests/wdio/specs/auth/login.spec.js` — Login flow tests
- `tests/wdio/specs/rbac/roleBasedVisibility.spec.js` — Role-based UI tests
- `tests/wdio/specs/annotation/annotatorWorkflow.spec.js` — Annotator workflow tests
- `tests/wdio/specs/review/reviewerWorkflow.spec.js` — Reviewer workflow tests
- `tests/wdio/specs/admin/allAnnotations.spec.js` — Admin annotations tests

#### Unit Tests (Jest + React Testing Library)
- `tests/unit/components/AllAnnotationsList.test.jsx` — AllAnnotationsDashboard component tests
- `tests/unit/components/ReviewTaskWorkspace.test.jsx` — Review workspace component tests
- `tests/unit/__mocks__/` — CSS and file mocks for Jest

#### Configuration Files
- `tests/package.json` — Test dependencies and scripts
- `tests/jest.config.js` — Jest configuration for unit tests
- `tests/wdio/wdio.conf.js` — WebdriverIO local config
- `tests/wdio/wdio.conf.ci.js` — WebdriverIO CI config
- `tests/.env.test` — Test environment variables

#### Documentation
- `tests/README.md` — Comprehensive test documentation

#### CI Integration
- GitHub Actions workflow at `.github/workflows/tests.yml`
- Automated E2E and unit test runs

### Test Users Expected in Backend
| Role | Email | Password |
|------|-------|----------|
| Admin | test_admin@labelling.example.com | TestAdmin@123 |
| Project Manager | test_pm@labelling.example.com | TestPM@123 |
| Reviewer | test_reviewer@labelling.example.com | TestReviewer@123 |
| Annotator | test_annotator@labelling.example.com | TestAnnotator@123 |

## [2.0.2] - 2026-03-22

### Bug Fixes
- **Fixed annotators not seeing rejected tasks** - The "My Rejected" tab now correctly shows only the current annotator's rejected annotations
  - Updated `list_annotations` CRUD function to accept `annotator_id` filter parameter
  - Updated router endpoint to pass `annotator_id` for annotator role users
  - Annotators now see only their own rejected work; admins/PMs/reviewers see all

## [2.0.1] - 2026-03-21

### Bug Fixes
- **Fixed review level detection** - `ProjectDetail.jsx` now correctly passes `team` and `project` props to `ReviewTaskWorkspace` and `ImageReviewTaskWorkspace` components, enabling proper auto-detection of reviewer levels
- **Fixed Save button in edit mode** - `TextAnnotationEditor.jsx` now correctly initializes `pendingSpans` from various annotation data formats (`spans`, `entities`, or direct array), enabling the "Done" button when editing existing annotations

### Improvements
- Enhanced annotation data format handling in `TextAnnotationEditor` to support:
  - `annotation_data.spans` (expected format)
  - `annotation_data.entities` (NER format)
  - Direct array in `annotation_data`

## [2.0.0] - 2026-03-07

### Major Features Added

#### Review Workflow UI
- Updated `TextAnnotationWorkspace` with "START REVIEWING" button flow
- Reviewers see pending review count and click to start reviewing
- After clicking START, shows current annotation with Task ID and details
- Approve/Reject buttons with optional comments
- "Skip & Get Next" to skip current review
- Updated `ImageAnnotationWorkspace` with same review flow
- Reviewers can edit annotations before approving

#### Reviewer Chain UI
- ProjectForm updated to manage multiple reviewers with levels
- Add/remove reviewers with level assignment
- Visual indication of review order

#### Resource Pool UI (PM View)
- Resource Pool management tab in ProjectDetail
- Bulk upload for PM-provided resources
- Pool status indicators (available/locked/completed)
- Lock release functionality

#### Task Pages
- New `AnnotationTaskPage` for pool-based annotation workflow
- "Get Next Task" button for annotators
- Task status display and navigation

### Components Updated
- `TextAnnotationWorkspace.jsx` - Review queue with START REVIEWING
- `ImageAnnotationWorkspace.jsx` - Review queue with START REVIEWING
- `ReviewTaskWorkspace.jsx` - Multi-level review with auto-detected level (replaced ReviewPanel)
- `ImageReviewTaskWorkspace.jsx` - Image review with auto-detected level
- `ProjectDetail.jsx` - Resource pool management tab
- `ProjectForm.jsx` - Reviewer chain configuration

### Components Removed
- `ReviewPanel.jsx` - Replaced by `ReviewTaskWorkspace.jsx`

### Services Added
- `annotationTaskService.js` - Annotation task API calls
- `reviewTaskService.js` - Review task API calls

### Bug Fixes
- Fixed review workflow not showing START REVIEWING button
- Fixed pending review list visibility in image annotation workspace
- Added current review info panel with Task ID

## [1.0.0] - Initial Release

### Features
- React 18 + Vite setup
- TailwindCSS styling
- Authentication with JWT
- Role-based routing
- Project management
- Text annotation workspace
- Image annotation workspace
- Label management
- User management (admin)