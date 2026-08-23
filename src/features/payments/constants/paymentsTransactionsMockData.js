/** Sample transactions for the Payments → Transactions tab (UI only — no API yet). */

/** First page: recent activity only. Older rows appear via Show more. */
export const PAYMENTS_TRANSACTIONS_PAGE_SIZE = 6;

/** @typedef {'in' | 'out'} TransactionTone */
/** @typedef {'tap' | 'link' | 'online' | 'cash' | 'payout'} TransactionMethod */

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   subtitle: string;
 *   amountCents: number;
 *   tone: TransactionTone;
 *   method: TransactionMethod;
 *   dayGroup: string;
 * }} MockTransaction
 */

/** Newest first. */
/** @type {MockTransaction[]} */
export const PAYMENTS_TRANSACTIONS_MOCK = [
  {
    id: 't1',
    title: 'Lights',
    subtitle: 'Payment link · Paid',
    amountCents: 4000,
    tone: 'in',
    method: 'link',
    dayGroup: 'Today',
  },
  {
    id: 't2',
    title: 'Signature Shine',
    subtitle: 'Tap to Pay · Jordan M.',
    amountCents: 18500,
    tone: 'in',
    method: 'tap',
    dayGroup: 'Today',
  },
  {
    id: 't3',
    title: 'Cabin detail',
    subtitle: 'Payment link · Paid',
    amountCents: 8500,
    tone: 'in',
    method: 'link',
    dayGroup: 'Yesterday',
  },
  {
    id: 't4',
    title: 'Interior Clean',
    subtitle: 'Marked paid · Sam R.',
    amountCents: 12000,
    tone: 'in',
    method: 'cash',
    dayGroup: 'Yesterday',
  },
  {
    id: 't5',
    title: 'Sent to your bank',
    subtitle: 'Payout',
    amountCents: -210000,
    tone: 'out',
    method: 'payout',
    dayGroup: 'Yesterday',
  },
  {
    id: 't6',
    title: 'Ceramic package',
    subtitle: 'Tap to Pay · Alex P.',
    amountCents: 45000,
    tone: 'in',
    method: 'tap',
    dayGroup: 'Yesterday',
  },
  {
    id: 't7',
    title: 'Full Detail',
    subtitle: 'Online · Chris L.',
    amountCents: 32000,
    tone: 'in',
    method: 'online',
    dayGroup: 'Mon',
  },
  {
    id: 't8',
    title: 'Maintenance plan',
    subtitle: 'Payment link · Paid',
    amountCents: 8900,
    tone: 'in',
    method: 'link',
    dayGroup: 'Mon',
  },
  {
    id: 't9',
    title: 'Sent to your bank',
    subtitle: 'Payout',
    amountCents: -480000,
    tone: 'out',
    method: 'payout',
    dayGroup: 'Sun',
  },
  {
    id: 't10',
    title: 'Paint correction',
    subtitle: 'Tap to Pay · Taylor B.',
    amountCents: 55000,
    tone: 'in',
    method: 'tap',
    dayGroup: 'Sun',
  },
  {
    id: 't11',
    title: 'Express wash',
    subtitle: 'Marked paid · walk-in',
    amountCents: 4500,
    tone: 'in',
    method: 'cash',
    dayGroup: 'Sat',
  },
];
