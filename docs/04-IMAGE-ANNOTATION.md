# Image Annotation Components

**Last Updated:** March 1, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Workspace Components](#workspace-components)
3. [Canvas Components](#canvas-components)
4. [Shape Components](#shape-components)
5. [Tool Components](#tool-components)

---

## Overview

The image annotation system provides an interactive canvas for drawing and editing annotation shapes.

### Component Structure

```
ImageAnnotationWorkspace
├── ImageResourceList
│   └── ImageUploader
├── ImageCanvas
│   ├── BoundingBoxShape
│   ├── PolygonShape
│   ├── KeypointShape
│   └── SegmentationShape
├── AnnotationToolbar
└── ShapeList
```

---

## Workspace Components

### ImageAnnotationWorkspace

Main container for image annotation workflow.

```jsx
import ImageAnnotationWorkspace from '@/features/image-annotation/components/ImageAnnotationWorkspace';

<ImageAnnotationWorkspace projectId={projectId} />
```

**Features:**
- Image resource selection
- Canvas for drawing shapes
- Toolbar for annotation tools
- Shape list management

### ImageResourceList

List of image resources for annotation.

```jsx
import ImageResourceList from '@/features/image-annotation/components/ImageResourceList';

<ImageResourceList
  projectId={projectId}
  onSelect={handleImageSelect}
  selectedId={selectedImageId}
/>
```

### ImageUploader

Upload images for annotation.

```jsx
import ImageUploader from '@/features/image-annotation/components/ImageUploader';

<ImageUploader
  projectId={projectId}
  onUploadComplete={handleUploadComplete}
/>
```

**Supported Formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- BMP (.bmp)

---

## Canvas Components

### ImageCanvas

Interactive canvas for image annotation.

```jsx
import ImageCanvas from '@/features/image-annotation/components/ImageCanvas';

<ImageCanvas
  image={image}
  shapes={shapes}
  selectedTool={selectedTool}
  selectedShape={selectedShape}
  onShapeCreate={handleShapeCreate}
  onShapeUpdate={handleShapeUpdate}
  onShapeSelect={handleShapeSelect}
  zoom={zoomLevel}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `image` | object | Image resource |
| `shapes` | array | Annotation shapes |
| `selectedTool` | string | Current tool |
| `selectedShape` | object | Selected shape |
| `onShapeCreate` | function | Shape creation handler |
| `onShapeUpdate` | function | Shape update handler |
| `onShapeSelect` | function | Shape selection handler |
| `zoom` | number | Zoom level (0.1-3.0) |

**Features:**
- Pan and zoom
- Shape drawing
- Shape selection
- Keyboard shortcuts

---

## Shape Components

### BoundingBoxShape

Rectangular bounding box annotation.

```jsx
import BoundingBoxShape from '@/features/image-annotation/components/shapes/BoundingBoxShape';

<BoundingBoxShape
  shape={shape}
  selected={isSelected}
  onUpdate={handleUpdate}
  color="#FF5733"
/>
```

**Shape Data:**
```js
{
  id: "bbox_001",
  type: "bounding_box",
  label: "person",
  coordinates: {
    x: 100,
    y: 150,
    width: 200,
    height: 300
  }
}
```

**Interaction:**
- Drag corners to resize
- Drag center to move
- Delete key to remove

### PolygonShape

Multi-point polygon annotation.

```jsx
import PolygonShape from '@/features/image-annotation/components/shapes/PolygonShape';

<PolygonShape
  shape={shape}
  selected={isSelected}
  onUpdate={handleUpdate}
  color="#33FF57"
/>
```

**Shape Data:**
```js
{
  id: "poly_001",
  type: "polygon",
  label: "car",
  coordinates: {
    points: [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 200 },
      { x: 100, y: 200 }
    ]
  }
}
```

**Interaction:**
- Click to add points
- Double-click to close
- Drag points to adjust

### KeypointShape

Point annotation for pose estimation.

```jsx
import KeypointShape from '@/features/image-annotation/components/shapes/KeypointShape';

<KeypointShape
  shape={shape}
  selected={isSelected}
  onUpdate={handleUpdate}
  color="#3357FF"
/>
```

**Shape Data:**
```js
{
  id: "kp_001",
  type: "keypoint",
  label: "nose",
  coordinates: {
    x: 250,
    y: 180
  }
}
```

### SegmentationShape

Pixel-level segmentation mask.

```jsx
import SegmentationShape from '@/features/image-annotation/components/shapes/SegmentationShape';

<SegmentationShape
  shape={shape}
  selected={isSelected}
  color="#FF33F5"
/>
```

---

## Tool Components

### AnnotationToolbar

Toolbar with annotation tools.

```jsx
import AnnotationToolbar from '@/features/image-annotation/components/AnnotationToolbar';

<AnnotationToolbar
  selectedTool={selectedTool}
  onToolSelect={setSelectedTool}
  selectedLabel={selectedLabel}
  onLabelSelect={setSelectedLabel}
  labels={labels}
  zoom={zoom}
  onZoomChange={setZoom}
/>
```

**Tools:**
| Tool | Icon | Shortcut | Description |
|------|------|----------|-------------|
| Select | Arrow | `V` | Select shapes |
| Bounding Box | Rectangle | `B` | Draw bounding box |
| Polygon | Polygon | `P` | Draw polygon |
| Keypoint | Circle | `K` | Add keypoint |
| Pan | Hand | `H` | Pan canvas |
| Zoom In | + | `Ctrl+=` | Zoom in |
| Zoom Out | - | `Ctrl+-` | Zoom out |

### ShapeList

List of shapes for current annotation.

```jsx
import ShapeList from '@/features/image-annotation/components/ShapeList';

<ShapeList
  shapes={shapes}
  selectedShapeId={selectedShapeId}
  onSelect={handleShapeSelect}
  onDelete={handleShapeDelete}
  onUpdate={handleShapeUpdate}
/>
```

**Features:**
- List all shapes
- Select shape
- Edit shape label
- Delete shape
- Toggle visibility

---

## Services

### imageAnnotationService

API service for image annotations.

```jsx
import {
  createAnnotation,
  getAnnotation,
  updateAnnotation,
  deleteAnnotation,
  submitAnnotation,
  reviewAnnotation
} from '@/services/imageAnnotationService';

// Create annotation
const annotation = await createAnnotation(projectId, {
  resource_id: imageId,
  annotation_type: 'image',
  annotation_sub_type: 'bounding_box',
  shapes: [boundingBoxShape]
});

// Update shapes
await updateAnnotation(projectId, annotationId, {
  shapes: updatedShapes
});
```

### imageResourceService

API service for image resources.

```jsx
import {
  uploadImage,
  getImages,
  getImage,
  deleteImage,
  getImageUrl
} from '@/services/imageResourceService';

// Upload image
const formData = new FormData();
formData.append('file', imageFile);
const resource = await uploadImage(projectId, formData);

// Get image URL
const url = getImageUrl(projectId, imageId);
```

---

## Constants

```js
// features/image-annotation/constants.js

export const ANNOTATION_TOOLS = {
  SELECT: 'select',
  BOUNDING_BOX: 'bounding_box',
  POLYGON: 'polygon',
  KEYPOINT: 'keypoint',
  SEGMENTATION: 'segmentation',
  PAN: 'pan'
};

export const DEFAULT_COLORS = {
  bounding_box: '#FF5733',
  polygon: '#33FF57',
  keypoint: '#3357FF',
  segmentation: '#FF33F5'
};

export const KEYBOARD_SHORTCUTS = {
  v: ANNOTATION_TOOLS.SELECT,
  b: ANNOTATION_TOOLS.BOUNDING_BOX,
  p: ANNOTATION_TOOLS.POLYGON,
  k: ANNOTATION_TOOLS.KEYPOINT,
  h: ANNOTATION_TOOLS.PAN,
  Delete: 'delete',
  Escape: 'deselect'
};
```

---

## Next Steps

- [05-STATE-MANAGEMENT.md](05-STATE-MANAGEMENT.md) - State management patterns
- [CHANGELOG.md](CHANGELOG.md) - Version history