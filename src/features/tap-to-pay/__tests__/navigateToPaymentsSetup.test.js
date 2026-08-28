import { PAYMENTS_SCREEN_TAB } from '../../payments/constants/paymentsScreenTabs';
import { ROUTES } from '../../../routes/routes';
import { navigateToPaymentsSetup } from '../utils/navigateToPaymentsSetup';

describe('navigateToPaymentsSetup', () => {
  it('navigates to More → Payments → Settings', () => {
    const navigation = { navigate: jest.fn() };

    navigateToPaymentsSetup(navigation);

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.MORE,
      params: {
        state: {
          routes: [
            { name: ROUTES.MORE_HOME },
            { name: ROUTES.MORE_PAYMENTS, params: { initialTab: PAYMENTS_SCREEN_TAB.SETTINGS } },
          ],
          index: 1,
        },
      },
    });
  });
});
