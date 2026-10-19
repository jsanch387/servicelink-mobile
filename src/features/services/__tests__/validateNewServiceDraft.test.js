import { validateNewServiceDraft } from '../utils/validateNewServiceDraft';

const ready = {
  name: 'Full detail',
  description: 'Wash, vacuum, and interior wipe-down.',
  price: '150',
  durationHHmm: '02:00',
  pricingOptions: [],
};

describe('validateNewServiceDraft', () => {
  it('accepts a service with a name, description, price, and duration', () => {
    expect(validateNewServiceDraft(ready)).toBeNull();
  });

  it('asks for each bookable field in plain language', () => {
    expect(validateNewServiceDraft({ ...ready, name: '  ' })).toBe('Add a service name.');
    expect(validateNewServiceDraft({ ...ready, description: '' })).toBe(
      'Add a short description of what customers get.',
    );
    expect(validateNewServiceDraft({ ...ready, price: '' })).toBe('Add a price.');
    expect(validateNewServiceDraft({ ...ready, durationHHmm: '' })).toBe(
      'Choose how long it takes.',
    );
  });

  it('accepts a service with no other prices', () => {
    expect(validateNewServiceDraft({ ...ready, pricingOptions: [] })).toBeNull();
  });

  it('checks each other price', () => {
    expect(
      validateNewServiceDraft({
        ...ready,
        pricingOptions: [{ label: 'SUV', price: '', durationHHmm: '02:30' }],
      }),
    ).toBe('Add a price for SUV.');
  });
});
