# Frontend Changes for Single-Annotation Model

## Overview
This document summarizes all changes made to the frontend to support the new single-annotation model for text annotations. The new model consolidates multiple span annotations into a single annotation record with multiple span entries.

## Changed Files

### 1. `src/services/textAnnotationService.js`
**Added new single-annotation model endpoints:**
- `addSpan(projectId, resourceId, spanData, annotationSubType)` - Add a span to an annotation
- `getAnnotationWithSpans(projectId, resourceId, userId)` - Get annotation with all spans for a resource
- `updateSpan(projectId, annotationId, spanId, spanData)` - Update a specific span
- `deleteSpan(projectId, annotationId, spanId)` - Remove a specific span

**Usage Example:**
```javascript
// Add a span
await textAnnotationService.addSpan(projectId, resourceId, {
  text: "John",
  label: "PERSON",
  start: 10,
  end: 14,
  confidence: 0.95
}, 'ner');
```

### 2. `src/components/text-annotation/TextAnnotationEditor.jsx`
**Changes:**
- Added `projectId` prop to enable calling new endpoints
- Modified `handleSaveAndContinue()` to use `addSpan()` endpoint for span-based annotations
- Updated to handle both old model (for non-span types) and new model (for span types)
- Added automatic refresh after adding spans

**Key Changes:**
```javascript
// Old behavior: Created a new annotation record
await createAnnotation(data);

// New behavior: Adds span to existing annotation
await textAnnotationService.addSpan(
  projectId,
  resource.id,
  spanData,
  annotationSubType
);
```

### 3. `src/components/text-annotation/TextAnnotationWorkspace.jsx`
**Changes:**
- Pass `projectId` prop to `TextAnnotationEditor`
- Modified `handleSaveAnnotation()` to refresh annotations after span creation
- Handles both `data` parameter (old model) and `null` (new model where span was already saved)

**Key Changes:**
```javascript
// Updated handleSaveAnnotation to refresh after span creation
if (selectedResource) {
  fetchAnnotations(1, { resource_id: selectedResource.id });
}
```

### 4. `src/components/text-annotation/AnnotationList.jsx`
**Changes:**
- Added dual-mode support for displaying annotations
  - **New Model**: `annotations[0].spans` contains span array
  - **Old Model**: Each annotation is a separate record
- Detects model type automatically and renders accordingly
- Extracts annotation metadata from parent annotation for span items

**Key Changes:**
```javascript
// Detect model type
const isSingleAnnotationModel = annotations.length === 1 && 
                                annotations[0]?.spans && 
                                annotations[0].spans.length > 0;
const spansToDisplay = isSingleAnnotationModel ? annotations[0].spans : annotations;
```

### 5. `src/features/text-annotation/components/HighlightableTextArea.jsx`
**Changes:**
- Updated to handle both span models in rendering
- Uses `start`/`end` fields (new model) or `span_start`/`span_end` (old model)
- Automatically detects which model is being used
- Correctly extracts annotation sub-type from parent annotation in new model

**Key Changes:**
```javascript
// Detect model and extract spans
const isSingleAnnotationModel = annotations.length === 1 && 
                                annotations[0]?.spans && 
                                annotations[0].spans.length > 0;
const spansToRender = isSingleAnnotationModel ? annotations[0].spans : annotations;

// Handle both field names
const start = annotation.start !== undefined ? annotation.start : annotation.span_start;
const end = annotation.end !== undefined ? annotation.end : annotation.span_end;
```

## Backward Compatibility

All components maintain backward compatibility with the old annotation model:
- Detection logic automatically determines which model is being used
- Components work seamlessly with both models
- No breaking changes to existing data or workflows

## New Workflow (Single-Annotation Model)

### User Experience Flow:

1. **Select Resource**: User selects a text resource to annotate
2. **Open Editor**: Click "Create New Annotation" to open the editor
3. **Select Text**: User highlights text in the text area
4. **Choose Label**: Click a label from the palette
5. **Save & Continue**: Click "Save & Continue" to:
   - Add the span to the single annotation record via API
   - Refresh the annotations list to show the new span
   - Clear the form for the next annotation
6. **Repeat**: Steps 3-5 can be repeated continuously
7. **Done**: Click "Done" button when finished annotating the resource

### API Flow:

```
User Action → addSpan() endpoint → Backend creates/updates single annotation with spans
                                                    ↓
                                            Frontend receives response
                                                    ↓
                                            fetchAnnotations() refreshes list
                                                    ↓
                                            AnnotationList displays new span
                                                    ↓
                                            HighlightableTextArea shows highlight
```

## Benefits of New Model

1. **Reduced Database Records**: Single annotation per resource instead of one per span
2. **Better Performance**: Fewer database queries and joins
3. **Simpler Management**: All spans for a resource in one place
4. **Easier Version Control**: Single annotation can be versioned
5. **Consistent Workflow**: Users can add multiple spans without closing the editor

## Testing Recommendations

1. **Test Span Creation**: 
   - Create multiple spans on a single resource
   - Verify all spans appear in the list
   - Check that highlights appear correctly in the text

2. **Test Mixed Models**:
   - Verify old model annotations still display correctly
   - Ensure new annotations use the new model
   - Check that components handle both models seamlessly

3. **Test Error Handling**:
   - Try adding spans without selecting text
   - Try adding spans without selecting a label
   - Verify error messages appear appropriately

4. **Test Refresh**:
   - After adding a span, verify the list updates immediately
   - Check that highlights appear in the text area
   - Ensure the editor remains open for continuous annotation

## Migration Notes

- Existing data in the old model will continue to work
- New annotations automatically use the new model
- No manual migration required for existing annotations
- Components handle both models transparently

## Future Enhancements

Potential improvements for the single-annotation model:

1. **Span Editing**: Allow editing individual spans within an annotation
2. **Span Deletion**: Allow deleting specific spans
3. **Batch Operations**: Support bulk updates to multiple spans
4. **Span Relations**: Add support for relationships between spans (e.g., coreference chains)
5. **Conflict Resolution**: Handle conflicts when multiple users annotate the same resource

## Related Documentation

- [Backend Changes](../backend/docs/SINGLE_ANNOTATION_MODEL_CHANGES.md) - Backend implementation details
- [Bug Fixes](../backend/docs/BUG_FIXES_FEB_2026.md) - Recent bug fixes
- [Feature Guide](FEATURE_GUIDE.md) - User-facing feature documentation