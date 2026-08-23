/** Space under the nav header — Apple large-title breathing room. */
export const CREATE_PAYMENT_PAGE_PAD_TOP = 28;

export const CREATE_PAYMENT_STEP = {
  CHOOSE: 'choose',
  COLLECT: 'collect',
  LINK_FORM: 'link_form',
  LINK_READY: 'link_ready',
};

export const CREATE_PAYMENT_TITLE = 'Get paid';

export const CREATE_PAYMENT_SUBTITLE = 'Tap to pay or send a payment link.';

export const CREATE_PAYMENT_COLLECT_TITLE = 'Tap to pay';

export const CREATE_PAYMENT_COLLECT_SUBTITLE = 'They tap. You’re paid.';

export const CREATE_PAYMENT_LINK_TITLE = 'Payment link';

export const CREATE_PAYMENT_LINK_SUBTITLE = 'Add the amount and what it’s for.';

export const CREATE_PAYMENT_LINK_CREATE_LABEL = 'Create payment link';

export const CREATE_PAYMENT_LINK_READY_TITLE = 'Payment link ready';

export const CREATE_PAYMENT_LINK_READY_SUBTITLE = 'Share it or copy it. The customer pays.';

export const CREATE_PAYMENT_LINK_READY_EXPIRES = 'Expires in 24 hours.';

export const CREATE_PAYMENT_MODE = {
  COLLECT_NOW: 'collect_now',
  SEND_LINK: 'send_link',
};

export const CREATE_PAYMENT_MODE_COPY = {
  [CREATE_PAYMENT_MODE.COLLECT_NOW]: {
    title: 'Tap to pay',
    subtitle: 'Use your iPhone to collect.',
    icon: 'contactless-payment',
    iconLibrary: 'material-community',
  },
  [CREATE_PAYMENT_MODE.SEND_LINK]: {
    title: 'Payment link',
    subtitle: 'Share a link they can pay on.',
    icon: 'link-outline',
    iconLibrary: 'ionicons',
  },
};
