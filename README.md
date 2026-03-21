# Data Annotation Platform - Frontend

A React 18 + Vite frontend for a multi-role data annotation platform supporting text and image annotation with multi-level review workflow.

## Features

- **Multi-Role Interface**: Role-based UI for Admin, PM, Reviewer, Annotator
- **Review Workflow**: "START REVIEWING" button flow with task IDs
- **Text Annotation**: Span-based text annotation with labels
- **Image Annotation**: Bounding boxes, polygons, keypoints, segmentation
- **Resource Pool UI**: PM-managed resource pools
- **Reviewer Chain**: Multi-level reviewer assignment

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Quick Start

### 1. Install Dependencies

```bash
cd labelling_platform_frontend
npm install
```

### 2. Configure API URL

Create `.env` file:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

## Project Structure

```
labelling_platform_frontend/
├── public/                   # Static assets
├── src/
│   ├── components/           # Reusable components
│   │   ├── auth/            # Auth components (ProtectedRoute, RoleBasedRoute)
│   │   ├── common/          # Common UI (Modal, ConfirmModal, LoadingSpinner)
│   │   ├── layout/          # Layout components
│   │   ├── projects/        # Project management (ProjectForm, LabelEditor)
│   │   └── text-annotation/ # Text annotation workspace components
│   ├── contexts/            # React contexts (AuthContext)
│   ├── features/            # Feature-based modules
│   │   ├── text-annotation/ # Text annotation feature
│   │   └── image-annotation/# Image annotation feature
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page components
│   ├── services/            # API service modules
│   └── utils/               # Utility functions
├── docs/                    # Documentation
└── package.json
```

## User Roles & Views

| Role | Views |
|------|-------|
| `admin` | User Management, All Projects, All Annotations |
| `project_manager` | Project Management, Team Assignment, Resource Pool |
| `reviewer` | Review Queue with START REVIEWING button |
| `annotator` | Annotation Workspace, My Rejected |

## Review Workflow

### For Reviewers:
1. Navigate to Project → Annotations tab
2. See "START REVIEWING" button with pending count
3. Click to load first annotation
4. View Task ID, annotator, and annotation details
5. Approve, Reject (with comment), or Skip

### For Annotators with Rejected Work:
1. Go to "My Rejected" tab
2. See rejected annotations with reviewer comments
3. Click Edit to fix issues
4. Resubmit for review

## Services

| Service | Purpose |
|---------|---------|
| `api.jsx` | Axios instance configuration |
| `authService.jsx` | Login, logout, token management |
| `projectService.js` | Project CRUD |
| `assignmentService.js` | Team assignments |
| `textResourceService.js` | Text resource management |
| `textAnnotationService.js` | Text annotation API |
| `imageResourceService.js` | Image resource management |
| `imageAnnotationService.js` | Image annotation API |
| `annotationTaskService.js` | Pool-based tasks |
| `reviewTaskService.js` | Review task management |

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Authentication |
| Dashboard | `/` | Role-based dashboard |
| ProjectList | `/projects` | List all projects |
| ProjectDetail | `/projects/:id` | Project settings, tabs |
| UserManagement | `/users` | Admin: Manage users |
| Profile | `/profile` | User profile |
| AnnotationTaskPage | `/projects/:id/tasks/:taskId` | Pool-based annotation |

## Development

### Run Linter

```bash
npm run lint
```

### Preview Production Build

```bash
npm run preview
```

## Testing

The frontend includes a comprehensive enterprise-grade test suite with E2E (WebdriverIO) and unit tests (Jest).

### Setup

**1. Install test dependencies:**
```bash
cd labelling_platform_frontend/tests
npm install
```

**2. Ensure backend is running on port 8001:**
```bash
cd ../../labelling_platform_backend
uvicorn app.main:app --port 8001
```

**3. Ensure frontend is running on port 5173:**
```bash
cd ../labelling_platform_frontend
npm run dev
```

**4. Seed test users (one-time setup):**
```bash
cd tests
EXISTING_ADMIN_EMAIL=your_admin@example.com EXISTING_ADMIN_PASSWORD=YourPassword \
  npm run seed:test-users -- --with-existing-admin
```

### Run Tests

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

### View Test Reports

**Allure report:**
```bash
cd tests
npm run allure:report
```

This starts a server on port 8765. Open **http://localhost:8765** in your browser.

### Clean Up Test Users

After testing, remove test users:
```bash
cd tests
npm run clean:test-users
```

### Test Structure

```
tests/
├── package.json              # Test dependencies and scripts
├── jest.config.js            # Jest configuration
├── .env.test                 # Test environment variables
├── unit/                     # Jest unit/component tests
│   ├── __mocks__/            # Mock files
│   └── components/           # Component tests
├── wdio/                     # WebdriverIO E2E tests
│   ├── wdio.conf.js          # Local config
│   ├── wdio.conf.ci.js       # CI config
│   ├── pages/                # Page Object Models
│   └── specs/                # Test specifications
└── scripts/                  # Test utilities
```

For detailed testing documentation, see [tests/README.md](tests/README.md).

## License

MIT License
