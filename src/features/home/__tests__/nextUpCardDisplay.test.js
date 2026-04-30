import {
  buildNextUpHeadlines,
  formatNextUpServiceLine,
  formatNextUpVehicleLine,
  splitServiceNameForNextUp,
} from '../utils/nextUpCardDisplay';

describe('splitServiceNameForNextUp', () => {
  it('splits em-dash service tiers', () => {
    const out = splitServiceNameForNextUp('Signature Shine — SUV');
    expect(out.primary).toBe('Signature Shine');
    expect(out.detail).toBe('SUV');
  });

  it('joins multiple tier segments with em dash', () => {
    const out = splitServiceNameForNextUp('A — B — C');
    expect(out.primary).toBe('A');
    expect(out.detail).toBe('B — C');
  });

  it('returns single primary when no tier', () => {
    const out = splitServiceNameForNextUp('Full detail');
    expect(out.primary).toBe('Full detail');
    expect(out.detail).toBeNull();
  });
});

describe('formatNextUpServiceLine', () => {
  it('joins primary and tier with an em dash', () => {
    expect(formatNextUpServiceLine('Signature Shine', 'SUV')).toBe('Signature Shine — SUV');
  });

  it('rejoins multi-segment detail after split', () => {
    expect(formatNextUpServiceLine('A', 'B — C')).toBe('A — B — C');
  });

  it('returns primary only when no detail', () => {
    expect(formatNextUpServiceLine('Full detail', null)).toBe('Full detail');
  });

  it('returns detail only when primary is empty', () => {
    expect(formatNextUpServiceLine('', 'Premium')).toBe('Premium');
  });
});

describe('formatNextUpVehicleLine', () => {
  it('returns trimmed vehicle text', () => {
    expect(formatNextUpVehicleLine('  2021 Tesla Model 3  ')).toBe('2021 Tesla Model 3');
  });

  it('returns null when empty', () => {
    expect(formatNextUpVehicleLine('')).toBeNull();
    expect(formatNextUpVehicleLine('   ')).toBeNull();
  });
});

describe('buildNextUpHeadlines', () => {
  it('defaults missing fields', () => {
    const out = buildNextUpHeadlines({});
    expect(out.customerName).toBe('Customer');
    expect(out.servicePrimary).toBe('Service');
    expect(out.serviceDetail).toBeNull();
  });

  it('keeps customer and splits service', () => {
    const out = buildNextUpHeadlines({
      customer_name: 'Jordan Lee',
      service_name: 'Signature Shine — SUV',
    });
    expect(out.customerName).toBe('Jordan Lee');
    expect(out.servicePrimary).toBe('Signature Shine');
    expect(out.serviceDetail).toBe('SUV');
  });
});
