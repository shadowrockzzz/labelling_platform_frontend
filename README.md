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

## License

MIT License