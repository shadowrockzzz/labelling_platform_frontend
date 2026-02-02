export const ANNOTATION_TYPES = {
  GENERAL: 'general',
  NER: 'ner',
  CLASSIFICATION: 'classification',
  SENTIMENT: 'sentiment'
};

export const ANNOTATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const RESOURCE_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived'
};

export const ANNOTATION_SUB_TYPES = {
  [ANNOTATION_TYPES.GENERAL]: {
    label: 'General',
    fields: ['label', 'annotation_data']
  },
  [ANNOTATION_TYPES.NER]: {
    label: 'Named Entity Recognition',
    fields: ['label', 'span_start', 'span_end', 'annotation_data']
  },
  [ANNOTATION_TYPES.CLASSIFICATION]: {
    label: 'Classification',
    fields: ['label', 'annotation_data']
  },
  [ANNOTATION_TYPES.SENTIMENT]: {
    label: 'Sentiment Analysis',
    fields: ['label', 'annotation_data'],
    labels: ['positive', 'negative', 'neutral']
  }
};

export const QUEUE_TASK_TYPES = {
  RESOURCE_UPLOADED: 'resource_uploaded',
  RESOURCE_URL_ADDED: 'resource_url_added',
  ANNOTATION_SUBMITTED: 'annotation_submitted',
  ANNOTATION_REVIEWED: 'annotation_reviewed'
};

export const QUEUE_TASK_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  DONE: 'done',
  FAILED: 'failed'
};