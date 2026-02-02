export const ANNOTATION_SUB_TYPES = {
  NER: {
    value: 'ner',
    label: 'Named Entity Recognition',
    shortLabel: 'NER',
    description: 'Identify and label named entities',
    color: '#6366f1',
    fields: ['label', 'span_start', 'span_end', 'annotation_data'],
    labels: ['PERSON', 'ORG', 'LOCATION', 'DATE', 'PRODUCT', 'EVENT', 'MONEY'],
    labelColors: {
      PERSON: 'bg-blue-500',
      ORG: 'bg-purple-500',
      LOCATION: 'bg-green-500',
      DATE: 'bg-yellow-500',
      PRODUCT: 'bg-pink-500',
      EVENT: 'bg-indigo-500',
      MONEY: 'bg-orange-500',
    }
  },
  POS: {
    value: 'pos',
    label: 'Part-of-Speech Tagging',
    shortLabel: 'POS',
    description: 'Label words by grammatical category',
    color: '#8b5cf6',
    fields: ['label', 'span_start', 'span_end', 'annotation_data'],
    labels: ['NOUN', 'VERB', 'ADJ', 'ADV', 'PRON', 'DET', 'PREP', 'CONJ'],
    labelColors: {
      NOUN: 'bg-blue-400',
      VERB: 'bg-green-400',
      ADJ: 'bg-purple-400',
      ADV: 'bg-yellow-400',
      PRON: 'bg-pink-400',
      DET: 'bg-indigo-400',
      PREP: 'bg-orange-400',
      CONJ: 'bg-teal-400',
    }
  },
  SENTIMENT: {
    value: 'sentiment',
    label: 'Sentiment / Emotion',
    shortLabel: 'Sentiment',
    description: 'Mark text with emotional tone',
    color: '#ec4899',
    fields: ['label', 'span_start', 'span_end', 'annotation_data'],
    labels: ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'JOY', 'ANGER', 'SADNESS', 'FEAR'],
    labelColors: {
      POSITIVE: 'bg-green-500',
      NEGATIVE: 'bg-red-500',
      NEUTRAL: 'bg-gray-500',
      JOY: 'bg-yellow-400',
      ANGER: 'bg-red-600',
      SADNESS: 'bg-blue-600',
      FEAR: 'bg-purple-600',
    }
  },
  RELATION: {
    value: 'relation',
    label: 'Relation Extraction',
    shortLabel: 'Relation',
    description: 'Identify relationships between entities',
    color: '#f59e0b',
    fields: ['label', 'annotation_data'],  // No span fields
    labels: ['WORKS_FOR', 'LOCATED_IN', 'PART_OF', 'OWNS', 'BORN_IN', 'CUSTOM'],
    labelColors: {
      WORKS_FOR: 'bg-blue-500',
      LOCATED_IN: 'bg-green-500',
      PART_OF: 'bg-purple-500',
      OWNS: 'bg-orange-500',
      BORN_IN: 'bg-pink-500',
      CUSTOM: 'bg-gray-500',
    }
  },
  SPAN: {
    value: 'span',
    label: 'Span / Sequence Labeling',
    shortLabel: 'Span',
    description: 'Highlight continuous text segments',
    color: '#06b6d4',
    fields: ['label', 'span_start', 'span_end', 'annotation_data'],
    labels: ['INTENT', 'SLOT', 'CONTEXT', 'ACTION', 'ENTITY', 'MODIFIER'],
    labelColors: {
      INTENT: 'bg-indigo-500',
      SLOT: 'bg-teal-500',
      CONTEXT: 'bg-blue-500',
      ACTION: 'bg-green-500',
      ENTITY: 'bg-purple-500',
      MODIFIER: 'bg-orange-500',
    }
  },
  CLASSIFICATION: {
    value: 'classification',
    label: 'Classification',
    shortLabel: 'Class',
    description: 'Assign categories to documents',
    color: '#10b981',
    fields: ['label', 'annotation_data'],  // No span fields
    labels: ['SPAM', 'NOT_SPAM', 'POSITIVE', 'NEGATIVE', 'NEUTRAL', 'TECH', 'SPORTS', 'POLITICS', 'ENTERTAINMENT'],
    labelColors: {
      SPAM: 'bg-red-500',
      NOT_SPAM: 'bg-green-500',
      POSITIVE: 'bg-green-500',
      NEGATIVE: 'bg-red-500',
      NEUTRAL: 'bg-gray-500',
      TECH: 'bg-blue-500',
      SPORTS: 'bg-green-600',
      POLITICS: 'bg-purple-600',
      ENTERTAINMENT: 'bg-pink-500',
    }
  },
  DEPENDENCY: {
    value: 'dependency',
    label: 'Dependency Parsing',
    shortLabel: 'Dependency',
    description: 'Show grammatical relationships',
    color: '#3b82f6',
    fields: ['label', 'span_start', 'span_end', 'annotation_data'],
    labels: ['NSUBJ', 'DOBJ', 'AMOD', 'PREP', 'DET', 'ROOT', 'PUNCT'],
    labelColors: {
      NSUBJ: 'bg-blue-500',
      DOBJ: 'bg-green-500',
      AMOD: 'bg-purple-500',
      PREP: 'bg-yellow-500',
      DET: 'bg-pink-500',
      ROOT: 'bg-red-600',
      PUNCT: 'bg-gray-500',
    }
  },
  COREFERENCE: {
    value: 'coreference',
    label: 'Coreference Resolution',
    shortLabel: 'Coref',
    description: 'Link mentions of the same entity',
    color: '#a78bfa',
    fields: ['label', 'span_start', 'span_end', 'annotation_data'],
    labels: [], // Dynamically generated (CHAIN_1, CHAIN_2, ...)
    labelColors: {
      CHAIN_1: 'bg-blue-400',
      CHAIN_2: 'bg-green-400',
      CHAIN_3: 'bg-purple-400',
      CHAIN_4: 'bg-yellow-400',
      CHAIN_5: 'bg-pink-400',
    }
  },
};

export const ANNOTATION_STATUSES = {
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

// Helper function to get config for a sub-type
export const getSubTypeConfig = (subType) => {
  return Object.values(ANNOTATION_SUB_TYPES).find(type => type.value === subType) || ANNOTATION_SUB_TYPES.NER;
};

// Helper function to get labels for a sub-type
export const getSubTypeLabels = (subType) => {
  const config = getSubTypeConfig(subType);
  return config.labels || [];
};

// Helper function to get all sub-type options for a dropdown
export const getSubTypeOptions = () => {
  return Object.values(ANNOTATION_SUB_TYPES).map(config => ({
    value: config.value,
    label: config.label,
    description: config.description
  }));
};