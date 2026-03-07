# Changelog - Frontend

All notable changes to the frontend will be documented in this file.

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
- `ReviewPanel.jsx` - Multi-level review actions
- `ProjectDetail.jsx` - Resource pool management tab
- `ProjectForm.jsx` - Reviewer chain configuration

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