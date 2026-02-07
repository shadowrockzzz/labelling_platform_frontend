# Review Edit Functionality Implementation

## Overview
This implementation adds a review edit feature that allows reviewers to suggest corrections to annotations while maintaining a complete audit trail. The system follows an audit trail approach where original annotations are preserved and corrections are tracked separately.

## Architecture

### Backend Components

#### 1. ReviewCorrection Model (`labelling_platform_backend/app/models/review_correction.py`)
- Stores correction suggestions with full audit trail
- Tracks correction status (pending, accepted, rejected)
- Links to original annotation, reviewer, and project
- Stores both reviewer comment and annotator response

#### 2. Schemas (`labelling_platform_backend/app/annotations/text/schemas.py`)
- `ReviewCorrectionCreate`: Schema for creating new corrections
- `ReviewCorrectionUpdate`: Schema for updating correction status
- `ReviewCorrectionResponse`: Schema for correction responses

#### 3. CRUD Operations (`labelling_platform_backend/app/annotations/text/crud.py`)
- `create_correction`: Creates a new correction suggestion
- `get_correction`: Retrieves a specific correction
- `list_corrections`: Lists all corrections for an annotation
- `update_correction`: Updates correction status
- `accept_correction`: Accepts a correction and applies to annotation

#### 4. API Endpoints (`labelling_platform_backend/app/annotations/text/router.py`)
```
POST   /projects/{project_id}/annotations/{annotation_id}/corrections
GET    /projects/{project_id}/annotations/{annotation_id}/corrections
GET    /projects/{project_id}/corrections/{correction_id}
PUT    /projects/{project_id}/corrections/{correction_id}
POST   /projects/{project_id}/corrections/{correction_id}/accept
```

#### 5. Database Migration (`labelling_platform_backend/migration_add_review_corrections.py`)
- Creates `review_corrections` table
- Adds all necessary indexes and foreign key constraints

### Frontend Components

#### 1. API Service (`labelling_platform_frontend/src/services/textAnnotationService.js`)
Added methods:
- `createCorrection()`: Create a correction suggestion
- `listCorrections()`: List corrections for an annotation
- `getCorrection()`: Get a specific correction
- `updateCorrection()`: Update correction status
- `acceptCorrection()`: Accept and apply a correction

#### 2. EditAnnotationForm Component (`labelling_platform_frontend/src/components/text-annotation/EditAnnotationForm.jsx`)
- Modal form for editing annotation spans
- Tabbed interface (Spans/Metadata)
- Add/edit/delete spans
- Required comment field
- Shows original annotation info

#### 3. ReviewPanel Component (`labelling_platform_frontend/src/components/text-annotation/ReviewPanel.jsx`)
Enhanced with:
- Correction list display with status indicators
- "Suggest Correction" button
- Expandable correction details
- Accept/Reject buttons for pending corrections
- Visual feedback (yellow/green/red based on status)

## Workflow

### For Reviewers
1. Reviewer selects an annotation for review
2. Reviewer clicks "Suggest Correction" button
3. EditAnnotationForm modal opens with current annotation data
4. Reviewer modifies spans as needed
5. Reviewer adds a required comment explaining the corrections
6. Reviewer submits the correction
7. Correction is saved with status "pending"

### For Annotators
1. Annotator views pending corrections on their annotations
2. Annotator can expand correction to see details
3. Annotator clicks "Accept" to apply corrections
4. System updates annotation with corrected data
5. Annotator can add a response comment
6. Correction status changes to "accepted"

### Correction States
- **pending**: Awaiting annotator action
- **accepted**: Correction applied to annotation
- **rejected**: Correction declined by annotator

## Data Flow

```
Reviewer creates correction
    ↓
Correction stored in database (status: pending)
    ↓
Annotator views pending corrections
    ↓
Annotator accepts correction
    ↓
System updates annotation with corrected data
    ↓
Correction status changes to "accepted"
    ↓
Original annotation data preserved in audit trail
```

## Audit Trail Benefits

