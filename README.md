# LabelBox Clone Frontend

A modern React-based frontend for an annotation platform with role-based authentication and team management.

## Features

- **Modern UI/UX**
  - Beautiful, professional design inspired by Linear/Notion
  - Responsive layout for mobile, tablet, and desktop
  - Smooth animations and transitions
  - Tailwind CSS for styling

- **Authentication**
  - JWT-based authentication with auto-refresh
  - Auto-logout after 15 minutes of inactivity
  - Protected routes and role-based access control
  - Password visibility toggle

- **User Experience**
  - Real-time form validation
  - Loading states and skeletons
  - Toast notifications
  - Error boundaries

- **Role-Based Interface**
  - Admin: Full access to user management
  - Project Manager: Project and team management
  - Reviewer: Review interface
  - Annotator: Annotation interface

- **Text Annotation**
  - Custom label support with hex colors
  - Multiple annotation sub-types (NER, POS, Sentiment, etc.)
  - Interactive label palette
  - Real-time annotation editing
  - Queue-based resource management

## Tech Stack

- **Framework**: React 18.2.0
- **Routing**: React Router v6.20.0
- **HTTP Client**: Axios 1.6.0
- **Forms**: React Hook Form 7.48.0
- **Styling**: Tailwind CSS 3.3.6
- **Icons**: Lucide React 0.300.0
- **Notifications**: React Hot Toast 2.4.1
- **Build Tool**: Vite 5.0.8

## Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup Steps

1. **Navigate to frontend directory**
   ```bash
   cd labelling_platform_frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file if needed (optional, defaults are set)
   echo "VITE_API_URL=http://localhost:8000/api/v1" > .env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── auth/                    # Authentication components
│   │   ├── ProtectedRoute.js
│   │   └── RoleBasedRoute.js
│   ├── common/                 # Reusable components
│   │   ├── ConfirmModal.jsx
│   │   ├── LoadingSpinner.js
│   │   └── Modal.jsx
│   ├── layout/                # Layout components
│   │   └── Layout.js
│   ├── projects/              # Project management components
│   │   ├── ProjectForm.jsx
│   │   ├── ColorPicker.jsx
│   │   └── LabelEditor.jsx
│   └── text-annotation/       # Text annotation components
│       ├── TextAnnotationEditor.jsx
│       ├── TextAnnotationWorkspace.jsx
│       ├── AnnotationList.jsx
│       ├── ResourceList.jsx
│       ├── ResourceUploader.jsx
│       ├── QueueStatus.jsx
│       └── ReviewPanel.jsx
├── contexts/                  # React contexts
│   └── AuthContext.js
├── features/                  # Feature-specific components
│   └── text-annotation/
│       ├── constants.js
│       └── components/
│           ├── LabelPalette.jsx
│           └── HighlightableTextArea.jsx
├── hooks/                    # Custom React hooks
│   ├── useTextAnnotations.js
│   └── useTextResources.js
├── pages/                    # Page components
│   ├── Login.js
│   ├── Dashboard.js
│   ├── ProjectList.jsx
│   ├── ProjectDetail.jsx
│   ├── UserManagement.jsx
│   └── Profile.jsx
├── services/                 # API service layer
│   ├── api.jsx
│   ├── authService.jsx
│   ├── userService.js
│   ├── projectService.js
│   ├── assignmentService.js
│   ├── textAnnotationService.js
│   └── textResourceService.js
├── utils/                    # Helper functions
│   ├── constants.js
│   └── roleHelpers.jsx
├── App.jsx                   # Main app component with routing
├── main.jsx                  # React entry point
└── index.css                 # Global styles and Tailwind
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## API Integration

The frontend uses axios with automatic token handling:

- **Request Interceptor**: Adds JWT token to all requests
- **Response Interceptor**: Handles token refresh automatically
- **Error Handling**: Centralized error handling with user-friendly messages

## Authentication Flow

1. User enters credentials on login page
2. Frontend sends POST to `/api/v1/auth/login`
3. Backend validates and returns JWT tokens
4. Tokens stored in localStorage
5. Auto-refresh on token expiration
6. Auto-logout after 15 minutes of inactivity

## Role-Based Access

Routes are protected using:
- `ProtectedRoute`: Requires authentication
- `RoleBasedRoute`: Requires specific roles

Available roles:
- `admin`: Full system access
- `project_manager`: Manage projects and teams
- `reviewer`: Review annotations
- `annotator`: Create annotations

## Styling

The project uses Tailwind CSS with custom theme:

- **Primary Colors**: Blue-500 to Blue-700
- **Secondary Colors**: Purple-500 to Purple-700
- **Success**: Green-500
- **Error**: Red-500
- **Warning**: Yellow-500

Custom components are defined in `index.css`:
- `.btn-primary`: Primary button style
- `.btn-secondary`: Secondary button style
- `.input-field`: Input field style
- `.card`: Card container style
- `.badge-*`: Role badge styles

## Development Tips

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.jsx`
3. Update navigation in `src/components/layout/Layout.jsx`
4. Add protected route wrapper if needed

