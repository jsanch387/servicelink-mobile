import { Alert, Linking } from 'react-native';
import { getWebAccountAdminUrl } from '../../../lib/webAppOrigin';

export const WEB_ACCOUNT_FEATURE_ALERT_CONFIRM = 'Sign in on the web';

/**
 * Native alert when a feature needs account changes on web (App Store–safe; no in-app upgrade).
 *
 * @param {{ title: string; message: string }} params
 */
export function showWebAccountFeatureAlert({ title, message }) {
  Alert.alert(title, message, [
    { text: 'Not now', style: 'cancel' },
    {
      text: WEB_ACCOUNT_FEATURE_ALERT_CONFIRM,
      onPress: () => {
        void Linking.openURL(getWebAccountAdminUrl());
      },
    },
  ]);
}
