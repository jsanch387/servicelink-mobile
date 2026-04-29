import { DEPOSIT_AMOUNT_MODE } from '../constants/depositAmount';
import { CUSTOMER_PAYMENT_METHOD } from '../constants/customerPaymentMethods';
import {
  centsToDepositAmountString,
  mapPaymentSettingsToFormHydration,
  mapUiCheckoutMethodToCheckoutMode,
  percentDepositToAmountString,
} from '../utils/paymentSettingsMaps';

describe('centsToDepositAmountString', () => {
  it('converts whole dollars', () => {
    expect(centsToDepositAmountString(5000)).toBe('50');
  });

  it('converts fractional dollars', () => {
    expect(centsToDepositAmountString(5025)).toBe('50.25');
  });
});

describe('percentDepositToAmountString', () => {
  it('clamps to 0–100', () => {
    expect(percentDepositToAmountString(150)).toBe('100');
    expect(percentDepositToAmountString(-3)).toBe('0');
  });
});

describe('mapUiCheckoutMethodToCheckoutMode', () => {
  it('maps UI ids to DB checkout_mode', () => {
    expect(mapUiCheckoutMethodToCheckoutMode(CUSTOMER_PAYMENT_METHOD.IN_PERSON_ONLY)).toBe(
      'in_person',
    );
    expect(mapUiCheckoutMethodToCheckoutMode(CUSTOMER_PAYMENT_METHOD.IN_APP_ONLY)).toBe('in_app');
    expect(mapUiCheckoutMethodToCheckoutMode(CUSTOMER_PAYMENT_METHOD.CUSTOMER_CHOOSES)).toBe(
      'customer_choice',
    );
  });
});

describe('mapPaymentSettingsToFormHydration', () => {
  it('maps checkout_mode and fixed deposit from cents', () => {
    const h = mapPaymentSettingsToFormHydration({
      business_id: 'b1',
      payments_enabled: true,
      checkout_mode: 'in_app',
      deposits_enabled: true,
      deposit_type: 'fixed',
      deposit_value: 2500,
      currency: 'usd',
    });
    expect(h.paymentsEnabled).toBe(true);
    expect(h.selectedMethodId).toBe(CUSTOMER_PAYMENT_METHOD.IN_APP_ONLY);
    expect(h.requireDeposits).toBe(true);
    expect(h.depositAmount).toBe('25');
    expect(h.depositMode).toBe(DEPOSIT_AMOUNT_MODE.FIXED);
  });

  it('defaults invalid checkout_mode to customer chooses', () => {
    const h = mapPaymentSettingsToFormHydration({
      business_id: 'b1',
      payments_enabled: false,
      checkout_mode: 'bogus',
      deposits_enabled: false,
      deposit_type: 'percent',
      deposit_value: 12,
      currency: 'usd',
    });
    expect(h.selectedMethodId).toBe(CUSTOMER_PAYMENT_METHOD.CUSTOMER_CHOOSES);
    expect(h.depositAmount).toBe('12');
    expect(h.depositMode).toBe(DEPOSIT_AMOUNT_MODE.PERCENTAGE);
  });

  it('uses defaults when row is null', () => {
    const h = mapPaymentSettingsToFormHydration(null);
    expect(h.paymentsEnabled).toBe(false);
    expect(h.depositMode).toBe(DEPOSIT_AMOUNT_MODE.PERCENTAGE);
  });
});
