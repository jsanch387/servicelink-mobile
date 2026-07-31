/** Sample transactions for the Payments → Transactions preview tab. */

/** @typedef {'in' | 'out'} TransactionTone */
/** @typedef {'tap' | 'online' | 'cash' | 'payout'} TransactionMethod */

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

/** @type {MockTransaction[]} */
export const PAYMENTS_TRANSACTIONS_MOCK = [
  {
    id: 't1',
    title: 'Signature Shine',
    subtitle: 'Tap to Pay · Jordan M.',
    amountCents: 18500,
    tone: 'in',
    method: 'tap',
    dayGroup: 'Today',
  },
  {
    id: 't2',
    title: 'Deposit',
    subtitle: 'Online · Full Detail',
    amountCents: 5000,
    tone: 'in',
    method: 'online',
    dayGroup: 'Today',
  },
  {
    id: 't3',
    title: 'Interior Clean',
    subtitle: 'Marked paid · Sam R.',
    amountCents: 12000,
    tone: 'in',
    method: 'cash',
    dayGroup: 'Yesterday',
  },
  {
    id: 't4',
    title: 'Sent to your bank',
    subtitle: 'Payout',
    amountCents: -210000,
    tone: 'out',
    method: 'payout',
    dayGroup: 'Yesterday',
  },
  {
    id: 't5',
    title: 'Ceramic package',
    subtitle: 'Tap to Pay · Alex P.',
    amountCents: 45000,
    tone: 'in',
    method: 'tap',
    dayGroup: 'Yesterday',
  },
  {
    id: 't6',
    title: 'Maintenance plan',
    subtitle: 'Online · monthly',
    amountCents: 8900,
    tone: 'in',
    method: 'online',
    dayGroup: 'Mon',
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
    title: 'Sent to your bank',
    subtitle: 'Payout',
    amountCents: -480000,
    tone: 'out',
    method: 'payout',
    dayGroup: 'Sun',
  },
  {
    id: 't9',
    title: 'Paint correction',
    subtitle: 'Tap to Pay · Taylor B.',
    amountCents: 55000,
    tone: 'in',
    method: 'tap',
    dayGroup: 'Sun',
  },
  {
    id: 't10',
    title: 'Express wash',
    subtitle: 'Marked paid · walk-in',
    amountCents: 4500,
    tone: 'in',
    method: 'cash',
    dayGroup: 'Sat',
  },
];
