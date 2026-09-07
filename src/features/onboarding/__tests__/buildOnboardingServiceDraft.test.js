import {
  buildOnboardingServiceDraft,
  fillOnboardingServiceDescription,
} from '../utils/buildOnboardingServiceDraft';

describe('buildOnboardingServiceDraft', () => {
  it('uses the name as the description and defaults an empty price', () => {
    expect(
      buildOnboardingServiceDraft({
        id: 'svc-1',
        name: '  Auto detailing  ',
        priceInput: '',
        durationMinutes: 60,
      }),
    ).toEqual({
      id: 'svc-1',
      name: 'Auto detailing',
      description: 'Auto detailing',
      priceInput: '0',
      durationMinutes: 60,
    });
  });

  it('returns null without a name', () => {
    expect(buildOnboardingServiceDraft({ id: 'svc-1', name: '   ', priceInput: '50' })).toBeNull();
  });
});

describe('fillOnboardingServiceDescription', () => {
  it('keeps an existing description', () => {
    expect(
      fillOnboardingServiceDescription({
        name: 'Full detail',
        description: 'Interior and exterior',
      }),
    ).toEqual({
      name: 'Full detail',
      description: 'Interior and exterior',
    });
  });

  it('uses the service name when description is blank', () => {
    expect(
      fillOnboardingServiceDescription({
        name: '  Auto detailing  ',
        description: '   ',
        priceInput: '50',
      }),
    ).toEqual({
      name: 'Auto detailing',
      description: 'Auto detailing',
      priceInput: '50',
    });
  });
});
