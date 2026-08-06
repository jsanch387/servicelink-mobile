export const SUBSCRIPTIONS_TAB_ACTIVE = 'active';
export const SUBSCRIPTIONS_TAB_PAST_DUE = 'past_due';
export const SUBSCRIPTIONS_TAB_CANCELED = 'canceled';

export const SUBSCRIPTIONS_TAB_OPTIONS = [
  { key: SUBSCRIPTIONS_TAB_ACTIVE, label: 'Active' },
  { key: SUBSCRIPTIONS_TAB_PAST_DUE, label: 'Past due' },
  { key: SUBSCRIPTIONS_TAB_CANCELED, label: 'Canceled' },
];

/** Top-level hub on the live Subscriptions screen. */
export const SUBSCRIPTIONS_HUB_PLANS = 'plans';
export const SUBSCRIPTIONS_HUB_SUBSCRIBERS = 'subscribers';

export const SUBSCRIPTIONS_HUB_OPTIONS = [
  { key: SUBSCRIPTIONS_HUB_PLANS, label: 'Plans' },
  { key: SUBSCRIPTIONS_HUB_SUBSCRIBERS, label: 'Subscribers' },
];

export const SUBSCRIPTIONS_PLANS_EMPTY = {
  title: 'No plans yet',
  body: 'Create a membership plan customers can subscribe to.',
};

export const SUBSCRIPTIONS_LIST_EMPTY = {
  [SUBSCRIPTIONS_TAB_ACTIVE]: {
    title: 'No active subscriptions',
    body: 'When customers subscribe to a plan, they show up here.',
  },
  [SUBSCRIPTIONS_TAB_PAST_DUE]: {
    title: 'No past-due payments',
    body: 'Failed renewals will appear here so you can follow up.',
  },
  [SUBSCRIPTIONS_TAB_CANCELED]: {
    title: 'No canceled subscriptions',
    body: 'Customers who cancel will stay listed here for your records.',
  },
};

export const SUBSCRIPTION_CANCEL_ALERT_TITLE = 'Cancel subscription?';
export const SUBSCRIPTION_CANCEL_ALERT_MESSAGE =
  'They keep access until the end of the current billing period. No more visits will be scheduled after that. This can’t be undone from here.';
export const SUBSCRIPTION_CANCEL_BUTTON = 'Cancel subscription';

export const SUBSCRIPTION_DETAIL_NOT_FOUND =
  'We could not find this subscription. Go back and try again.';
