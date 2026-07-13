/** @typedef {'promo_code' | 'sale'} MarketingCampaignKind */
/** @typedef {'active' | 'scheduled' | 'ended' | 'disabled'} MarketingCampaignStatus */

export const MARKETING_CAMPAIGN_KIND = {
  PROMO_CODE: 'promo_code',
  SALE: 'sale',
};

export const MARKETING_TAB_PROMOS = 'promos';
export const MARKETING_TAB_SALES = 'sales';

export const PROMO_CODES_EMPTY = {
  title: 'No promo codes',
  body: "You don't have any promo codes yet.",
};

export const SALES_EMPTY = {
  title: 'No sales',
  body: "You don't have any sales yet.",
};
