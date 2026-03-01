# State Management

**Last Updated:** March 1, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [AuthContext](#authcontext)
3. [Custom Hooks](#custom-hooks)
4. [Local State Patterns](#local-state-patterns)
5. [API Services](#api-services)

---

## Overview

The frontend uses React's built-in state management with Context API for global state and custom hooks for feature-specific state.

### State Architecture

```
Global State (Context)
├── AuthContext
│   ├── user
│   ├── isAuthenticated
│   └── loading

Feature State (Hooks)
├── useTextAnnotations
├── useTextResources
└── Component local state

Server State (Services)
├── API calls via Axios
└── Automatic token handling
```

---

## AuthContext

### Overview

Global authentication state and methods.

```jsx
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Wrap app with provider
<AuthProvider>
  <App />
</AuthProvider>

// Use in components
const { user, isAuthenticated, login, logout } = useAuth();
```

### Context Values

| Value | Type | Description |
|-------|------|-------------|
| `user` | object \| null | Current user data |
| `isAuthenticated` | boolean | Authentication status |
| `loading` | boolean | Loading state |
| `login` | function | Login handler |
| `logout` | function | Logout handler |
| `refreshUser` | function | Refresh user data |

### Implementation

```jsx
// contexts/AuthContext.jsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    await fetchUserData();
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## Custom Hooks

### useTextAnnotations

Hook for managing text annotations.

```jsx
import useTextAnnotations from '@/hooks/useTextAnnotations';

const MyComponent = ({ projectId }) => {
  const {
    annotations,
    loading,
    error,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    submitAnnotation,
    reviewAnnotation
  } = useTextAnnotations(projectId);

  // Use the hook values and methods
};
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `annotations` | array | List of annotations |
| `loading` | boolean | Loading state |
| `error` | string \| null | Error message |
| `createAnnotation` | function | Create new annotation |
| `updateAnnotation` | function | Update annotation |
| `deleteAnnotation` | function | Delete annotation |
| `submitAnnotation` | function | Submit for review |
| `reviewAnnotation` | function | Review annotation |

### useTextResources

Hook for managing text resources.

```jsx
import useTextResources from '@/hooks/useTextResources';

const MyComponent = ({ projectId }) => {
  const {
    resources,
    loading,
    error,
    uploadResource,
    deleteResource,
    fetchResourceContent
  } = useTextResources(projectId);
};
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `resources` | array | List of resources |
| `loading` | boolean | Loading state |
| `error` | string \| null | Error message |
| `uploadResource` | function | Upload file |
| `deleteResource` | function | Delete resource |
| `fetchResourceContent` | function | Get resource content |

---

## Local State Patterns

### Batch Annotation State

```jsx
const [pendingSpans, setPendingSpans] = useState([]);
const [savedSpans, setSavedSpans] = useState([]);

// Add span
const addSpan = (span) => {
  setPendingSpans(prev => [...prev, {
    ...span,
    id: generateUniqueId()
  }]);
};

// Remove span
const removeSpan = (spanId) => {
  setPendingSpans(prev => prev.filter(s => s.id !== spanId));
};

// Submit batch
const submitBatch = async () => {
  const allSpans = [...savedSpans, ...pendingSpans];
  await createAnnotation({ spans: allSpans });
  setPendingSpans([]);
  setSavedSpans(allSpans);
};
```

### Form State Pattern

```jsx
const [formData, setFormData] = useState(initialValues);
const [errors, setErrors] = useState({});

const handleChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  setErrors(prev => ({ ...prev, [field]: null }));
};

const validate = () => {
  const newErrors = {};
  if (!formData.name) newErrors.name = 'Required';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;
  await saveData(formData);
};
```

### Selection State Pattern

```jsx
const [selectedId, setSelectedId] = useState(null);
const [selectedItem, setSelectedItem] = useState(null);

useEffect(() => {
  if (selectedId && items.length > 0) {
    setSelectedItem(items.find(item => item.id === selectedId));
  } else {
    setSelectedItem(null);
  }
}, [selectedId, items]);
```

---

## API Services

### Base API Configuration

```jsx
// services/api.jsx
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for auth
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await authService.refresh(refreshToken);
          localStorage.setItem('access_token', response.access_token);
          // Retry original request
          error.config.headers.Authorization = `Bearer ${response.access_token}`;
          return api.request(error.config);
        } catch {
          // Refresh failed, logout
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Service Pattern

```jsx
// services/textAnnotationService.js
import api from './api';

export const getAnnotations = async (projectId, params = {}) => {
  const response = await api.get(`/annotations/text/projects/${projectId}/annotations`, { params });
  return response.data;
};

export const createAnnotation = async (projectId, data) => {
  const response = await api.post(`/annotations/text/projects/${projectId}/annotations`, data);
  return response.data;
};

export const updateAnnotation = async (projectId, annotationId, data) => {
  const response = await api.put(`/annotations/text/projects/${projectId}/annotations/${annotationId}`, data);
  return response.data;
};

export const deleteAnnotation = async (projectId, annotationId) => {
  await api.delete(`/annotations/text/projects/${projectId}/annotations/${annotationId}`);
};

export const submitAnnotation = async (projectId, annotationId) => {
  const response = await api.post(`/annotations/text/projects/${projectId}/annotations/${annotationId}/submit`);
  return response.data;
};

export const reviewAnnotation = async (projectId, annotationId, action, comment) => {
  const response = await api.post(`/annotations/text/projects/${projectId}/annotations/${annotationId}/review`, {
    action,
    comment
  });
  return response.data;
};
```

---

## Error Handling

### Global Error Handler

```jsx
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return data.detail || 'Invalid request';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 422:
        return data.detail || 'Validation error.';
      default:
        return 'An unexpected error occurred.';
    }
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection.';
  } else {
    // Error setting up request
    return error.message || 'An unexpected error occurred.';
  }
};
```

---

## Next Steps

- [CHANGELOG.md](CHANGELOG.md) - Version history
- Backend [06-API-REFERENCE.md](../../labelling_platform_backend/docs/06-API-REFERENCE.md)