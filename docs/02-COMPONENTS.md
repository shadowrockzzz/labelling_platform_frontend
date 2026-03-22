# Components

**Last Updated:** March 22, 2026

---

## Table of Contents

1. [Component Hierarchy](#component-hierarchy)
2. [Common Components](#common-components)
3. [Auth Components](#auth-components)
4. [Layout Components](#layout-components)
5. [Project Components](#project-components)
6. [Task Components](#task-components)

---

## Component Hierarchy

```
App
├── AuthProvider
│   └── Router
│       ├── ProtectedRoute
│       │   └── Layout
│       │       ├── Dashboard
│       │       ├── ProjectList
│       │       ├── ProjectDetail
│       │       │   └── MyRejectedTasks (annotators only)
│       │       ├── UserManagement
│       │       └── Profile
│       └── Login
```

---

## Common Components

### Modal

Reusable modal dialog component.

```jsx
import Modal from '@/components/common/Modal';

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Confirm Action"
>
  <p>Are you sure?</p>
</Modal>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | false | Controls modal visibility |
| `onClose` | function | - | Called when modal closes |
| `title` | string | - | Modal header title |
| `children` | node | - | Modal content |

### ConfirmModal

Confirmation dialog with actions.

```jsx
import ConfirmModal from '@/components/common/ConfirmModal';

<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Item"
  message="This action cannot be undone"
  confirmText="Delete"
  confirmStyle="danger"
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | false | Controls visibility |
| `onClose` | function | - | Called on cancel |
| `onConfirm` | function | - | Called on confirm |
| `title` | string | - | Dialog title |
| `message` | string | - | Confirmation message |
| `confirmText` | string | "Confirm" | Confirm button text |
| `confirmStyle` | string | "primary" | Button style (primary/danger) |

### LoadingSpinner

Loading indicator component.

```jsx
import LoadingSpinner from '@/components/common/LoadingSpinner';

<LoadingSpinner size="lg" />
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | string | "md" | Size (sm/md/lg) |

---

## Auth Components

### ProtectedRoute

Wraps routes requiring authentication.

```jsx
import ProtectedRoute from '@/components/auth/ProtectedRoute';

<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

**Behavior:**
- Redirects to `/login` if not authenticated
- Checks token validity
- Renders children if authenticated

### RoleBasedRoute

Restricts access based on user role.

```jsx
import RoleBasedRoute from '@/components/auth/RoleBasedRoute';

<Route element={<RoleBasedRoute allowedRoles={['admin', 'reviewer']} />}>
  <Route path="/review" element={<ReviewTaskWorkspace />} />
</Route>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `allowedRoles` | string[] | Required roles |

**Role Hierarchy:**
```
admin > project_manager > reviewer > annotator
```

---

## Layout Components

### Layout

Main application layout with navigation.

```jsx
import Layout from '@/components/layout/Layout';

<Layout>
  <Outlet />
</Layout>
```

**Features:**
- Responsive sidebar navigation
- Header with user menu
- Breadcrumb navigation
- Footer

**Navigation Items:**
| Item | Route | Required Role |
|------|-------|---------------|
| Dashboard | `/dashboard` | Any |
| Projects | `/projects` | Any |
| Users | `/users` | admin |
| Profile | `/profile` | Any |

---

## Project Components

### ProjectForm

Form for creating/editing projects.

```jsx
import ProjectForm from '@/components/projects/ProjectForm';

<ProjectForm
  project={existingProject}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `project` | object | Existing project (for edit) |
| `onSubmit` | function | Form submit handler |
| `onCancel` | function | Cancel handler |

**Fields:**
- Name (required)
- Description
- Annotation Type (text/image)
- Configuration (dynamic based on type)

### LabelEditor

Editor for custom labels.

```jsx
import LabelEditor from '@/components/projects/LabelEditor';

<LabelEditor
  labels={labels}
  onChange={setLabels}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `labels` | array | Custom labels |
| `onChange` | function | Labels change handler |

**Label Structure:**
```js
{
  name: "PERSON",
  color: "#FF5733"
}
```

### ColorPicker

Color selection component.

```jsx
import ColorPicker from '@/components/projects/ColorPicker';

<ColorPicker
  value={color}
  onChange={setColor}
/>
```

---

## Task Components

### MyRejectedTasks

Shows annotators their rejected tasks that need correction.

```jsx
import { MyRejectedTasks } from '@/components/tasks';

<MyRejectedTasks 
  projectId={projectId}
  annotationType="text"  // or "image"
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `projectId` | number | Project ID |
| `annotationType` | string | "text" or "image" |

**Features:**
- Lists all rejected tasks for the current annotator
- Shows resource name, rejection date, and review comment
- "Resume" button to continue working on a rejected task
- "Skip" button to move task to backlog for later
- Empty state with helpful message when no rejected tasks

**Usage in ProjectDetail:**
- Visible as "My Rejections" tab for annotators only
- Shows count badge with number of pending rejected tasks

### BacklogManagement

Admin/PM view for managing skipped-rejected tasks.

```jsx
import { BacklogManagement } from '@/components/tasks';

<BacklogManagement 
  projectId={projectId}
  annotationType="text"  // or "image"
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `projectId` | number | Project ID |
| `annotationType` | string | "text" or "image" |

**Features:**
- Lists all tasks in the backlog (skipped-rejected tasks)
- Shows task ID, resource name, annotator, and skip date
- "Release" button to return task to available pool
- "Delete" button to soft-delete a task
- Empty state when no tasks in backlog

**Access Control:**
- Only visible to admin and project_manager roles

---

## Next Steps

- [03-TEXT-ANNOTATION.md](03-TEXT-ANNOTATION.md) - Text annotation components
- [04-IMAGE-ANNOTATION.md](04-IMAGE-ANNOTATION.md) - Image annotation components