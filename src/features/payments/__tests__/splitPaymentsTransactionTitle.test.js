import { splitPaymentsTransactionTitle } from '../utils/splitPaymentsTransactionTitle';

describe('splitPaymentsTransactionTitle', () => {
  it('keeps a plain service name', () => {
    expect(splitPaymentsTransactionTitle('Lights')).toEqual({
      primary: 'Lights',
      extraLabel: '',
    });
  });

  it('drops the pricing option after an em dash', () => {
    expect(splitPaymentsTransactionTitle('Signature Shine — SUV')).toEqual({
      primary: 'Signature Shine',
      extraLabel: '',
    });
  });

  it('lifts +N more into its own label', () => {
    expect(splitPaymentsTransactionTitle('Wash +1 more')).toEqual({
      primary: 'Wash',
      extraLabel: '+1 more',
    });
  });

  it('strips the pricing option and keeps +N more', () => {
    expect(splitPaymentsTransactionTitle('Signature Shine — SUV +2 more')).toEqual({
      primary: 'Signature Shine',
      extraLabel: '+2 more',
    });
  });

  it('returns empty parts when there is no title', () => {
    expect(splitPaymentsTransactionTitle('')).toEqual({
      primary: '',
      extraLabel: '',
    });
  });

  it('replaces mixed and double job titles with +N more', () => {
    expect(splitPaymentsTransactionTitle('Double jobs')).toEqual({
      primary: '',
      extraLabel: '+1 more',
    });
    expect(splitPaymentsTransactionTitle('Mixed jobs', 2)).toEqual({
      primary: '',
      extraLabel: '+2 more',
    });
  });

  it('keeps the service when mixed jobs is only a prefix', () => {
    expect(splitPaymentsTransactionTitle('Mixed jobs — Signature Shine')).toEqual({
      primary: 'Signature Shine',
      extraLabel: '',
    });
  });

  it('handles hyphenated double-jobs and spaced hyphens', () => {
    expect(splitPaymentsTransactionTitle('Double-jobs')).toEqual({
      primary: '',
      extraLabel: '+1 more',
    });
    expect(splitPaymentsTransactionTitle('Double jobs - Wash')).toEqual({
      primary: 'Wash',
      extraLabel: '+1 more',
    });
  });

  it('does not leave leftover “jobs” from Mixed job jobs', () => {
    expect(splitPaymentsTransactionTitle('Mixed job jobs', 1)).toEqual({
      primary: '',
      extraLabel: '+1 more',
    });
  });
});