1. **Complete History**: Every correction is tracked with timestamps
2. **Reviewer Comments**: Explains why changes were needed
3. **Annotator Responses**: Allows annotators to provide feedback
4. **Original Data Preserved**: Original annotation data is never lost
5. **Transparency**: Full visibility into all changes and decisions

## Database Schema

### review_corrections Table
- `id`: Primary key
- `annotation_id`: FK to text_annotations
- `project_id`: FK to projects
- `reviewer_id`: FK to users (who created the correction)
- `corrected_data`: JSONB with corrected annotation data
- `comment`: Reviewer's explanation
- `status`: pending/accepted/rejected
- `annotator_response`: Annotator's feedback (optional)
- `reviewed_at`: Timestamp of annotator action
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

## Testing Recommendations

### Backend Testing
1. Test creating corrections with various annotation data
2. Test accepting corrections and verifying annotation updates
3. Test rejecting corrections
4. Test listing corrections with different filters
5. Test edge cases (empty corrections, invalid data)

### Frontend Testing
1. Test opening EditAnnotationForm modal
2. Test adding/editing/deleting spans
3. Test submitting corrections with/without comments
4. Test viewing corrections list
5. Test expanding correction details
6. Test accepting/rejecting corrections
7. Test visual feedback for different statuses

## Future Enhancements

1. **Bulk Corrections**: Allow reviewers to suggest corrections for multiple annotations at once
2. **Correction Templates**: Pre-defined correction patterns
3. **Auto-merge**: Intelligent merging of multiple corrections
4. **Correction Statistics**: Dashboard showing correction acceptance rates
5. **Export Corrections**: Export corrections for external analysis
6. **Correction Diff**: Visual diff showing original vs corrected data

## Files Modified/Created

### Backend
- `labelling_platform_backend/app/models/review_correction.py` (NEW)
- `labelling_platform_backend/app/models/__init__.py` (MODIFIED)
- `labelling_platform_backend/app/annotations/text/models.py` (MODIFIED)
- `labelling_platform_backend/app/annotations/text/schemas.py` (MODIFIED)
- `labelling_platform_backend/app/annotations/text/crud.py` (MODIFIED)
- `labelling_platform_backend/app/annotations/text/router.py` (MODIFIED)
- `labelling_platform_backend/migration_add_review_corrections.py` (NEW)
- `labelling_platform_backend/docs/REVIEW_CORRECTIONS_FEATURE.md` (NEW)
- `labelling_platform_backend/docs/IMPLEMENTATION_SUMMARY.md` (NEW)

### Frontend
- `labelling_platform_frontend/src/services/textAnnotationService.js` (MODIFIED)
- `labelling_platform_frontend/src/components/text-annotation/EditAnnotationForm.jsx` (NEW)
- `labelling_platform_frontend/src/components/text-annotation/ReviewPanel.jsx` (MODIFIED)
- `labelling_platform_frontend/docs/REVIEW_EDIT_IMPLEMENTATION.md` (NEW)

## Dependencies

### Backend
- Pydantic v2
- SQLAlchemy (already in use)
- FastAPI (already in use)

### Frontend
- React (already in use)
- Lucide React icons (already in use)
- React Hot Toast (already in use)

## API Reference

### Create Correction
```
POST /annotations/text/projects/{project_id}/annotations/{annotation_id}/corrections

Request Body:
{
  "annotation_id": int,
  "corrected_data": {
    "spans": [...]
  },
  "comment": str (required)
}

Response: ReviewCorrectionResponse
```

### List Corrections
```
GET /annotations/text/projects/{project_id}/annotations/{annotation_id}/corrections?status={status}

Query Params:
- status: "pending" | "accepted" | "rejected" (optional)

Response: List[ReviewCorrectionResponse]
```

### Accept Correction
```
POST /annotations/text/projects/{project_id}/corrections/{correction_id}/accept?annotator_response={response}

Query Params:
- annotator_response: str (optional)

Response: ReviewCorrectionResponse
```

## Conclusion

This implementation provides a robust review edit functionality that maintains data integrity through a complete audit trail. Reviewers can suggest corrections without directly modifying annotations, and annotators have full control over accepting or rejecting these suggestions. The system tracks all changes, comments, and decisions, providing transparency and accountability throughout the review process.