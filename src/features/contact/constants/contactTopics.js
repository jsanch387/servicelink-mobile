/** Server `topic` values for POST /api/contact */
export const CONTACT_TOPICS = [
  { value: 'feature_request', label: 'Feature request' },
  { value: 'bug_report', label: 'Bug report' },
  { value: 'other', label: 'Other' },
];

export const CONTACT_TOPIC_VALUES = CONTACT_TOPICS.map((t) => t.value);

export const DEFAULT_CONTACT_TOPIC = 'bug_report';
