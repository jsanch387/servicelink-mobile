import { MARKETING_TAB_PROMOS, MARKETING_TAB_SALES } from '../constants';

export const MARKETING_HOW_IT_WORKS_LINK_LABEL = 'How it works';
export const MARKETING_HOW_IT_WORKS_DISMISS_LABEL = 'Got it';

/** @type {Record<string, { title: string; intro: string; items: Array<{ icon: string; title: string; body: string }>; optionalNote: string }>} */
export const MARKETING_HOW_IT_WORKS_BY_TAB = {
  [MARKETING_TAB_PROMOS]: {
    title: 'How promo codes work',
    intro: 'Give customers a code to save when they book with you.',
    items: [
      {
        icon: 'ticket-outline',
        title: 'Create a code',
        body: 'Pick a code name, set the discount, and add dates only if you want them.',
      },
      {
        icon: 'share-outline',
        title: 'Share it anywhere',
        body: 'Post it on social, send it in a text, or share it however you reach customers.',
      },
      {
        icon: 'keypad-outline',
        title: 'They enter it when they book',
        body: 'The discount applies when they use your booking link and type in the code.',
      },
    ],
    optionalNote:
      'Tap New promo code below to create your first one. Turn it off anytime with the switch.',
  },
  [MARKETING_TAB_SALES]: {
    title: 'How sales work',
    intro: 'Run a discount on your booking link — no code needed.',
    items: [
      {
        icon: 'megaphone-outline',
        title: 'Name your sale',
        body: 'Set how much off — a dollar amount or a percent.',
      },
      {
        icon: 'calendar-outline',
        title: 'Dates are optional',
        body: 'Set a start and end date, or skip dates and turn the sale on or off yourself.',
      },
      {
        icon: 'link-outline',
        title: 'Customers see it automatically',
        body: 'Anyone on your booking link gets the deal while the sale is turned on.',
      },
    ],
    optionalNote: 'Tap New sale below to run your first sale.',
  },
};
