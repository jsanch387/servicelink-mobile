import { Alert, Linking } from 'react-native';
import {
  showWebAccountFeatureAlert,
  WEB_ACCOUNT_FEATURE_ALERT_CONFIRM,
} from '../utils/showWebAccountFeatureAlert';

jest.mock('../../../lib/webAppOrigin', () => ({
  getWebAccountAdminUrl: () => 'https://myservicelink.app/login',
}));

describe('showWebAccountFeatureAlert', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows cancel and sign-in actions', () => {
    showWebAccountFeatureAlert({ title: 'Limit', message: 'Message body' });

    expect(Alert.alert).toHaveBeenCalledWith('Limit', 'Message body', [
      { text: 'Not now', style: 'cancel' },
      expect.objectContaining({ text: WEB_ACCOUNT_FEATURE_ALERT_CONFIRM }),
    ]);
  });

  it('opens web login when sign in is pressed', () => {
    showWebAccountFeatureAlert({ title: 'Limit', message: 'Message body' });
    const buttons = Alert.alert.mock.calls[0][2];
    const signIn = buttons.find((b) => b.text === WEB_ACCOUNT_FEATURE_ALERT_CONFIRM);
    signIn.onPress();

    expect(Linking.openURL).toHaveBeenCalledWith('https://myservicelink.app/login');
  });
});
