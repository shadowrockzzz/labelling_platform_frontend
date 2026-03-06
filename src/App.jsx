import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ProtectedRoute, RoleBasedRoute } from './components/auth';
import { ROLES } from './utils/constants';

// Pages
import { Login } from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { UserManagement } from './pages/UserManagement.jsx';
import { ProjectList } from './pages/ProjectList.jsx';
import { ProjectDetail } from './pages/ProjectDetail.jsx';
import { Profile } from './pages/Profile.jsx';
import AnnotationTaskPage from './pages/AnnotationTaskPage';

// Components
import { Layout } from './components/layout/Layout.jsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
            success: {
              style: {
                borderLeft: '4px solid #22c55e',
              },
            },
            error: {
              style: {
                borderLeft: '4px solid #ef4444',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
              // <Layout />
            }
          >
            <Route index element={<Navigate to="/login" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Admin-only routes */}
            <Route
              path="admin/users"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.ADMIN]}>
                  <UserManagement />
                </RoleBasedRoute>
              }
            />
            
            {/* Projects routes */}
            <Route path="projects" element={<ProjectList />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="projects/:projectId/tasks" element={<AnnotationTaskPage />} />
            
            {/* Profile */}
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* Catch all */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600 mb-4">Page not found</p>
                  <a
                    href="/dashboard"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Go to Dashboard
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;