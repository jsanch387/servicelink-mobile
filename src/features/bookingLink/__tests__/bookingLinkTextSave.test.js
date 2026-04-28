import {
  bookingLinkTextBaselineFromProps,
  bookingLinkTextDraftFromEditFields,
  bookingLinkTextDirtyVsProps,
  bookingLinkTextIsDirty,
} from '../utils/bookingLinkTextSave';

describe('bookingLinkTextSave', () => {
  it('marks dirty when name changes', () => {
    const base = {
      businessName: 'A',
      businessType: 'T',
      businessCity: '',
      businessState: '',
      businessBio: '',
      phoneNumber: '',
    };
    expect(
      bookingLinkTextDirtyVsProps(base, {
        nameInput: 'B',
        typeInput: 'T',
        cityInput: '',
        stateInput: '',
        bioInput: '',
        phoneInput: '',
      }),
    ).toBe(true);
  });

  it('not dirty when form matches baseline (phone formatted same digits)', () => {
    const baseProps = {
      businessName: 'Shop',
      businessType: 'Detailing',
      businessCity: 'Austin',
      businessState: 'tx',
      businessBio: '',
      phoneNumber: '+15551234567',
    };
    expect(
      bookingLinkTextDirtyVsProps(baseProps, {
        nameInput: 'Shop',
        typeInput: 'Detailing',
        cityInput: 'Austin',
        stateInput: 'TX',
        bioInput: '',
        phoneInput: '(555) 123-4567',
      }),
    ).toBe(false);
  });

  it('snapshots equal after normalize state', () => {
    const b = bookingLinkTextBaselineFromProps({ businessState: 'ca', businessBio: undefined });
    const d = bookingLinkTextDraftFromEditFields({ stateInput: 'CA' });
    expect(bookingLinkTextIsDirty(b, d)).toBe(false);
  });
});
