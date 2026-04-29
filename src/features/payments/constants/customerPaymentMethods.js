/** UI-only keys for “How customers pay” — wire to API later. */
export const CUSTOMER_PAYMENT_METHOD = {
  IN_PERSON_ONLY: 'in_person_only',
  IN_APP_ONLY: 'in_app_only',
  CUSTOMER_CHOOSES: 'customer_chooses',
};

export const CUSTOMER_PAYMENT_METHOD_OPTIONS = [
  {
    id: CUSTOMER_PAYMENT_METHOD.IN_PERSON_ONLY,
    title: 'In person only',
    description: 'You get paid when you meet them. No card is charged through the app.',
  },
  {
    id: CUSTOMER_PAYMENT_METHOD.IN_APP_ONLY,
    title: 'In the app only',
    description: 'They pay in full by card when they book. There is no in-person option.',
  },
  {
    id: CUSTOMER_PAYMENT_METHOD.CUSTOMER_CHOOSES,
    title: 'Customer chooses at checkout',
    description: 'They choose when they book: card in the app or paying you in person.',
  },
];
