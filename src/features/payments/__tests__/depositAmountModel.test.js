import { DEPOSIT_AMOUNT_MODE, DEPOSIT_TYPE_API } from '../constants/depositAmount';
import {
  buildDepositSavePayload,
  isPositiveDepositAmount,
  sanitizeFixedDepositInput,
  sanitizePercentageDepositInput,
} from '../utils/depositAmountModel';

describe('sanitizeFixedDepositInput', () => {
  it('keeps digits and a single decimal with two fractional places', () => {
    expect(sanitizeFixedDepositInput('12.345')).toBe('12.34');
    expect(sanitizeFixedDepositInput('a1b2')).toBe('12');
  });
});

describe('sanitizePercentageDepositInput', () => {
  it('clamps whole part above 100', () => {
    expect(sanitizePercentageDepositInput('101')).toBe('100');
  });
});

describe('isPositiveDepositAmount', () => {
  it('rejects empty, zero, and non-numeric', () => {
    expect(isPositiveDepositAmount(DEPOSIT_AMOUNT_MODE.FIXED, '')).toBe(false);
    expect(isPositiveDepositAmount(DEPOSIT_AMOUNT_MODE.FIXED, '0')).toBe(false);
    expect(isPositiveDepositAmount(DEPOSIT_AMOUNT_MODE.FIXED, '0.00')).toBe(false);
    expect(isPositiveDepositAmount(DEPOSIT_AMOUNT_MODE.PERCENTAGE, '0')).toBe(false);
    expect(isPositiveDepositAmount(DEPOSIT_AMOUNT_MODE.FIXED, 'abc')).toBe(false);
  });

  it('accepts values greater than zero', () => {
    expect(isPositiveDepositAmount(DEPOSIT_AMOUNT_MODE.FIXED, '0.01')).toBe(true);
    expect(isPositiveDepositAmount(DEPOSIT_AMOUNT_MODE.FIXED, '25')).toBe(true);
    expect(isPositiveDepositAmount(DEPOSIT_AMOUNT_MODE.PERCENTAGE, '10')).toBe(true);
    expect(isPositiveDepositAmount(DEPOSIT_AMOUNT_MODE.PERCENTAGE, '0.5')).toBe(true);
  });
});

describe('buildDepositSavePayload', () => {
  it('returns fixed cents and type fixed', () => {
    const out = buildDepositSavePayload({
      depositsEnabled: true,
      depositMode: DEPOSIT_AMOUNT_MODE.FIXED,
      depositAmount: '25.50',
    });
    expect(out.depositType).toBe(DEPOSIT_TYPE_API.FIXED);
    expect(out.depositValue).toBe(2550);
    expect(out.depositsEnabled).toBe(true);
  });

  it('returns percent as whole number 0–100', () => {
    const out = buildDepositSavePayload({
      depositsEnabled: false,
      depositMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
      depositAmount: '33.7',
    });
    expect(out.depositType).toBe(DEPOSIT_TYPE_API.PERCENT);
    expect(out.depositValue).toBe(34);
    expect(out.depositsEnabled).toBe(false);
  });
});
