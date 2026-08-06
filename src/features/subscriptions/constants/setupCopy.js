export const SUBSCRIPTIONS_SETUP_TITLE = 'Offer memberships';
export const SUBSCRIPTIONS_SETUP_BODY =
  'Let customers pay on a schedule for ongoing service. Simple to set up, easy to manage.';
export const SUBSCRIPTIONS_SETUP_CTA = 'Turn on subscriptions';
export const SUBSCRIPTIONS_SETUP_BULLETS = [
  'Set a price and how often you visit',
  'Customers subscribe from your link',
  'Failed payments and cancels stay clear',
];

export const SUBSCRIPTIONS_NEEDS_PAYMENTS_TITLE = 'Set up payments first';
export const SUBSCRIPTIONS_NEEDS_PAYMENTS_BODY =
  'Memberships use the same Stripe account as booking payments. Connect Stripe, then come back here.';
export const SUBSCRIPTIONS_NEEDS_PAYMENTS_CTA = 'Go to Payments';

export const SUBSCRIPTIONS_CREATE_FIRST_TITLE = 'Create your first plan';
export const SUBSCRIPTIONS_CREATE_FIRST_BODY =
  'A plan is what customers subscribe to. Keep it simple.';
export const SUBSCRIPTIONS_CREATE_FIRST_CTA = 'Create a plan';

export const SUBSCRIPTIONS_CREATE_FIRST_POINTS = [
  {
    key: 'name_price',
    icon: 'cash-outline',
    title: 'Name & price',
    body: 'What they see and what they pay',
  },
  {
    key: 'how_often',
    icon: 'calendar-outline',
    title: 'How often',
    body: 'They pick a schedule when they subscribe',
  },
  {
    key: 'manage',
    icon: 'people-outline',
    title: 'Subscribers',
    body: 'See who’s active, past due, or canceled',
  },
];

export const SUBSCRIPTIONS_MEMBERS_EMPTY_AFTER_SETUP = {
  title: 'No subscribers yet',
  body: 'When someone subscribes, they show up here.',
};
