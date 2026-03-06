# Changelog

All notable changes to the Labelling Platform frontend will be documented in this file.

---

## [2026.03.06] - March 6, 2026

### Bug Fixes

#### Resource Pool Lock Synchronization (Backend Fix)
- **Fixed:** Lock not being re-acquired after admin releases it
  - Backend fix that synchronizes `annotation_tasks` and resource `pool_status` tables
  - When admin releases a lock via Resource Pool UI, both the resource and the annotation task are now properly released
  - Annotators can now successfully reclaim resources after locks are released by admins
  - No frontend changes required - fix was in backend API endpoints

---

## [2026.03.02] - March 2, 2026

### Bug Fixes

#### Image Annotation
- **Fixed:** Unable to add shapes (bounding box, polygon, etc.) in image annotation
  - Issue was caused by missing database columns on the backend
  - Frontend was correctly sending requests, but backend returned 500 error
  - Fixed by backend migration `migration_add_review_lock_columns.py`

#### Text Annotation
- **Fixed:** Text annotation would have similar issues due to same database column missing
  - Backend migration fixed both `image_annotations` and `text_annotations` tables

---

## [Unreleased]

### Added
- Comprehensive documentation restructure

### Changed
- **Reviewer Edit Support**: Frontend now supports reviewer direct editing
  - ReviewPanel allows reviewers to edit annotations directly
  - ImageAnnotationWorkspace supports reviewer shape editing
  - TextAnnotationEditor supports reviewer span editing

---

## [2026.03] - March 2026

### Added

#### Backend Integration
- Support for Redis queue system (backend feature, frontend compatible)
- Queue status polling improvements

### Changed

#### Reviewer Permissions
- Reviewers can now directly edit annotations in ReviewPanel
- Edit buttons shown for reviewers on rejected/draft annotations
- Status automatically resets to draft when reviewer edits

---

## [2026.02] - February 2026

### Bug Fixes

#### Text Annotation
- **Fixed:** HighlightableTextArea not updating spans correctly
- **Fixed:** LabelPalette not respecting classification type
- **Fixed:** AnnotationList pagination issues
- **Fixed:** EditAnnotationForm not loading existing data

#### Image Annotation
- **Fixed:** BoundingBoxShape resize handles not working
- **Fixed:** PolygonShape points not draggable
- **Fixed:** ImageCanvas zoom/pan issues
- **Fixed:** ShapeList selection sync

#### Authentication
- **Fixed:** Token refresh not persisting
- **Fixed:** ProtectedRoute redirect loop
- **Fixed:** RoleBasedRoute not checking role hierarchy

#### General
- **Fixed:** Modal close on escape key
- **Fixed:** Form validation display issues
- **Fixed:** Loading states not showing

---

## [2026.01] - January 2026

### Added

#### Image Annotation System
- ImageAnnotationWorkspace component
- ImageCanvas with zoom/pan
- BoundingBoxShape component
- PolygonShape component
- KeypointShape component
- SegmentationShape component
- AnnotationToolbar with tools
- ShapeList management
- ImageResourceList and ImageUploader

#### Text Annotation Improvements
- Batch workflow with pending spans
- HighlightableTextArea component
- LabelPalette with custom colors
- ReviewPanel for reviewers
- RejectedAnnotations view
- AllAnnotationsDashboard

#### Custom Labels
- LabelEditor component
- ColorPicker component
- Project-specific label configuration

### Changed

#### Component Organization
- Moved annotation features to `features/` directory
- Created hooks for data management
- Improved service layer organization

#### UI Improvements
- Consistent styling with Tailwind
- Better loading states
- Improved error handling
- Keyboard shortcuts

---

## [2025.12] - December 2025

### Added

#### Core Components
- Layout component with navigation
- Modal and ConfirmModal
- LoadingSpinner
- ProtectedRoute and RoleBasedRoute

#### Pages
- Dashboard
- Login
- ProjectList
- ProjectDetail
- UserManagement
- Profile

#### Text Annotation (Initial)
- TextAnnotationWorkspace
- TextAnnotationEditor
- ResourceList and ResourceUploader
- AnnotationList
- QueueStatus

#### Services
- authService
- projectService
- userService
- assignmentService
- textAnnotationService
- textResourceService

#### State Management
- AuthContext for authentication
- Custom hooks pattern

---

## Component History

| Component | Added | Last Updated |
|-----------|-------|--------------|
| Layout | 2025.12 | 2026.01 |
| Modal | 2025.12 | 2026.01 |
| ProtectedRoute | 2025.12 | 2026.02 |
| TextAnnotationWorkspace | 2025.12 | 2026.01 |
| TextAnnotationEditor | 2025.12 | 2026.02 |
| ImageAnnotationWorkspace | 2026.01 | 2026.03.02 |
| ImageCanvas | 2026.01 | 2026.02 |
| BoundingBoxShape | 2026.01 | 2026.02 |
| ReviewPanel | 2026.01 | 2026.02 |

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 2026.03.02 | Mar 2, 2026 | Bug fix for image annotation shapes |
| 2026.02 | Feb 2026 | Bug fixes and stability |
| 2026.01 | Jan 2026 | Image annotation, custom labels |
| 2025.12 | Dec 2025 | Initial release |
