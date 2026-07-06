import {
  parseCompleteVisitServiceLine,
  splitCombinedServiceName,
} from '../utils/parseCompleteVisitServiceLine';

describe('parseCompleteVisitServiceLine', () => {
  it('splits em-dash combined service names', () => {
    expect(parseCompleteVisitServiceLine({ service_name: 'Full Detail — Premium' })).toEqual({
      label: 'Full Detail',
      sublabel: 'Premium',
    });
  });

  it('uses service_price_option_label when present', () => {
    expect(
      parseCompleteVisitServiceLine({
        service_name: 'Full Detail',
        service_price_option_label: 'Large SUV',
      }),
    ).toEqual({
      label: 'Full Detail',
      sublabel: 'Large SUV',
    });
  });

  it('returns base name only when no tier', () => {
    expect(parseCompleteVisitServiceLine({ service_name: 'Signature Shine' })).toEqual({
      label: 'Signature Shine',
      sublabel: null,
    });
  });

  it('splits parenthetical option suffix', () => {
    expect(splitCombinedServiceName('Full Detail (Large SUV)')).toEqual({
      label: 'Full Detail',
      sublabel: 'Large SUV',
    });
  });
});
