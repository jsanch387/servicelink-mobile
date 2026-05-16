import { mapCompleteOnboardingHttpError } from '../utils/mapCompleteOnboardingHttpError';

describe('mapCompleteOnboardingHttpError', () => {
  it('maps 401 to session message', () => {
    expect(mapCompleteOnboardingHttpError(401, 'Invalid or expired session')).toMatch(
      /session expired/i,
    );
  });

  it('prefers server message on 400', () => {
    expect(mapCompleteOnboardingHttpError(400, 'Slug is taken')).toBe('Slug is taken');
  });

  it('maps network errors', () => {
    expect(mapCompleteOnboardingHttpError(0, null)).toMatch(/connection/i);
  });
});
