/** Space under the nav header — Apple large-title breathing room. */
export const CREATE_PAYMENT_PAGE_PAD_TOP = 28;

export const CREATE_PAYMENT_STEP = {
  CHOOSE: 'choose',
  COLLECT: 'collect',
  COLLECT_PAID: 'collect_paid',
  LINK_FORM: 'link_form',
  LINK_READY: 'link_ready',
};

export const CREATE_PAYMENT_TITLE = 'Get paid';

export const CREATE_PAYMENT_SUBTITLE = 'Take a payment.';

export const CREATE_PAYMENT_COLLECT_TITLE = 'Tap to pay';

export const CREATE_PAYMENT_COLLECT_SUBTITLE =
  'Type the amount. Tap Charge. Hold your iPhone out — they tap their card or phone on yours.';

export const CREATE_PAYMENT_PAID_TITLE = 'You’re paid';

export const CREATE_PAYMENT_PAID_SUBTITLE = 'This payment went through.';

export const CREATE_PAYMENT_LINK_TITLE = 'Payment link';

export const CREATE_PAYMENT_LINK_SUBTITLE =
  'Type the amount. We’ll make a link. Text or share it — they open it and pay.';

export const CREATE_PAYMENT_LINK_CREATE_LABEL = 'Create payment link';

export const CREATE_PAYMENT_LINK_READY_TITLE = 'Payment link ready';

export const CREATE_PAYMENT_LINK_READY_SUBTITLE =
  'Text or share this link. They open it and pay. You don’t need to wait with them.';

export const CREATE_PAYMENT_LINK_READY_EXPIRES =
  'This link stops working in 24 hours. Need another? Make a new one.';

export const CREATE_PAYMENT_MODE = {
  COLLECT_NOW: 'collect_now',
  SEND_LINK: 'send_link',
};

export const CREATE_PAYMENT_MODE_COPY = {
  [CREATE_PAYMENT_MODE.COLLECT_NOW]: {
    title: 'Tap to pay',
    subtitle: 'They tap their card or phone on your iPhone.',
    eyebrow: 'Now',
    icon: 'contactless-payment',
    iconLibrary: 'material-community',
  },
  [CREATE_PAYMENT_MODE.SEND_LINK]: {
    title: 'Payment link',
    subtitle: 'Send a link. They pay on their phone.',
    eyebrow: 'Later',
    icon: 'link-outline',
    iconLibrary: 'ionicons',
  },
};
