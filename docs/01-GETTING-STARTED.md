# Getting Started Guide - Frontend

**Last Updated:** March 1, 2026

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Development Server](#development-server)
4. [Project Structure](#project-structure)
5. [Development Workflow](#development-workflow)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 18+ | JavaScript runtime |
| npm | 9+ | Package manager |

### Verify Prerequisites

```bash
node --version  # Should be 18 or higher
npm --version   # Should be 9 or higher
```

---

## Installation

### 1. Navigate to Frontend Directory

```bash
cd labelling_platform_frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## Development Server

### Start Development Server

```bash
npm run dev
```

The application will be available at http://localhost:5173

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## Project Structure

```
labelling_platform_frontend/
├── public/                   # Static assets
│   └── vite.svg
├── src/
│   ├── components/          # Reusable components
│   │   ├── auth/           # Authentication
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── RoleBasedRoute.jsx
│   │   │   └── index.js
│   │   ├── common/         # Common UI
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── Modal.jsx
│   │   ├── layout/         # Layout
│   │   │   └── Layout.jsx
│   │   ├── projects/       # Project management
│   │   │   ├── ColorPicker.jsx
│   │   │   ├── LabelEditor.jsx
│   │   │   └── ProjectForm.jsx
│   │   └── text-annotation/# Text annotation
│   │       ├── AllAnnotationsDashboard.jsx
│   │       ├── AnnotationList.jsx
│   │       ├── EditAnnotationForm.jsx
│   │       ├── QueueStatus.jsx
│   │       ├── RejectedAnnotations.jsx
│   │       ├── ResourceList.jsx
│   │       ├── ResourceUploader.jsx
│   │       ├── ReviewPanel.jsx
│   │       ├── TextAnnotationEditor.jsx
│   │       └── TextAnnotationWorkspace.jsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.jsx
│   ├── features/           # Feature modules
│   │   ├── image-annotation/
│   │   │   ├── components/
│   │   │   ├── constants.js
│   │   │   └── index.js
│   │   └── text-annotation/
│   │       ├── components/
│   │       └── constants.js
│   ├── hooks/              # Custom hooks
│   │   ├── useTextAnnotations.js
│   │   └── useTextResources.js
│   ├── pages/              # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Profile.jsx
│   │   ├── ProjectDetail.jsx
│   │   ├── ProjectList.jsx
│   │   └── UserManagement.jsx
│   ├── services/           # API services
│   │   ├── api.jsx
│   │   ├── authService.jsx
│   │   ├── assignmentService.js
│   │   ├── imageAnnotationService.js
│   │   ├── imageResourceService.js
│   │   ├── projectService.js
│   │   ├── textAnnotationService.js
│   │   ├── textResourceService.js
│   │   └── userService.js
│   ├── utils/              # Utilities
│   │   ├── constants.js
│   │   └── roleHelpers.jsx
│   ├── App.jsx             # Main app component
│   ├── index.css           # Global styles
│   └── main.jsx            # Entry point
├── docs/                   # Documentation
├── index.html              # HTML template
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## Development Workflow

### Adding a New Page

1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/layout/Layout.jsx`

### Adding a New Component

1. Create component file in appropriate directory
2. Export from index.js if needed
3. Import and use where required

### Adding a New API Service

1. Create service file in `src/services/`
2. Use base `api.jsx` for axios instance
3. Export functions for API calls

### Code Style

The project uses ESLint for code quality:

```bash
npm run lint
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

#### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

#### API Connection Errors

1. Check backend is running on port 8000
2. Verify `VITE_API_BASE_URL` in `.env`
3. Check CORS settings on backend

#### Authentication Issues

1. Clear localStorage: `localStorage.clear()`
2. Re-login to get fresh tokens

---

## Next Steps

- [02-COMPONENTS.md](02-COMPONENTS.md) - Component documentation
- [03-TEXT-ANNOTATION.md](03-TEXT-ANNOTATION.md) - Text annotation features
- [04-IMAGE-ANNOTATION.md](04-IMAGE-ANNOTATION.md) - Image annotation features