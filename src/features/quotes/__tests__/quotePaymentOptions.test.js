import { CUSTOMER_PAYMENT_METHOD } from '../../payments/constants/customerPaymentMethods';
import { DEPOSIT_AMOUNT_MODE } from '../../payments/constants/depositAmount';
import {
  QUOTE_PAYMENT_METHOD,
  defaultQuotePaymentMethods,
  normalizeQuotePaymentOptions,
  quotePaymentCollection,
  quotePaymentCustomerChooses,
  quotePaymentSelectionSummary,
  resolveQuotePaymentAvailability,
  toggleQuotePaymentMethod,
} from '../utils/quotePaymentOptions';

const cardsOn = {
  stripeConnectReady: true,
  paymentsEnabled: true,
  requireDeposits: true,
  depositMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
  depositAmount: '25',
};

describe('resolveQuotePaymentAvailability', () => {
  it('hides card options until Stripe is connected and payments are on', () => {
    const availability = resolveQuotePaymentAvailability({
      ...cardsOn,
      stripeConnectReady: false,
    });
    expect(availability.deposit).toBe(false);
    expect(availability.payInFull).toBe(false);
    expect(availability.payInPerson).toBe(true);
  });

  it('offers a deposit only when a positive deposit is saved', () => {
    expect(resolveQuotePaymentAvailability(cardsOn).deposit).toBe(true);
    expect(resolveQuotePaymentAvailability(cardsOn).depositLabel).toBe('25%');
    expect(resolveQuotePaymentAvailability({ ...cardsOn, requireDeposits: false }).deposit).toBe(
      false,
    );
    expect(resolveQuotePaymentAvailability({ ...cardsOn, depositAmount: '0' }).deposit).toBe(false);
  });

  it('formats a fixed deposit in dollars', () => {
    const availability = resolveQuotePaymentAvailability({
      ...cardsOn,
      depositMode: DEPOSIT_AMOUNT_MODE.FIXED,
      depositAmount: '50',
    });
    expect(availability.depositLabel).toBe('$50.00');
  });
});

describe('defaultQuotePaymentMethods', () => {
  const withDeposit = resolveQuotePaymentAvailability(cardsOn);
  const cardsOnly = resolveQuotePaymentAvailability({ ...cardsOn, requireDeposits: false });
  const inPersonOnly = resolveQuotePaymentAvailability({ ...cardsOn, paymentsEnabled: false });

  it('starts from in-person when cards are unavailable', () => {
    expect(defaultQuotePaymentMethods(inPersonOnly, 'customer_choice')).toEqual([
      QUOTE_PAYMENT_METHOD.PAY_IN_PERSON,
    ]);
  });

  it('requires the deposit when the business collects deposits in the app', () => {
    expect(defaultQuotePaymentMethods(withDeposit, CUSTOMER_PAYMENT_METHOD.IN_APP_ONLY)).toEqual([
      QUOTE_PAYMENT_METHOD.DEPOSIT,
    ]);
  });

  it('lets the customer choose deposit, full payment, or pay in person', () => {
    expect(defaultQuotePaymentMethods(withDeposit, 'customer_choice')).toEqual([
      QUOTE_PAYMENT_METHOD.DEPOSIT,
      QUOTE_PAYMENT_METHOD.PAY_IN_FULL,
      QUOTE_PAYMENT_METHOD.PAY_IN_PERSON,
    ]);
  });

  it('omits the deposit when deposits are off', () => {
    expect(defaultQuotePaymentMethods(cardsOnly, 'customer_choice')).toEqual([
      QUOTE_PAYMENT_METHOD.PAY_IN_FULL,
      QUOTE_PAYMENT_METHOD.PAY_IN_PERSON,
    ]);
    expect(defaultQuotePaymentMethods(cardsOnly, 'in_app')).toEqual([
      QUOTE_PAYMENT_METHOD.PAY_IN_FULL,
    ]);
  });
});

describe('quote payment selection', () => {
  it('lets the customer choose by selecting every available method', () => {
    const availability = resolveQuotePaymentAvailability(cardsOn);
    const all = [
      QUOTE_PAYMENT_METHOD.DEPOSIT,
      QUOTE_PAYMENT_METHOD.PAY_IN_FULL,
      QUOTE_PAYMENT_METHOD.PAY_IN_PERSON,
    ];
    expect(quotePaymentCustomerChooses(all, availability)).toBe(true);
    expect(quotePaymentCustomerChooses([QUOTE_PAYMENT_METHOD.DEPOSIT], availability)).toBe(false);
    expect(quotePaymentSelectionSummary(all)).toBe('Customer chooses');
  });

  it('toggles methods and describes a customer choice', () => {
    const next = toggleQuotePaymentMethod(
      [QUOTE_PAYMENT_METHOD.DEPOSIT],
      QUOTE_PAYMENT_METHOD.PAY_IN_FULL,
    );
    expect(next).toEqual([QUOTE_PAYMENT_METHOD.DEPOSIT, QUOTE_PAYMENT_METHOD.PAY_IN_FULL]);
    expect(quotePaymentSelectionSummary(next)).toBe('Customer chooses: a deposit or full payment');
    expect(quotePaymentSelectionSummary([QUOTE_PAYMENT_METHOD.PAY_IN_PERSON])).toBe(
      'Pay in person',
    );
  });

  it('rejects a deposit the business cannot offer', () => {
    const availability = resolveQuotePaymentAvailability({
      stripeConnectReady: true,
      paymentsEnabled: true,
      requireDeposits: false,
    });
    const result = normalizeQuotePaymentOptions([QUOTE_PAYMENT_METHOD.DEPOSIT], availability);
    expect(result.ok).toBe(false);
  });

  it('sends the selected methods in a stable order', () => {
    const result = normalizeQuotePaymentOptions([
      QUOTE_PAYMENT_METHOD.PAY_IN_PERSON,
      QUOTE_PAYMENT_METHOD.DEPOSIT,
    ]);
    expect(result).toEqual({
      ok: true,
      methods: [QUOTE_PAYMENT_METHOD.DEPOSIT, QUOTE_PAYMENT_METHOD.PAY_IN_PERSON],
    });
  });

  it('maps a selection to paymentCollection', () => {
    expect(quotePaymentCollection([QUOTE_PAYMENT_METHOD.DEPOSIT])).toBe('deposit');
    expect(quotePaymentCollection([QUOTE_PAYMENT_METHOD.PAY_IN_FULL])).toBe('full');
    expect(quotePaymentCollection([QUOTE_PAYMENT_METHOD.PAY_IN_PERSON])).toBe('none');
    expect(
      quotePaymentCollection([
        QUOTE_PAYMENT_METHOD.DEPOSIT,
        QUOTE_PAYMENT_METHOD.PAY_IN_FULL,
        QUOTE_PAYMENT_METHOD.PAY_IN_PERSON,
      ]),
    ).toBe('customer_choice');
  });
});
