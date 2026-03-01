# Labelling Platform - Frontend Documentation

**Version:** 1.0.0 | **Last Updated:** March 1, 2026

---

## Overview

React-based frontend for the Labelling Platform, providing intuitive interfaces for text and image annotation workflows.

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.x | Styling |
| React Router | 6.x | Navigation |
| Axios | 1.x | HTTP client |

---

## Documentation Index

### Getting Started

| Document | Description |
|----------|-------------|
| [01-GETTING-STARTED.md](01-GETTING-STARTED.md) | Installation, setup, and development workflow |

### Architecture

| Document | Description |
|----------|-------------|
| [02-COMPONENTS.md](02-COMPONENTS.md) | Component hierarchy and common components |
| [05-STATE-MANAGEMENT.md](05-STATE-MANAGEMENT.md) | Context, hooks, and state patterns |

### Features

| Document | Description |
|----------|-------------|
| [03-TEXT-ANNOTATION.md](03-TEXT-ANNOTATION.md) | Text annotation components and workflow |
| [04-IMAGE-ANNOTATION.md](04-IMAGE-ANNOTATION.md) | Image annotation components and workflow |

### Reference

| Document | Description |
|----------|-------------|
| [CHANGELOG.md](CHANGELOG.md) | Version history and changes |

---

## Quick Start

```bash
# Navigate to frontend directory
cd labelling_platform_frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

---

## Project Structure

```
labelling_platform_frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── auth/           # Authentication components
│   │   ├── common/         # Common UI components
│   │   ├── layout/         # Layout components
│   │   ├── projects/       # Project management
│   │   └── text-annotation/# Text annotation
│   ├── features/           # Feature-based modules
│   │   ├── text-annotation/
│   │   └── image-annotation/
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React contexts
│   ├── pages/              # Page components
│   ├── services/           # API services
│   └── utils/              # Utility functions
├── docs/                   # Documentation
├── public/                 # Static assets
└── package.json
```

---

## Key Features

### Authentication
- JWT-based authentication
- Role-based route protection
- Automatic token refresh

### Text Annotation
- 8 annotation sub-types
- Batch workflow with pending spans
- Label palette with custom colors

### Image Annotation
- Bounding box, polygon, keypoint shapes
- Interactive canvas with zoom/pan
- Shape list management

### Review System
- Approve/reject annotations
- Review corrections workflow
- Status tracking

---

## Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

---

## Environment Variables

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## Related Documentation

- [Backend Documentation](../../labelling_platform_backend/docs/README.md)