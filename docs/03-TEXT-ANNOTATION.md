# Text Annotation Components

**Last Updated:** March 1, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Workspace Components](#workspace-components)
3. [Editor Components](#editor-components)
4. [Review Components](#review-components)
5. [Resource Components](#resource-components)

---

## Overview

The text annotation system consists of several interconnected components for creating, editing, and reviewing text annotations.

### Component Structure

```
TextAnnotationWorkspace
├── ResourceList
│   └── ResourceUploader
├── TextAnnotationEditor
│   ├── HighlightableTextArea
│   └── LabelPalette
├── AnnotationList
├── ReviewPanel
└── QueueStatus
```

---

## Workspace Components

### TextAnnotationWorkspace

Main container for text annotation workflow.

```jsx
import TextAnnotationWorkspace from '@/components/text-annotation/TextAnnotationWorkspace';

<TextAnnotationWorkspace projectId={projectId} />
```

**Features:**
- Resource selection
- Annotation editing
- Review panel integration
- Queue status display

### AllAnnotationsDashboard

Dashboard showing all annotations across resources.

```jsx
import AllAnnotationsDashboard from '@/components/text-annotation/AllAnnotationsDashboard';

<AllAnnotationsDashboard projectId={projectId} />
```

**Features:**
- Filter by status (draft, submitted, approved, rejected)
- Filter by annotator
- Bulk actions
- Export functionality

---

## Editor Components

### TextAnnotationEditor

Main annotation editing interface.

```jsx
import TextAnnotationEditor from '@/components/text-annotation/TextAnnotationEditor';

<TextAnnotationEditor
  resource={resource}
  annotation={existingAnnotation}
  projectId={projectId}
  onSave={handleSave}
  onSubmit={handleSubmit}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `resource` | object | Text resource to annotate |
| `annotation` | object | Existing annotation (for edit) |
| `projectId` | number | Project ID |
| `onSave` | function | Save handler (draft) |
| `onSubmit` | function | Submit handler (for review) |

**State:**
```js
const [pendingSpans, setPendingSpans] = useState([]);
const [savedSpans, setSavedSpans] = useState([]);
const [selectedLabel, setSelectedLabel] = useState(null);
```

### HighlightableTextArea

Text area with highlighting and selection support.

```jsx
import HighlightableTextArea from '@/features/text-annotation/components/HighlightableTextArea';

<HighlightableTextArea
  text={text}
  spans={spans}
  onTextSelect={handleTextSelect}
  highlightColor={labelColor}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `text` | string | Full text content |
| `spans` | array | Annotated spans |
| `onTextSelect` | function | Called when text selected |
| `highlightColor` | string | Color for highlights |

**Span Structure:**
```js
{
  id: "span_abc123",
  text: "John Doe",
  label: "PERSON",
  start: 0,
  end: 8
}
```

### LabelPalette

Label selection component with custom colors.

```jsx
import LabelPalette from '@/features/text-annotation/components/LabelPalette';

<LabelPalette
  labels={labels}
  selectedLabel={selectedLabel}
  onLabelSelect={setSelectedLabel}
  classificationType="multi_class"
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `labels` | array | Available labels |
| `selectedLabel` | string | Currently selected |
| `onLabelSelect` | function | Selection handler |
| `classificationType` | string | multi_class/multi_label/binary |

### EditAnnotationForm

Form for editing existing annotations.

```jsx
import EditAnnotationForm from '@/components/text-annotation/EditAnnotationForm';

<EditAnnotationForm
  annotation={annotation}
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

---

## Review Components

### ReviewPanel

Interface for reviewing submitted annotations.

```jsx
import ReviewPanel from '@/components/text-annotation/ReviewPanel';

<ReviewPanel
  annotation={annotation}
  onApprove={handleApprove}
  onReject={handleReject}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `annotation` | object | Annotation to review |
| `onApprove` | function | Approve handler |
| `onReject` | function | Reject handler |

**Features:**
- View annotation details
- Add review comments
- Approve/Reject actions
- Suggest corrections

### RejectedAnnotations

List of rejected annotations requiring revision.

```jsx
import RejectedAnnotations from '@/components/text-annotation/RejectedAnnotations';

<RejectedAnnotations projectId={projectId} />
```

**Features:**
- Shows rejected annotations
- Edit functionality
- Review comments display

---

## Resource Components

### ResourceList

List of text resources for annotation.

```jsx
import ResourceList from '@/components/text-annotation/ResourceList';

<ResourceList
  projectId={projectId}
  onSelect={handleResourceSelect}
  selectedId={selectedResourceId}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `projectId` | number | Project ID |
| `onSelect` | function | Resource selection handler |
| `selectedId` | number | Currently selected |

### ResourceUploader

Upload text files for annotation.

```jsx
import ResourceUploader from '@/components/text-annotation/ResourceUploader';

<ResourceUploader
  projectId={projectId}
  onUploadComplete={handleUploadComplete}
/>
```

**Supported Formats:**
- Plain text (.txt)
- JSON (.json)
- CSV (.csv)

### AnnotationList

List of annotations for a resource.

```jsx
import AnnotationList from '@/components/text-annotation/AnnotationList';

<AnnotationList
  resourceId={resourceId}
  onSelect={handleAnnotationSelect}
/>
```

### QueueStatus

Display annotation queue status.

```jsx
import QueueStatus from '@/components/text-annotation/QueueStatus';

<QueueStatus projectId={projectId} />
```

---

## Hooks

### useTextAnnotations

Hook for managing text annotations.

```jsx
import useTextAnnotations from '@/hooks/useTextAnnotations';

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
```

### useTextResources

Hook for managing text resources.

```jsx
import useTextResources from '@/hooks/useTextResources';

const {
  resources,
  loading,
  error,
  uploadResource,
  deleteResource,
  fetchResourceContent
} = useTextResources(projectId);
```

---

## Batch Workflow

### Pending Spans State

```js
// Local state for batch accumulation
const [pendingSpans, setPendingSpans] = useState([]);

// Add span to pending
const addPendingSpan = (span) => {
  setPendingSpans(prev => [...prev, {
    ...span,
    id: generateId()
  }]);
};

// Remove span from pending
const removePendingSpan = (spanId) => {
  setPendingSpans(prev => prev.filter(s => s.id !== spanId));
};

// Submit all pending spans
const submitBatch = async () => {
  await createAnnotation({
    resource_id: resourceId,
    spans: pendingSpans
  });
  setPendingSpans([]);
};
```

---

## Next Steps

- [04-IMAGE-ANNOTATION.md](04-IMAGE-ANNOTATION.md) - Image annotation components
- [05-STATE-MANAGEMENT.md](05-STATE-MANAGEMENT.md) - State management patterns