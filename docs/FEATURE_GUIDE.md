# Feature Guide

**Last Updated:** February 2, 2026

---

## Table of Contents

1. [Text Annotation System](#text-annotation-system)
2. [Annotation Sub-Types](#annotation-sub-types)
3. [Queue Management](#queue-management)
4. [Project Management](#project-management)
5. [User Management](#user-management)

---

## Text Annotation System

### Overview

The text annotation system allows users to annotate text resources with different types of annotations. It supports multiple annotation workflows, a complete lifecycle management, and a queue system for background task processing.

### Key Features

- **4 Main Annotation Types**: General, NER, Classification, Sentiment Analysis
- **Complete Workflow**: Create → Edit → Submit → Review → Approve/Reject
- **Queue System**: Task queue for processing annotation events
- **Role-Based Access**: Annotators, Reviewers, Admins, Project Managers

### Annotation Types

#### 1. General Annotation

**Purpose:** Generic, flexible annotations for any text annotation needs

**Fields:**
- `label`: Custom label (optional)
- `annotation_data`: JSON payload (flexible)
- **No span fields**

**Use Cases:**
- General text notes
- Custom annotations
- Ad-hoc labeling
- Research annotations

**Example:**
```json
{
  "annotation_type": "text",
  "annotation_sub_type": "general",
  "resource_id": 1,
  "label": "Important Note",
  "annotation_data": {
    "priority": "high",
    "category": "custom"
  }
}
```

#### 2. Named Entity Recognition (NER)

**Purpose:** Identify and label named entities (people, organizations, locations, etc.)

**Fields:**
- `label`: Entity type (PERSON, ORG, GPE, LOC, etc.)
- `span_start`: Character index start
- `span_end`: Character index end
- `annotation_data`: Entity attributes

**Supported Labels:**
PERSON, ORG, GPE, LOC, DATE, MONEY, PERCENT, TIME, CARDINAL, ORDINAL, EVENT, WORK_OF_ART, LAW, LANGUAGE, PRODUCT, FAC

**Use Cases:**
- Entity extraction
- Information extraction
- Named entity tagging
- Entity linking

**Example:**
```json
{
  "annotation_type": "text",
  "annotation_sub_type": "ner",
  "resource_id": 1,
  "label": "PERSON",
  "span_start": 10,
  "span_end": 25,
  "annotation_data": {
    "entity_text": "John Doe",
    "confidence": 0.95
  }
}
```

#### 3. Classification

**Purpose:** Categorize entire text into predefined classes/categories

**Fields:**
- `label`: Class name
- `annotation_data`: Class scores and metadata
- **No span fields**

**Supported Labels:**
positive, negative, neutral, sports, politics, technology, health, entertainment, business, science, world

**Use Cases:**
- Sentiment classification
- Topic categorization
- Spam detection
- Document classification

**Example:**
```json
{
  "annotation_type": "text",
  "annotation_sub_type": "classification",
  "resource_id": 1,
  "label": "positive",
  "annotation_data": {
    "confidence": 0.87,
    "class_probabilities": {
      "positive": 0.87,
      "negative": 0.10,
      "neutral": 0.03
    }
  }
}
```

#### 4. Sentiment Analysis

**Purpose:** Determine emotional tone or sentiment of text

**Fields:**
- `label`: Sentiment value (positive, negative, neutral)
- `annotation_data`: Sentiment scores and emotions
- **Predefined label buttons in UI**

**Supported Labels:**
- positive
- negative
- neutral

**Use Cases:**
- Customer review analysis
- Social media sentiment
- Feedback analysis
- Market research

**Example:**
```json
{
  "annotation_type": "text",
  "annotation_sub_type": "sentiment",
  "resource_id": 1,
  "label": "positive",
  "annotation_data": {
    "text": "Great work!",
    "intensity": 85,
    "emotions": {
      "joy": 0.7,
      "trust": 0.3
    }
  }
}
```

### Annotation Lifecycle

```
┌─────────────┐
│   Draft     │ Annotator creates annotation
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  In Progress│ Annotator works on annotation
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Submitted  │ Annotator submits for review
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Under Review │ Reviewer reviews annotation
└──────┬──────┘
       │
       ├───────┐
       ▼       ▼
┌──────────┐ ┌──────────┐
│ Approved │ │ Rejected │
└──────────┘ └──────────┘
```

### Frontend Components

#### TextAnnotationEditor
- Form for creating/editing annotations
- Dynamic fields based on annotation type
- Predefined label buttons for sentiment
- Span fields for NER only
- JSON validation for additional data

#### AnnotationList
- Display list of annotations
- Status badges with color coding
- Edit and submit buttons
- Review comments display
- Empty state handling

#### TextAnnotationWorkspace
- Main workspace container
- Resource list sidebar
- Annotation list
- Editor modal
- Review panel
- Queue status

#### ResourceUploader
- File upload (drag & drop)
- URL input
- Progress tracking
- Error handling

#### ResourceList
- Browse resources
- Pagination
- Status badges
- Delete action (admin/PM)

### S3/MinIO Storage Integration

**Overview:** Text annotation system uses S3-compatible storage (MinIO for development) to store uploaded text files and retrieve content for annotation display.

**Why S3 Storage:**
- Scalable file storage for large projects
- Efficient file serving for annotation workflows
- Supports future cloud deployment (AWS S3, Google Cloud Storage, etc.)
- Separate storage from application server

**MinIO (Development):**
- S3-compatible storage running in Docker
- Local development with cloud-like storage
- Easy to switch to production S3 services

**Storage Locations:**
```
projects/{project_id}/resources/{resource_id}.txt
projects/{project_id}/resources/{resource_id}.json
```

**S3 Configuration (.env):**
```bash
AWS_ACCESS_KEY_ID=labelling_platform
AWS_SECRET_ACCESS_KEY=labelling_platform_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=labelling-platform-files
AWS_S3_ENDPOINT=http://localhost:9000  # MinIO endpoint
```

**File Upload Flow:**
1. User uploads file via frontend
2. Frontend sends file to backend API
3. Backend uploads file to MinIO S3
4. Backend stores S3 key in database
5. Content is downloaded on-demand when viewing resource

**Content Download Flow:**
1. User opens annotation workspace
2. Frontend requests resource from backend
3. Backend retrieves S3 key from database
4. Backend downloads file from MinIO
5. Backend streams content to frontend
6. Frontend displays text in annotation editor

**MinIO Console:**
- URL: http://localhost:9001
- Login: labelling_platform / labelling_platform_secret_key
- View uploaded files and buckets
- Manage storage settings

**Troubleshooting:**

**Issue:** "S3 bucket not configured"
```
Solution: Check .env file has S3 configuration
        Ensure MinIO is running: docker-compose up -d
        Create bucket manually if init script fails
```

**Issue:** "The specified bucket does not exist"
```
Solution: Create bucket in MinIO console
        Run: docker exec labelling_platform_minio mc mb local/labelling-platform-files
```

**Issue:** Text content not displaying
```
Solution: Check MinIO is running (docker ps)
        Verify bucket exists
        Check backend logs for S3 errors
        Ensure S3 credentials in .env are correct
```

**Production S3:**
For production, switch from MinIO to AWS S3 or other S3-compatible services:
```bash
# Example AWS S3 configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-production-bucket
AWS_S3_ENDPOINT=https://s3.amazonaws.com
```

**For detailed S3 setup, see:**
- `labelling_platform_backend/docs/S3_SETUP_GUIDE.md` - Complete S3/MinIO guide
- `labelling_platform_backend/docs/QUICK_START.md` - Quick setup steps

---

### Backend API Endpoints

#### Resource Management
```
POST /api/v1/annotations/text/projects/{id}/resources/upload
POST /api/v1/annotations/text/projects/{id}/resources/url
GET /api/v1/annotations/text/projects/{id}/resources
GET /api/v1/annotations/text/projects/{id}/resources/{rid}
DELETE /api/v1/annotations/text/projects/{id}/resources/{rid}
```

#### Annotation Management
```
POST /api/v1/annotations/text/projects/{id}/annotations
GET /api/v1/annotations/text/projects/{id}/annotations
GET /api/v1/annotations/text/projects/{id}/annotations/{aid}
PUT /api/v1/annotations/text/projects/{id}/annotations/{aid}
POST /api/v1/annotations/text/projects/{id}/annotations/{aid}/submit
POST /api/v1/annotations/text/projects/{id}/annotations/{aid}/review
```

#### Queue Management
```
GET /api/v1/annotations/text/projects/{id}/queue
```

### Database Tables

#### text_resources
```sql
- id, project_id, name, source_type
- external_url, s3_key, content_preview
- full_content, file_size, status
- uploaded_by, created_at
```

#### text_annotations
```sql
- id, project_id, resource_id
- annotator_id, reviewer_id
- annotation_type, annotation_sub_type
- status, label
- span_start, span_end
- annotation_data, review_comment
- created_at, updated_at, submitted_at, reviewed_at
```

#### text_annotation_queue
```sql
- id, project_id, annotation_type
- resource_id, annotation_id
- task_type, status, payload
- created_at, processed_at, error_message
```

---

## Annotation Sub-Types

### Overview

The annotation sub-type system provides modular text annotation capabilities with 8 different annotation tasks. This allows the system to support various text annotation workflows while maintaining clean separation between module-level and task-level concerns.

### Two-Tier System

**Module Level (annotation_type):**
- Always contains 'text' for this module
- Represents the annotation module (text, image, video, audio)

**Task Level (annotation_sub_type):**
- Specific annotation task within the module
- 8 supported sub-types for text module

### Supported Sub-Types

#### 1. Named Entity Recognition (NER)
**Purpose:** Identify and classify named entities in text

**Labels:** PERSON, ORG, GPE, LOC, DATE, MONEY, PERCENT, TIME, CARDINAL, ORDINAL, EVENT, WORK_OF_ART, LAW, LANGUAGE, PRODUCT, FAC

**Required Fields:**
- `label`: Entity type
- `span_start`, `span_end`: Character indices
- `annotation_data.entity_text`: Entity text

**Optional Fields:**
- `annotation_data.confidence`: Confidence score (0-1)
- `annotation_data.nested`: Nested entity flag

#### 2. Part-of-Speech Tagging (POS)
**Purpose:** Tag each token with its grammatical part of speech

**Labels:** NOUN, VERB, ADJ, ADV, PRON, DET, ADP, CONJ, PRT, NUM, X, .

**Required Fields:**
- `label`: POS tag
- `span_start`, `span_end`: Character indices
- `annotation_data.token`: Token text
- `annotation_data.token_index`: Token position

**Optional Fields:**
- `annotation_data.batch`: Batch annotation flag

#### 3. Sentiment Analysis
**Purpose:** Analyze sentiment of text segments

**Labels:** positive, negative, neutral

**Required Fields:**
- `label`: Sentiment label
- `span_start`, `span_end`: Character indices
- `annotation_data.text`: Text segment
- `annotation_data.intensity`: Intensity score (0-100)

**Optional Fields:**
- `annotation_data.emotions`: Emotion scores dictionary

#### 4. Relation Extraction
**Purpose:** Identify relationships between entities

**Labels:** works_for, located_in, born_in, married_to, has_child, member_of, founded, owns, lives_in, other

**Required Fields:**
- `label`: Relation type
- `annotation_data.head_entity`: Head entity object
- `annotation_data.tail_entity`: Tail entity object
- `annotation_data.relation_label`: Relation type

**Optional Fields:**
- `annotation_data.confidence`: Confidence score (0-1)

#### 5. Span/Sequence Labeling
**Purpose:** Label text spans with categories (supports overlapping spans)

**Labels:** PRODUCT, EVENT, WORK_OF_ART, LAW, LANGUAGE, PERSON, ORG, GPE, LOC, DATE, TIME, MONEY, PERCENT, QUANTITY

**Required Fields:**
- `label`: Category label
- `span_start`, `span_end`: Character indices
- `annotation_data.text`: Span text
- `annotation_data.category`: Category (same as label)
- `annotation_data.priority`: Priority (1-5)

**Optional Fields:**
- `annotation_data.subcategory`: Subcategory
- `annotation_data.overlaps_with`: List of overlapping span IDs

#### 6. Document Classification
**Purpose:** Classify entire documents into categories

**Labels:** sports, politics, technology, health, entertainment, business, science, world

**Required Fields:**
- `label`: Primary class label
- `annotation_data.classes`: Array of class labels with confidence
- `annotation_data.classification_type`: binary, multi_class, or multi_label

**Optional Fields:**
- `annotation_data.reasoning`: Text explanation

#### 7. Dependency Parsing
**Purpose:** Analyze grammatical relationships between words

**Labels:** nsubj, obj, iobj, nsubjpass, csubj, ccomp, xcomp, mark, advcl, det, amod, nummod, compound, prep, pobj, conj, cc, root

**Required Fields:**
- `label`: Dependency relation
- `annotation_data.head_token`: Head word
- `annotation_data.dependent_token`: Dependent word
- `annotation_data.head_index`: Head token index
- `annotation_data.dependent_index`: Dependent token index
- `annotation_data.relation`: Relation type

**Optional Fields:**
- `annotation_data.is_root`: Root of sentence flag

#### 8. Coreference Resolution
**Purpose:** Identify mentions that refer to same entity across text

**Labels:** representative, pronoun, proper_noun, common_noun

**Required Fields:**
- `label`: Mention type
- `span_start`, `span_end`: Character indices
- `annotation_data.mention_text`: Mention text
- `annotation_data.chain_id`: Unique entity chain identifier
- `annotation_data.mention_type`: pronoun, proper_noun, or common_noun

**Optional Fields:**
- `annotation_data.is_representative`: Representative mention flag
- `annotation_data.other_mentions`: List of other mentions

### Type Safety

Each sub-type has its own Pydantic schema for validation:

```python
class NERAnnotationData(BaseModel):
    entity_text: str
    confidence: Optional[float] = None
    nested: Optional[bool] = False

class POSAnnotationData(BaseModel):
    token: str
    token_index: int
    batch: Optional[bool] = False
```

### Migration

**Script:** `migration_add_annotation_sub_type.py`

**Steps:**
1. Add `annotation_sub_type` column
2. Migrate existing `annotation_type` values to `annotation_sub_type`
3. Set all `annotation_type` to 'text'
4. Add index on `annotation_sub_type`

**Backward Compatibility:**
- Existing annotations automatically migrated
- API accepts both old and new format
- Frontend handles both formats

### Benefits

✅ **Clear Separation**: Module vs task level distinction  
✅ **Scalability**: Easy to add new sub-types  
✅ **Type Safety**: Automatic validation with Pydantic  
✅ **Queue Awareness**: Sub-type included in queue payloads  
✅ **Backward Compatible**: Existing data migrated automatically  

---

## Queue Management

### Overview

The queue system manages asynchronous tasks related to text annotations. Each project has isolated queues for each annotation type, ensuring complete task separation and enabling efficient background processing.

### Architecture

**Queue Isolation:**
- Queues are specific to `(project_id, annotation_type)` combinations
- Different projects using same annotation type have separate queues
- Same project can have multiple annotation types with separate queues

**Implementation:**
- Currently implemented as database stub (simulating RabbitMQ/Redis)
- Easy to replace with real message queue
- Same interface maintained across implementations

### Queue Table Schema

**Table:** `text_annotation_queue`

**Columns:**
```sql
- id (PK)
- project_id (FK to projects)
- annotation_type (text, image, video, etc.)
- resource_id (FK to text_resources, nullable)
- annotation_id (FK to text_annotations, nullable)
- task_type (resource_uploaded, annotation_submitted, etc.)
- status (pending, processing, done, failed)
- payload (JSON task data)
- created_at, processed_at, error_message
```

**Index:**
```sql
CREATE INDEX idx_queue_project_annotation 
ON text_annotation_queue (project_id, annotation_type)
```

### Task Types

#### 1. resource_uploaded
**Trigger:** User uploads a text file

**Payload:**
```json
{
  "resource_id": 1,
  "project_id": 1,
  "uploaded_by": 1,
  "s3_key": "uploads/projects/1/resources/sample.txt"
}
```

#### 2. resource_url_added
**Trigger:** User adds a URL as resource

**Payload:**
```json
{
  "resource_id": 1,
  "project_id": 1,
  "added_by": 1,
  "external_url": "https://example.com/text"
}
```

#### 3. annotation_submitted
**Trigger:** Annotator submits annotation

**Payload:**
```json
{
  "annotation_id": 1,
  "resource_id": 1,
  "project_id": 1,
  "annotator_id": 1,
  "annotation_sub_type": "ner"
}
```

#### 4. annotation_reviewed
**Trigger:** Reviewer approves/rejects annotation

**Payload:**
```json
{
  "annotation_id": 1,
  "project_id": 1,
  "reviewer_id": 2,
  "action": "approve",
  "comment": "Looks good!",
  "annotation_sub_type": "ner"
}
```

### Queue Status Flow

```
pending → processing → done
    ↓
  failed
```

**Status Transitions:**
- `pending`: Task created, waiting to be processed
- `processing`: Worker is processing the task
- `done`: Task completed successfully
- `failed`: Task failed with error

### Queue API

**Get Queue Tasks:**
```http
GET /api/v1/annotations/text/projects/{id}/queue
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "task_type": "resource_uploaded",
      "status": "pending",
      "annotation_type": "text",
      "project_id": 1,
      "payload": {...},
      "created_at": "2026-02-02T12:00:00Z"
    }
  ]
}
```

**Authorization:** Admin or Project Manager only

### Queue Stub Implementation

**File:** `app/annotations/text/queue_stub.py`

**Class:** `TextQueueStub`

**Methods:**

```python
queue = TextQueueStub(db, annotation_type="text")

# Add task to queue
task = queue.enqueue(project_id, resource_id, task_type, payload, annotation_id)

# Get pending tasks
tasks = queue.get_pending_tasks(project_id)

# Mark task as done
queue.complete_task(task_id)

# Mark task as failed
queue.fail_task(task_id, error_message)
```

### Queue Isolation Examples

**Example 1: Multiple Projects with Text Annotation**
```
Project 1 (text):
- Queue: project_id=1 AND annotation_type='text'

Project 2 (text):
- Queue: project_id=2 AND annotation_type='text'
```

**Example 2: Same Project, Different Annotation Types (Future)**
```
Project 1 (text):
- Queue: project_id=1 AND annotation_type='text'

Project 1 (image):
- Queue: project_id=1 AND annotation_type='image'
```

### Migration

**Script:** `migration_add_annotation_type_to_queue.py`

**Changes:**
1. Add `annotation_type` column to `text_annotation_queue`
2. Backfill existing records with `annotation_type='text'`
3. Add composite index on `(project_id, annotation_type)`

### Benefits

✅ **Complete Isolation**: Per-project, per-annotation-type queues  
✅ **Scalability**: Ready for multiple annotation types  
✅ **Performance**: Composite indexes for fast queries  
✅ **Maintainability**: Queue logic within annotation modules  
✅ **Future-Proof**: Easy to upgrade to RabbitMQ/Redis  

---

## Project Management

### Overview

Complete project management functionality including create, edit, and archive/restore capabilities with dynamic annotation type configuration.

### Features

#### 1. Create New Project
- Modal-based project creation form
- Required field: Project name (min 3 characters)
- Optional fields: Description (max 500 characters)
- Status selector: Active, Completed, Archived
- Annotation type selector with dynamic configuration fields
- Form validation with real-time error display
- Loading states during API calls
- Toast notifications for success/error feedback

#### 2. Edit Existing Projects
- Pre-populated form with existing project data
- Update all project fields
- Change annotation type (config preservation)
- Form validation
- Loading states and error handling
- Success notifications

#### 3. Archive/Restore Projects
- Confirmation modal before action
- Archive projects (status → 'archived')
- Restore projects (status → 'active')
- Visual feedback (archive vs restore icons)
- Warning messages for each action
- Role-based access control (admin/project_manager only)

### Annotation Types

The form dynamically shows configuration options based on selected annotation type:

#### Text Annotation
- Sub-type: General, NER, Classification, Sentiment Analysis
- Auto-suggestion toggle
- Character limit settings

#### Image Classification
- Number of classes
- Multi-select toggle
- Label names (comma-separated)

#### Object Detection
- Bounding box format: COCO, Pascal VOC, YOLO
- Predefined labels
- Minimum object size

#### Video Annotation
- Timeline format: Seconds, Frames
- Annotation granularity: Clip, Frame, Second
- Track IDs toggle

#### Audio Annotation
- Waveform visualization toggle
- Timestamp precision: Second, Millisecond
- Segment duration limits

#### Custom
- JSON schema editor with validation
- Flexible configuration

### Components

#### Modal Component
**File:** `src/components/common/Modal.jsx`

Features:
- Reusable modal dialog component
- Backdrop overlay with blur effect
- Close on escape key and backdrop click
- Prevents body scroll when open
- Configurable sizes (sm, md, lg, xl, full)
- Optional header close button
- Custom footer slot
- Smooth animations

#### Confirmation Modal Component
**File:** `src/components/common/ConfirmModal.jsx`

Features:
- Specialized modal for destructive actions
- Warning icons with color coding (danger, warning, info)
- Customizable confirm/cancel button text
- Loading state during action execution
- Description field for additional context

#### Project Form Component
**File:** `src/components/projects/ProjectForm.jsx`

Features:
- Create/Edit mode support
- Dynamic fields based on annotation type
- Advanced settings toggle
- Form validation with error display
- Character counter for description
- JSON validation for custom schemas
- Info boxes with helpful tips
- Loading states
- Cancel button to close modal

### Database Schema

**projects table:**
```sql
- id (PK)
- name
- description
- owner_id (FK to users)
- status (active, completed, archived)
- annotation_type (text, image, video, audio, custom)
- config (JSON dynamic configuration)
- created_at, modified_at
```

### API Endpoints

```
POST /api/v1/projects
PUT /api/v1/projects/{id}
GET /api/v1/projects
GET /api/v1/projects/{id}
DELETE /api/v1/projects/{id}
```

### Migration

**Script:** `migration_add_config.py`

**Changes:**
- Adds `config` column to `projects` table
- JSON data type for flexible configuration
- Nullable for backward compatibility

### User Flows

**Create Project:**
1. Click "+ New Project" button
2. Fill in project details
3. Select annotation type (optional)
4. Configure annotation settings (if type selected)
5. Click "Create Project"
6. Form validates input
7. Loading spinner shows during API call
8. Success toast appears
9. Modal closes
10. Project list refreshes

**Edit Project:**
1. Click "Edit" button on project card
2. Edit modal opens with pre-filled data
3. Modify fields as needed
4. Click "Update Project"
5. Form validates input
6. Loading spinner shows during API call
7. Success toast appears
8. Modal closes
9. Project list refreshes

**Archive Project:**
1. Click archive icon on project card
2. Confirmation modal opens with warning
3. Read warning message
4. Click "Archive" button
5. Loading spinner shows during API call
6. Success toast appears
7. Modal closes
8. Project list refreshes
9. Project card shows archived status

**Restore Project:**
1. Click restore icon on archived project
2. Confirmation modal opens
3. Click "Restore" button
4. Loading spinner shows during API call
5. Success toast appears
6. Modal closes
7. Project list refreshes
8. Project shows active status

### Benefits

✅ **Dynamic Configuration**: Flexible project setup per annotation type  
✅ **User-Friendly**: Modal-based UI with validation  
✅ **Role-Based Access**: Admin/PM only for create/edit/archive  
✅ **Visual Feedback**: Clear status indicators and confirmations  
✅ **Scalable**: Easy to add new annotation types  

---

## User Management

### Overview

Comprehensive user management system with create, edit, delete, and status management capabilities.

### Features

#### 1. Create User
- Modal-based user creation form
- Required fields: email, password, confirm password, role
- Optional field: full name
- Password strength validation
- Real-time form validation
- Email uniqueness check
- Toast notifications for success/error
- Loading states during API calls

#### 2. Edit User
- Pre-populated form with existing user data
- Update all user fields
- Change role
- Change password
- Form validation
- Loading states and error handling

#### 3. Active/Inactive Status Toggle
- Instant toggle button in user list
- Green background when user is active
- Gray background when user is inactive
- Click to toggle status instantly
- Loading spinner during status change
- Toast notification confirms action
- Role-based access (admin only)

#### 4. Delete User (Hard Delete)
- Confirmation modal before deletion
- Permanent database removal (hard delete)
- All user data removed
- Cannot be recovered after deletion
- Red button with proper Tailwind colors
- Loading spinner during deletion
- Role-based access (admin only)

### Components

#### User Management Page
**File:** `src/pages/UserManagement.jsx`

Features:
- User list table
- Active/Inactive toggle buttons
- Edit and Delete buttons
- Create User button
- User role badges
- Loading states
- Empty state handling

#### User Modal Components
- Create User Modal: Form for new user creation
- Edit User Modal: Form for updating user details
- Delete Confirmation Modal: Confirmation before deletion

### User Roles

**admin:**
- Full system access
- Create/manage all users
- Create/manage all projects
- Assign project managers
- Configure system settings
- View all projects

**project_manager:**
- Create/manage assigned projects
- Assign 0 to unlimited reviewers
- Assign annotators
- View project analytics
- Update project details
- Annotate data
- Review annotations

**reviewer:**
- Review submitted annotations
- Approve/reject annotations
- Add review comments
- View project details (read-only)
- See assigned projects
- View all submitted annotations

**annotator:**
- Create new annotations
- Edit own annotations (before review)
- View assigned projects
- Submit annotations for review
- Upload resources to assigned projects

### API Endpoints

```
POST /api/v1/users/register (admin only)
GET /api/v1/users
GET /api/v1/users/{id}
PUT /api/v1/users/{id}
PUT /api/v1/users/{id}/role
DELETE /api/v1/users/{id}
PUT /api/v1/users/{id}/activate
```

### Database Schema

**users table:**
```sql
- id (PK)
- email (UNIQUE)
- full_name
- hashed_password
- role (admin, project_manager, reviewer, annotator)
- is_active (boolean)
- created_at, modified_at
```

### User Status Management

**Active Status:**
- User can login
- User can perform actions based on role
- Shown in all user lists

**Inactive Status:**
- User cannot login
- User cannot perform any actions
- Shown in user lists with gray indicator
- Can be reactivated by admin

### Hard Delete Behavior

**Before (Soft Delete):**
- Users marked as `is_active = False`
- User data remained in database
- Could be reactivated later

**After (Hard Delete):**
- Users permanently deleted from database
- All user data removed (cascade delete if configured)
- Cannot be recovered after deletion
- More secure and cleaner database

### Form Validation

**User Creation:**
- Email: Required, valid email format, unique
- Password: Required, minimum 8 characters, must include uppercase, lowercase, number, special character
- Confirm Password: Required, must match password
- Full Name: Optional, maximum 255 characters
- Role: Required, one of (admin, project_manager, reviewer, annotator)

**User Edit:**
- Email: Required, valid email format, unique (excluding self)
- Full Name: Optional, maximum 255 characters
- Role: Required, one of valid roles
- Password: Optional (only if changing), same validation as creation
- Confirm Password: Required if password provided, must match

### Benefits

✅ **Complete CRUD Operations**: Full user lifecycle management  
✅ **Status Toggle**: Quick active/inactive management  
✅ **Hard Delete**: Secure permanent removal  
✅ **Role-Based Access**: Proper permissions enforcement  
✅ **Form Validation**: Real-time feedback and error prevention  
✅ **Loading States**: Clear user feedback during operations  
✅ **Toast Notifications**: Success/error confirmations  

---

## Common Features Across All Modules

### Role-Based Access Control

**Dependency Decorators:**
```python
@Depends(get_current_active_user)        # Must be logged in
@Depends(require_annotator)              # Annotator+
@Depends(require_project_manager)          # Project Manager+
@Depends(require_admin)                   # Admin only
```

**Frontend Role Guards:**
```jsx
<RoleBasedRoute allowedRoles={['admin', 'project_manager']}>
  {/* Protected content */}
</RoleBasedRoute>
```

### Form Validation

**Backend (Pydantic):**
```python
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=3)
    description: Optional[str] = Field(None, max_length=500)
    annotation_type: Optional[str] = None
```

**Frontend (React Hook Form):**
```jsx
<Controller
  name="name"
  control={control}
  rules={{ required: 'Name is required', minLength: 3 }}
  render={({ field }) => <Input {...field} />}
/>
```

### Loading States

**Buttons:**
```jsx
<button disabled={isSubmitting} className="...">
  {isSubmitting ? <LoadingSpinner /> : 'Submit'}
</button>
```

**Pages:**
```jsx
{loading ? <LoadingSpinner /> : <Content />}
```

### Error Handling

**Backend:**
```python
try:
    # Operation
except HTTPException as e:
    raise HTTPException(status_code=e.status_code, detail=e.detail)
```

**Frontend:**
```jsx
try {
  await apiCall();
  toast.success('Success');
} catch (error) {
  toast.error(error.response?.data?.detail || 'Operation failed');
}
```

### Toast Notifications

**Success:**
```jsx
toast.success('Project created successfully');
```

**Error:**
```jsx
toast.error('Failed to create project');
```

**Info:**
```jsx
toast.info('Processing...');
```

---

## Best Practices

### Frontend

1. **Always use service layer** for API calls
2. **Handle loading states** with spinners/disabled buttons
3. **Validate form data** before submission
4. **Show success/error** toasts
5. **Refetch data** after mutations
6. **Use constants** for type/status values
7. **Handle empty states** gracefully
8. **Implement role-based guards** for protected routes

### Backend

1. **Always validate input** with Pydantic schemas
2. **Check permissions** before operations
3. **Use service layer** for business logic
4. **Log important events** (queue operations, etc.)
5. **Enqueue tasks** for async operations
6. **Return proper HTTP status codes**
7. **Include error details** in responses
8. **Use type hints** for better IDE support

### Database

1. **Use indexes** for frequently queried columns
2. **Cascade deletes** for related data
3. **Use JSONB** for flexible data
4. **Include timestamps** for auditing
5. **Use constraints** for data integrity
6. **Run migrations** before deployment
7. **Backup database** before schema changes

---

## Future Enhancements

### Text Annotation System
1. **More Annotation Types:** Event extraction, Keyphrase extraction, Semantic role labeling
2. **Sub-Type Templates:** Pre-configured templates for common use cases
3. **Sub-Type Analytics:** Track statistics per sub-type
4. **Batch Operations:** Support batch annotation for POS and NER

### Queue Management
1. **RabbitMQ/Redis Integration:** Replace database stub with real message queue
2. **Queue Workers:** Background workers to process queue tasks
3. **Queue Metrics:** Real-time monitoring and alerting
4. **Queue Replay:** Ability to replay failed tasks
5. **Queue Prioritization:** Add priority levels for different task types

### Project Management
1. **Project Templates:** Pre-configured project templates for common use cases
2. **Duplicate Project:** Copy existing project with same configuration
3. **Bulk Operations:** Archive/restore multiple projects at once
4. **Advanced Search:** Filter by annotation type, date range, owner
5. **Export Configuration:** Download project configuration as JSON
6. **Import Configuration:** Load project configuration from JSON file

### User Management
1. **Batch Operations:** Allow activating/deactivating multiple users at once
2. **Export Users:** Add export to CSV/Excel functionality
3. **User Activity Log:** Track user status changes over time
4. **Bulk Import:** Allow importing users from CSV file
5. **Advanced Search:** Filter by registration date, last login, etc.

### System-Wide
1. **Real-time Updates:** WebSocket support for live updates
2. **Email Notifications:** Email alerts for important events
3. **Audit Logging:** Track all user actions
4. **Analytics Dashboard:** Comprehensive system analytics
5. **API Rate Limiting:** Prevent API abuse
6. **Two-Factor Authentication:** Enhanced security
7. **SSO Integration:** Single sign-on support
8. **Multi-language Support:** Internationalization

---

## Related Documentation

- **GETTING_STARTED.md** - Quick start guide and architecture overview
- **BUG_FIX_LOG.md** - Bug fixes and improvements
- **SETUP_GUIDE.md** - Detailed setup instructions

---

*Document consolidated from TEXT_ANNOTATION_SYSTEM_GUIDE.md, ANNOTATION_SUB_TYPE_FEATURE.md, QUEUE_RESTRUCTURING_ANNOTATION_TYPE.md, PROJECT_MANAGEMENT_FEATURE.md, and USER_MANAGEMENT_UPDATES.md*