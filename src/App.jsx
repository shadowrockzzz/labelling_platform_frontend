import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext.jsx';
// import { ProtectedRoute, RoleBasedRoute } from './components/auth';
import { ROLES } from './utils/constants';

// Pages
import { Login } from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard.jsx';

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
              // <ProtectedRoute>
              //   <Layout />
              // </ProtectedRoute>
              <Layout />
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Admin-only routes */}
            {/* <Route
              path="admin/users"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.ADMIN]}>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold mb-4">User Management</h1>
                    <p className="text-gray-600">User management page coming soon...</p>
                  </div>
                </RoleBasedRoute>
              }
            /> */}
            
            {/* Manager/Admin routes */}
            <Route
              path="projects"
              element={
                <div className="p-8">
                  <h1 className="text-2xl font-bold mb-4">Projects</h1>
                  <p className="text-gray-600">Projects page coming soon...</p>
                </div>
              }
            />
            
            {/* Profile */}
            <Route
              path="profile"
              element={
                <div className="p-8">
                  <h1 className="text-2xl font-bold mb-4">Profile</h1>
                  <p className="text-gray-600">Profile page coming soon...</p>
                </div>
              }
            />
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