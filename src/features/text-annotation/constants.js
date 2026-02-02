// Annotation Type is now module-level (always 'text' for this module)
export const ANNOTATION_TYPES = {
  TEXT: 'text'
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

// Annotation Sub-Types - the specific annotation tasks within the text module
export const ANNOTATION_SUB_TYPES = {
  NER: 'ner',
  POS: 'pos',
  SENTIMENT: 'sentiment',
  RELATION: 'relation',
  SPAN: 'span',
  CLASSIFICATION: 'classification',
  DEPENDENCY: 'dependency',
  COREFERENCE: 'coreference'
};

// Configuration for each annotation sub-type
export const ANNOTATION_SUB_TYPE_CONFIG = {
  [ANNOTATION_SUB_TYPES.NER]: {
    label: 'Named Entity Recognition',
    description: 'Identify and classify named entities (PERSON, ORG, GPE, etc.)',
    fields: ['label', 'span_start', 'span_end', 'annotation_data'],
    dataStructure: {
      entity_text: { type: 'string', required: true },
      confidence: { type: 'float', optional: true },
      nested: { type: 'boolean', optional: true }
    },
    labels: ['PERSON', 'ORG', 'GPE', 'LOC', 'DATE', 'MONEY', 'PERCENT', 'TIME', 'CARDINAL', 'ORDINAL', 'EVENT', 'WORK_OF_ART', 'LAW', 'LANGUAGE', 'PRODUCT', 'FAC']
  },
  
  [ANNOTATION_SUB_TYPES.POS]: {
    label: 'Part-of-Speech Tagging',
    description: 'Tag each token with its part of speech (NOUN, VERB, ADJ, etc.)',
    fields: ['label', 'span_start', 'span_end', 'annotation_data'],
    dataStructure: {
      token: { type: 'string', required: true },
      token_index: { type: 'integer', required: true },
      batch: { type: 'boolean', optional: true }
    },
    labels: ['NOUN', 'VERB', 'ADJ', 'ADV', 'PRON', 'DET', 'ADP', 'CONJ', 'PRT', 'NUM', 'X', '.']
  },
  
  [ANNOTATION_SUB_TYPES.SENTIMENT]: {
    label: 'Sentiment Analysis',
    description: 'Analyze sentiment of text segments (positive, negative, neutral)',
    fields: ['label', 'span_start', 'span_end', 'annotation_data'],
    dataStructure: {
      text: { type: 'string', required: true },
      intensity: { type: 'integer', min: 0, max: 100, required: true },
      emotions: { type: 'object', optional: true }
    },
    labels: ['positive', 'negative', 'neutral']
  },
  
  [ANNOTATION_SUB_TYPES.RELATION]: {
    label: 'Relation Extraction',
    description: 'Identify relationships between entities (e.g., "PERSON works_for ORG")',
    fields: ['label', 'annotation_data'],
    dataStructure: {
      head_entity: { type: 'object', required: true },
      tail_entity: { type: 'object', required: true },
      relation_label: { type: 'string', required: true },
      confidence: { type: 'float', optional: true }
    },
    labels: ['works_for', 'located_in', 'born_in', 'married_to', 'has_child', 'member_of', 'founded', 'owns', 'lives_in', 'other']
  },
  
  [ANNOTATION_SUB_TYPES.SPAN]: {
    label: 'Span/Sequence Labeling',
    description: 'Label text spans with categories (supports overlapping spans)',
    fields: ['label', 'span_start', 'span_end', 'annotation_data'],
    dataStructure: {
      text: { type: 'string', required: true },
      category: { type: 'string', required: true },
      subcategory: { type: 'string', optional: true },
      overlaps_with: { type: 'array', optional: true },
      priority: { type: 'integer', min: 1, max: 5, required: true }
    },
    labels: ['PRODUCT', 'EVENT', 'WORK_OF_ART', 'LAW', 'LANGUAGE', 'PERSON', 'ORG', 'GPE', 'LOC', 'DATE', 'TIME', 'MONEY', 'PERCENT', 'QUANTITY']
  },
  
  [ANNOTATION_SUB_TYPES.CLASSIFICATION]: {
    label: 'Document Classification',
    description: 'Classify entire documents into categories (binary, multi-class, multi-label)',
    fields: ['label', 'annotation_data'],
    dataStructure: {
      classes: { type: 'array', required: true },
      classification_type: { type: 'string', enum: ['binary', 'multi_class', 'multi_label'], required: true },
      reasoning: { type: 'string', optional: true }
    },
    labels: ['sports', 'politics', 'technology', 'health', 'entertainment', 'business', 'science', 'world']
  },
  
  [ANNOTATION_SUB_TYPES.DEPENDENCY]: {
    label: 'Dependency Parsing',
    description: 'Analyze grammatical relationships between words',
    fields: ['label', 'annotation_data'],
    dataStructure: {
      head_token: { type: 'string', required: true },
      dependent_token: { type: 'string', required: true },
      head_index: { type: 'integer', required: true },
      dependent_index: { type: 'integer', required: true },
      relation: { type: 'string', required: true },
      is_root: { type: 'boolean', optional: true }
    },
    labels: ['nsubj', 'obj', 'iobj', 'nsubjpass', 'csubj', 'ccomp', 'xcomp', 'mark', 'advcl', 'det', 'amod', 'nummod', 'compound', 'prep', 'pobj', 'conj', 'cc', 'root']
  },
  
  [ANNOTATION_SUB_TYPES.COREFERENCE]: {
    label: 'Coreference Resolution',
    description: 'Identify mentions that refer to the same entity across the text',
    fields: ['label', 'span_start', 'span_end', 'annotation_data'],
    dataStructure: {
      mention_text: { type: 'string', required: true },
      chain_id: { type: 'string', required: true },
      mention_type: { type: 'string', enum: ['pronoun', 'proper_noun', 'common_noun'], required: true },
      is_representative: { type: 'boolean', optional: true },
      other_mentions: { type: 'array', optional: true }
    },
    labels: ['representative', 'pronoun', 'proper_noun', 'common_noun']
  }
};

// Helper function to get config for a sub-type
export const getSubTypeConfig = (subType) => {
  return ANNOTATION_SUB_TYPE_CONFIG[subType] || ANNOTATION_SUB_TYPE_CONFIG[ANNOTATION_SUB_TYPES.NER];
};

// Helper function to get labels for a sub-type
export const getSubTypeLabels = (subType) => {
  const config = getSubTypeConfig(subType);
  return config.labels || [];
};

// Helper function to get data structure for a sub-type
export const getSubTypeDataStructure = (subType) => {
  const config = getSubTypeConfig(subType);
  return config.dataStructure || {};
};

// Helper function to get all sub-type options for a dropdown
export const getSubTypeOptions = () => {
  return Object.entries(ANNOTATION_SUB_TYPE_CONFIG).map(([key, config]) => ({
    value: key,
    label: config.label,
    description: config.description
  }));
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