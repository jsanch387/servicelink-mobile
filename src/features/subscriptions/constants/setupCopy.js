/** App Store–safe: memberships require Pro; setup continues on web (same pattern as payments). */
export const SUBSCRIPTIONS_NON_PRO_TITLE = 'Offer memberships';
export const SUBSCRIPTIONS_NON_PRO_SUBTITLE =
  'Let customers pay on a schedule for ongoing service.';
export const SUBSCRIPTIONS_NON_PRO_CTA = 'Subscribe';
export const SUBSCRIPTIONS_NON_PRO_SECTION_LABEL = 'What you get';
export const SUBSCRIPTIONS_NON_PRO_BENEFITS = [
  {
    lead: 'Recurring plans',
    rest: 'Weekly, monthly, or custom.',
  },
  {
    lead: 'Share a link',
    rest: 'Customers subscribe themselves.',
  },
  {
    lead: 'Track members',
    rest: 'Active, past due, or canceled.',
  },
];

export const SUBSCRIPTIONS_PAYMENTS_OFF_TITLE = 'Turn on ServiceLink payments';
export const SUBSCRIPTIONS_PAYMENTS_OFF_BODY =
  'Memberships use the same checkout as bookings. Turn on payments to create your first plan.';
export const SUBSCRIPTIONS_PAYMENTS_OFF_CTA = 'Turn on payments';
export const SUBSCRIPTIONS_PAYMENTS_OFF_CONNECTED = 'You are connected to Stripe.';

export const SUBSCRIPTIONS_CREATE_FIRST_TITLE = 'Create a subscription';
export const SUBSCRIPTIONS_CREATE_FIRST_BODY =
  'Set a plan, share your link, and get paid on a schedule.';
export const SUBSCRIPTIONS_CREATE_FIRST_CTA = 'Create a subscription';
export const SUBSCRIPTIONS_CREATE_FIRST_HOW_LABEL = 'How it works';

export const SUBSCRIPTIONS_CREATE_FIRST_POINTS = [
  {
    key: 'create',
    icon: 'pricetag-outline',
    title: 'Create a plan',
    body: 'Name it, set the price, and how often you visit.',
  },
  {
    key: 'share',
    icon: 'link-outline',
    title: 'Share your link',
    body: 'Customers pick a plan and subscribe themselves.',
  },
  {
    key: 'manage',
    icon: 'people-outline',
    title: 'Manage members',
    body: 'See who’s active, past due, or canceled.',
  },
];

export const SUBSCRIPTIONS_MEMBERS_EMPTY_AFTER_SETUP = {
  title: 'No subscribers yet',
  body: 'When someone subscribes, they show up here.',
};
