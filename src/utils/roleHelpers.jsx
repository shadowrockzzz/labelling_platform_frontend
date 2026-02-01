export const ROLE_COLORS = {
  admin:            { bg: 'bg-rose-100',    text: 'text-rose-700'    },
  project_manager:  { bg: 'bg-indigo-100',  text: 'text-indigo-700'  },
  reviewer:         { bg: 'bg-amber-100',   text: 'text-amber-700'   },
  annotator:        { bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

export const ROLE_LABELS = {
  admin:            'Admin',
  project_manager:  'Project Manager',
  reviewer:         'Reviewer',
  annotator:        'Annotator',
};

export const ROLE_OPTIONS = [
  { value: 'admin',            label: 'Admin' },
  { value: 'project_manager',  label: 'Project Manager' },
  { value: 'reviewer',         label: 'Reviewer' },
  { value: 'annotator',        label: 'Annotator' },
];

export const PROJECT_STATUS_COLORS = {
  active:    { bg: 'bg-green-100',  text: 'text-green-700'  },
  completed: { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  archived:  { bg: 'bg-gray-100',   text: 'text-gray-600'   },
};

export const PROJECT_STATUS_LABELS = {
  active:    'Active',
  completed: 'Completed',
  archived:  'Archived',
};

export const PROJECT_STATUS_OPTIONS = [
  { value: 'active',    label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived',  label: 'Archived' },
];

export function RoleBadge({ role }) {
  const colors = ROLE_COLORS[role] || ROLE_COLORS.annotator;
  const label = ROLE_LABELS[role] || role;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const colors = PROJECT_STATUS_COLORS[status] || PROJECT_STATUS_COLORS.active;
  const label = PROJECT_STATUS_LABELS[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      {label}
    </span>
  );
}