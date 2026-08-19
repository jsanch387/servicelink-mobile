import {
  isActiveListMember,
  isMembershipCancelScheduled,
  mapOwnerSubscriberStatus,
  resolveSubscriberPill,
  toYmd,
} from './membershipDerived';

/**
 * Apply the owner-subscriber payload from cancel (and similar) onto a catalog row.
 *
 * @param {object | null | undefined} existing
 * @param {Record<string, unknown> | null | undefined} payload
 */
export function applyOwnerSubscriberPayload(existing, payload) {
  if (!existing) return existing;
  if (!payload || typeof payload !== 'object') return existing;

  const status = mapOwnerSubscriberStatus(payload.status ?? existing.status);
  const hasCancelFlag =
    payload.cancelAtPeriodEnd !== undefined || payload.cancel_at_period_end !== undefined;
  const cancelScheduled = isMembershipCancelScheduled({
    status,
    cancelAtPeriodEnd: hasCancelFlag
      ? Boolean(payload.cancelAtPeriodEnd ?? payload.cancel_at_period_end)
      : (existing.cancelAtPeriodEnd ?? existing.cancelScheduled),
    cancelAt: payload.cancelAt ?? payload.cancel_at ?? existing.cancelAt,
  });
  const planRemoved = Boolean(payload.planRemoved ?? payload.plan_removed ?? existing.planRemoved);

  const visitRaw = payload.visitStatus ?? payload.visit_status;
  const visitStatus =
    typeof visitRaw === 'string' && visitRaw.trim() ? visitRaw.trim() : existing.visitStatus;

  const nextRaw =
    payload.nextBillingAt !== undefined
      ? payload.nextBillingAt
      : payload.next_billing_at !== undefined
        ? payload.next_billing_at
        : undefined;
  const nextBillingAt =
    nextRaw === undefined
      ? status === 'canceled' || cancelScheduled
        ? null
        : existing.nextBillingAt
      : nextRaw == null
        ? null
        : toYmd(nextRaw);

  const currentPeriodEnd =
    toYmd(payload.currentPeriodEnd ?? payload.current_period_end) || existing.currentPeriodEnd;
  const accessUntilYmd =
    toYmd(payload.accessUntilYmd ?? payload.access_until) ||
    toYmd(payload.cancelAt ?? payload.cancel_at) ||
    currentPeriodEnd ||
    existing.accessUntilYmd;

  const pill = resolveSubscriberPill({ status, cancelScheduled, visitStatus });
  const activeList = isActiveListMember({ status, cancelScheduled, planRemoved });

  return {
    ...existing,
    status,
    statusRaw: status,
    cancelAtPeriodEnd: cancelScheduled,
    cancelScheduled,
    planRemoved,
    visitStatus,
    nextBillingAt,
    nextBillingDate: nextBillingAt,
    currentPeriodEnd,
    accessUntilYmd,
    pillLabel: pill.label,
    pillTone: pill.tone,
    isActiveList: activeList,
    isCanceledList: !activeList,
  };
}

/**
 * Replace one subscriber in the memberships catalog query cache.
 *
 * @param {{ plans?: unknown[]; subscribers?: object[] } | undefined} catalog
 * @param {string} subscriberId
 * @param {Record<string, unknown>} payload
 */
export function replaceCatalogSubscriber(catalog, subscriberId, payload) {
  const id = String(subscriberId ?? '').trim();
  if (!catalog || !id) return catalog;
  const subscribers = Array.isArray(catalog.subscribers) ? catalog.subscribers : [];
  return {
    ...catalog,
    subscribers: subscribers.map((row) =>
      String(row?.id ?? '') === id ? applyOwnerSubscriberPayload(row, payload) : row,
    ),
  };
}
