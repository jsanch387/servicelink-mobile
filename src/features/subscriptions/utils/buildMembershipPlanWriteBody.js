import { clampCadenceCount, normalizeCadenceInterval } from '../constants/planCadence';

/**
 * Map create/edit sheet draft → API write body.
 *
 * @param {object} draft
 * @param {string} draft.name
 * @param {string} [draft.description]
 * @param {number} [draft.visitDurationMinutes]
 * @param {Array<{ count?: number; interval?: string; priceCents?: number }>|null|undefined} draft.offeredSchedules
 * @param {string | null | undefined} [businessId]
 * @returns {{
 *   name: string;
 *   description: string;
 *   visitDurationMinutes: number;
 *   cadenceOptions: Array<{ intervalUnit: 'week' | 'month'; intervalCount: number; priceCents: number }>;
 *   businessId?: string;
 * }}
 */
export function buildMembershipPlanWriteBody(draft, businessId) {
  const name = String(draft?.name ?? '').trim();
  const description = String(draft?.description ?? '').trim();
  const rawDuration = Math.round(Number(draft?.visitDurationMinutes)) || 60;
  const snapped = Math.round(rawDuration / 30) * 30;
  const visitDurationMinutes = Math.max(30, Math.min(630, snapped || 60));

  /** @type {Map<string, { intervalUnit: 'week' | 'month'; intervalCount: number; priceCents: number }>} */
  const byKey = new Map();
  for (const row of draft?.offeredSchedules ?? []) {
    const intervalUnit = normalizeCadenceInterval(row?.interval);
    const intervalCount = clampCadenceCount(row?.count, intervalUnit);
    const priceCents = Math.max(0, Math.round(Number(row?.priceCents)) || 0);
    if (priceCents <= 0) continue;
    const key = `${intervalUnit}:${intervalCount}`;
    byKey.set(key, { intervalUnit, intervalCount, priceCents });
  }

  /** @type {Record<string, unknown>} */
  const body = {
    name,
    description,
    visitDurationMinutes,
    cadenceOptions: [...byKey.values()],
  };

  const bid = String(businessId ?? '').trim();
  if (bid) body.businessId = bid;

  return /** @type {typeof body & { cadenceOptions: Array<{ intervalUnit: 'week' | 'month'; intervalCount: number; priceCents: number }> }} */ (
    body
  );
}
