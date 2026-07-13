import { Alert } from 'react-native';
import { getMarketingCampaignDisplayStatus } from './marketingCampaignModel';

/**
 * @param {import('./marketingCampaignModel').MarketingCampaign | null | undefined} campaign
 * @returns {boolean}
 */
export function isMarketingCampaignShareRecommended(campaign) {
  if (!campaign) return false;
  const status = getMarketingCampaignDisplayStatus(campaign);
  return status === 'active' || status === 'scheduled';
}

/**
 * Opens share immediately for active/scheduled offers.
 * Asks before sharing ended or turned-off offers.
 *
 * @param {import('./marketingCampaignModel').MarketingCampaign} campaign
 * @param {() => void} onShare
 */
export function requestMarketingCampaignShare(campaign, onShare) {
  if (!campaign || typeof onShare !== 'function') return;

  if (isMarketingCampaignShareRecommended(campaign)) {
    onShare();
    return;
  }

  const status = getMarketingCampaignDisplayStatus(campaign);
  const title = status === 'ended' ? 'Offer ended' : 'Offer is off';
  const message =
    status === 'ended'
      ? 'This offer has ended. Share the graphic anyway?'
      : 'This offer is turned off. Share the graphic anyway?';

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Share anyway', onPress: onShare },
  ]);
}
