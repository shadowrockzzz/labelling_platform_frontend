# Frontend Documentation

This directory contains documentation specific to the React frontend.

## Files

### FEATURE_GUIDE.md
Comprehensive guide covering all frontend features including:
- Text Annotation System
- Annotation Sub-Types (NER, POS, Sentiment, etc.)
- Project Management
- User Management
- Queue Management
- Common features and best practices

## When to Use This Guide

- **Feature Development:** Reference FEATURE_GUIDE.md for feature specifications
- **Component Development:** See implementation details for each feature
- **User Flow Documentation:** Understand how users interact with the application
- **Troubleshooting:** Component-level troubleshooting tips

## Quick Reference

**Start Frontend Dev Server:**
```bash
cd labelling_platform_frontend
npm install
npm run dev
```

**Build for Production:**
```bash
npm run build
```

**Run Tests:**
```bash
npm test
```

## Key Features Documented

### Text Annotation System
- Annotation types and sub-types
- Annotation lifecycle (Draft → Submitted → Reviewed)
- Resource upload and management
- S3/MinIO storage integration

### User Interface Components
- TextAnnotationEditor
- AnnotationList
- TextAnnotationWorkspace
- ResourceUploader
- ReviewPanel
- QueueStatus

### User Roles & Permissions
- Admin, Project Manager, Reviewer, Annotator
- Role-based UI rendering
- Permission checks

## Important Notes

- Frontend communicates with backend via REST API
- JWT tokens used for authentication (stored in localStorage)
- Auto-refresh mechanism for tokens
- Role-based route protection implemented
- Uses React 18 with Hooks
- Styled with Tailwind CSS
- Built with Vite for fast development

## Recent Updates

### Classification Type Configuration (February 3, 2026)
- Project configuration now includes classification type selector
- Three classification types supported:
  - **Binary**: 2 classes, mutually exclusive selection
  - **Multi-Class**: 3+ classes, mutually exclusive selection
  - **Multi-Label**: 3+ classes, can select multiple labels simultaneously
- LabelPalette automatically adapts behavior based on project's classification type
- TextAnnotationEditor displays classification type configuration
- Eliminates need to manually configure classification type for each annotation
- Classification type is stored in project config and applied project-wide

### S3/MinIO Integration (February 2, 2026)
- Text content now displays properly from S3 storage
- File uploads work with MinIO (development) and AWS S3 (production)
- File download implemented for annotation workflow
- See FEATURE_GUIDE.md for detailed S3 integration

## Need More Help?

- **Frontend README:** `../README.md`
- **Backend Documentation:** `../labelling_platform_backend/docs/`
- **Main Project Setup:** `../labelling_platform_backend/docs/SETUP_GUIDE.md`
- **API Documentation:** `http://localhost:8000/docs`

## Related Documentation

- **Backend Docs:** `../labelling_platform_backend/docs/README.md`
- **Bug Fixes:** `../labelling_platform_backend/docs/BUG_FIX_LOG.md`
- **Getting Started:** `../labelling_platform_backend/docs/GETTING_STARTED.md`