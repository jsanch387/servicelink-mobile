import { buildProfileCompletionChecklist } from '../edit/utils/profileCompletionChecklist';
import { BOOKING_SERVICE_TYPE_SHOP } from '../edit/constants/bookingLinkBookingTab';

describe('buildProfileCompletionChecklist', () => {
  it('returns zero percent when nothing is filled', () => {
    const result = buildProfileCompletionChecklist({});
    expect(result.percent).toBe(0);
    expect(result.items.every((item) => !item.complete)).toBe(true);
  });

  it('includes shop street when shop mode is selected', () => {
    const result = buildProfileCompletionChecklist({
      serviceTypeInput: BOOKING_SERVICE_TYPE_SHOP,
      shopStreetInput: '',
    });
    expect(result.items.some((item) => item.id === 'shopStreet')).toBe(true);
  });

  it('includes bio in checklist', () => {
    const result = buildProfileCompletionChecklist({ bioInput: 'We detail cars.' });
    const bioItem = result.items.find((item) => item.id === 'bio');
    expect(bioItem).toEqual({
      id: 'bio',
      label: 'Bio',
      complete: true,
    });
  });

  it('calculates percent from completed items', () => {
    const result = buildProfileCompletionChecklist({
      hasCover: true,
      hasLogo: true,
      nameInput: 'Shop',
      typeInput: 'Detailing',
      cityInput: 'Austin',
      stateInput: 'TX',
      zipInput: '78701',
      phoneInput: '(555) 234-5678',
      bioInput: 'Mobile detailing in Austin.',
      galleryImageCount: 1,
    });
    expect(result.percent).toBe(100);
  });
});
