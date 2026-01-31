export const ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  REVIEWER: 'reviewer',
  ANNOTATOR: 'annotator',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.PROJECT_MANAGER]: 'Project Manager',
  [ROLES.REVIEWER]: 'Reviewer',
  [ROLES.ANNOTATOR]: 'Annotator',
};

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

export const STATUS_LABELS = {
  [PROJECT_STATUS.ACTIVE]: 'Active',
  [PROJECT_STATUS.COMPLETED]: 'Completed',
  [PROJECT_STATUS.ARCHIVED]: 'Archived',
};

export const TOKEN_EXPIRY_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
export const AUTO_LOGOUT_TIME = 15 * 60 * 1000; // 15 minutes of inactivity