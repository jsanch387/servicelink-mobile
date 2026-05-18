import { resolveContactFormSubmitter } from '../utils/resolveContactFormSubmitter';

describe('resolveContactFormSubmitter', () => {
  it('uses account email and metadata name', () => {
    expect(
      resolveContactFormSubmitter({
        email: 'owner@example.com',
        user_metadata: { full_name: 'Alex Rivera' },
      }),
    ).toEqual({
      ok: true,
      name: 'Alex Rivera',
      email: 'owner@example.com',
    });
  });

  it('falls back to email local part when name is missing', () => {
    expect(
      resolveContactFormSubmitter({
        email: 'owner@example.com',
        user_metadata: {},
      }),
    ).toEqual({
      ok: true,
      name: 'owner',
      email: 'owner@example.com',
    });
  });

  it('rejects missing account email', () => {
    expect(resolveContactFormSubmitter({ email: '' })).toEqual({
      ok: false,
      error: 'Your account email is missing. Try signing out and back in.',
    });
  });
});