### Custom Labels Feature

The frontend supports custom labels for text annotation projects:

**ColorPicker Component** (`src/components/projects/ColorPicker.jsx`)
- Native browser color picker for full color spectrum
- Hex color input with validation
- Real-time color preview
- Clean, simplified interface

**LabelEditor Component** (`src/components/projects/LabelEditor.jsx`)
- Toggle between default and custom labels
- Add/remove labels dynamically (1-20 labels)
- Edit label names and colors
- Visual validation feedback
- Auto-capitalizes label names
- Preserves label selection when re-editing projects

**LabelPalette Component** (`src/features/text-annotation/components/LabelPalette.jsx`)
- Displays project-specific labels
- Shows custom labels with configured colors
- "Custom" badge for custom labels
- Automatic text color contrast calculation

**Usage:**
1. Admin/Manager creates project with text annotation type
2. Select annotation sub-type (NER, POS, Sentiment, etc.)
3. Choose "Use Custom Labels" in Label Palette Configuration
4. Add labels with custom colors (1-20 labels)
5. Annotators see custom labels in annotation workspace

**Supported Sub-Types:**
- `ner` - Named Entity Recognition
- `pos` - Part-of-Speech Tagging
- `sentiment` - Sentiment Analysis
- `span` - Span Annotation
- `relation` - Relation Extraction
- `classification` - Text Classification
- `dependency` - Dependency Parsing
- `coreference` - Coreference Resolution

See [docs/CUSTOM_LABELS_FEATURE.md](../labelling_platform_backend/docs/CUSTOM_LABELS_FEATURE.md) for detailed documentation.

### Adding New API Endpoints

1. Add service function in `src/services/`
2. Use the `api` instance for automatic token handling
3. Handle errors appropriately

### Customizing Styles

1. Modify `tailwind.config.js` for theme customization
2. Add custom components in `src/index.css`
3. Use Tailwind utility classes throughout

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Code splitting with React Router
- Lazy loading components (can be added)
- Optimized production build with Vite
- Tree shaking enabled

## Security Features

- JWT token storage in localStorage
- Automatic token refresh
- Auto-logout on inactivity
- Role-based route protection
- XSS protection with React

## Troubleshooting

### CORS Issues
Ensure backend CORS is configured to allow frontend URL in `BACKEND_CORS_ORIGINS`

### Token Not Refreshing
Check browser localStorage and ensure refresh token is stored correctly

### Login Fails
- Verify backend is running on correct port
- Check network tab for error details
- Verify API_URL in .env

### Labels Not Appearing in Annotation Workspace
- Verify project was saved with custom labels
- Check `useCustomLabels` flag in project config
- Refresh the annotation workspace
- Check browser console for errors

### Color Picker Not Working
- Ensure browser supports native color picker
- Try clicking the color preview box
- Check for JavaScript errors in console

### Label Editor Issues
- Verify you have Admin or Project Manager role
- Check that text annotation type is selected
- Ensure annotation sub-type is chosen
- Try reloading the page

## Production Deployment

### Build for Production

```bash
npm run build
```

### Deploy

The build output is in `dist/` directory. Deploy to any static hosting:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Nginx

### Environment Variables for Production

Set `VITE_API_URL` to your production API endpoint.

## Contributing

1. Follow existing code style
2. Use functional components and hooks
3. Add comments for complex logic
4. Test responsive design
5. Ensure accessibility

## License

MIT

## Support

For issues and questions, please open an issue on the repository.