export const SUBSCRIPTIONS_TAB_ACTIVE = 'active';
export const SUBSCRIPTIONS_TAB_CANCELED = 'canceled';

export const SUBSCRIPTIONS_TAB_OPTIONS = [
  { key: SUBSCRIPTIONS_TAB_ACTIVE, label: 'Active' },
  { key: SUBSCRIPTIONS_TAB_CANCELED, label: 'Canceled' },
];

/** Top-level hub on the live Subscriptions screen. */
export const SUBSCRIPTIONS_HUB_PLANS = 'plans';
export const SUBSCRIPTIONS_HUB_SUBSCRIBERS = 'subscribers';

export const SUBSCRIPTIONS_HUB_OPTIONS = [
  { key: SUBSCRIPTIONS_HUB_PLANS, label: 'Subscriptions' },
  { key: SUBSCRIPTIONS_HUB_SUBSCRIBERS, label: 'Subscribers' },
];

export const SUBSCRIPTIONS_PLANS_EMPTY = {
  title: 'No subscriptions yet',
  body: 'Create a subscription to get started. They’ll show up here once they’re live.',
};

export const SUBSCRIPTIONS_LIST_EMPTY = {
  [SUBSCRIPTIONS_TAB_ACTIVE]: {
    title: 'No active subscribers',
    body: 'When customers subscribe, they show up here.',
  },
  [SUBSCRIPTIONS_TAB_CANCELED]: {
    title: 'No canceled subscribers',
    body: 'Canceled and ended memberships stay listed here for your records.',
  },
};

export const SUBSCRIPTION_CANCEL_ALERT_TITLE = 'Cancel subscription?';
export const SUBSCRIPTION_CANCEL_ALERT_MESSAGE =
  'They keep access until the period ends if you cancel at period end. Cancel now ends access immediately. Upcoming visits stay on the calendar until you cancel those separately.';
export const SUBSCRIPTION_CANCEL_BUTTON = 'Cancel subscription';
export const SUBSCRIPTION_CANCEL_KEEP = 'Keep subscription';
export const SUBSCRIPTION_CANCEL_PERIOD_END = 'Cancel at period end';
export const SUBSCRIPTION_CANCEL_NOW = 'Cancel now';

export const SUBSCRIPTION_REBOOK_BUTTON = 'Send schedule link';
export const SUBSCRIPTION_REBOOK_NO_CONTACT =
  'Add an email or phone on their profile so we can send a schedule link.';

export const SUBSCRIPTION_DETAIL_NOT_FOUND =
  'We could not find this subscription. Go back and try again.';

export const SUBSCRIPTION_CREATE_SUCCESS = 'Subscription created';
export const SUBSCRIPTION_SAVE_SUCCESS = 'Subscription saved';
export const SUBSCRIPTION_DELETE_SUCCESS = 'Subscription deleted';

export const SUBSCRIPTION_DELETE_ALERT_TITLE = 'Delete subscription?';
export const SUBSCRIPTION_DELETE_ALERT_MESSAGE =
  'This removes it from your list and booking link. Canceled members stay in your records.';
export const SUBSCRIPTION_DELETE_CONFIRM = 'Delete';
export const SUBSCRIPTION_DELETE_BLOCKED_TITLE = 'Can’t delete yet';
export const SUBSCRIPTION_DELETE_BLOCKED_MESSAGE =
  'Cancel or move subscribers first, then you can delete this subscription.';
