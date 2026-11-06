/**
 * @typedef {object} CompleteVisitBreakdownLine
 * @property {string} id
 * @property {string} label
 * @property {string | null} [subtitle]
 * @property {number} amount
 * @property {'service' | 'addon' | 'fee' | 'discount'} tone
 * @property {boolean} [removable]
 */

/**
 * Groups complete-visit lines into one service list, then fees and discounts.
 *
 * @param {{
 *   lineItems?: Array<{
 *     id: string;
 *     label: string;
 *     sublabel?: string | null;
 *     amount: number;
 *     kind?: string;
 *   }>;
 *   adjustments?: Array<{ id: string; label: string; amount: number }>;
 * }} params
 * @returns {{
 *   lines: CompleteVisitBreakdownLine[];
 *   tax: CompleteVisitBreakdownLine | null;
 *   adjustments: CompleteVisitBreakdownLine[];
 *   itemCount: number;
 * }}
 */
export function groupCompleteVisitBreakdown({ lineItems, adjustments }) {
  /** @type {CompleteVisitBreakdownLine[]} */
  const lines = [];
  /** @type {CompleteVisitBreakdownLine | null} */
  let tax = null;
  /** @type {CompleteVisitBreakdownLine[]} */
  const adjustmentLines = [];

  for (const item of lineItems ?? []) {
    const amount = Number(item?.amount) || 0;
    const kind = String(item?.kind ?? '').trim();
    if (kind === 'tax') {
      tax = {
        id: item.id,
        label: item.label,
        amount,
        tone: 'service',
      };
      continue;
    }
    if (kind === 'discount' || amount < 0) {
      adjustmentLines.push({
        id: item.id,
        label: item.label,
        amount,
        tone: 'discount',
      });
      continue;
    }
    lines.push({
      id: item.id,
      label: item.label,
      amount,
      tone: kind === 'addon' ? 'addon' : 'service',
    });
  }

  for (const item of adjustments ?? []) {
    const amount = Number(item?.amount) || 0;
    if (!item?.id || amount === 0) {
      continue;
    }
    const kind = String(item?.kind ?? '').trim();
    adjustmentLines.push({
      id: item.id,
      label: item.label,
      amount,
      tone: kind === 'discount' || amount < 0 ? 'discount' : 'fee',
      removable: true,
    });
  }

  return {
    lines,
    tax,
    adjustments: adjustmentLines,
    itemCount: lines.length + adjustmentLines.length + (tax ? 1 : 0),
  };
}
