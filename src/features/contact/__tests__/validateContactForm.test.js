import { validateContactForm } from '../utils/validateContactForm';

describe('validateContactForm', () => {
  const valid = {
    topic: 'bug_report',
    message: 'The bookings list does not refresh after I approve a quote.',
  };

  it('accepts valid input', () => {
    expect(validateContactForm(valid)).toEqual({ ok: true });
  });

  it('rejects short message', () => {
    expect(validateContactForm({ ...valid, message: 'too short' })).toEqual({
      ok: false,
      error: 'Message must be at least 10 characters.',
    });
  });

  it('rejects invalid topic', () => {
    expect(validateContactForm({ ...valid, topic: 'spam' })).toEqual({
      ok: false,
      error: 'Choose a topic.',
    });
  });
});
