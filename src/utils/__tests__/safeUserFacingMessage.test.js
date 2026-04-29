import { safeUserFacingMessage } from '../safeUserFacingMessage';

describe('safeUserFacingMessage', () => {
  it('allows short generic app messages', () => {
    expect(safeUserFacingMessage('Could not load business')).toBe('Could not load business');
    expect(safeUserFacingMessage(new Error('Invalid login credentials'))).toBe(
      'Invalid login credentials',
    );
  });

  it('replaces messages containing email-like @', () => {
    expect(safeUserFacingMessage('User foo@bar.com exists')).toMatch(/try again/i);
  });

  it('replaces messages containing UUIDs', () => {
    expect(safeUserFacingMessage('invalid id 550e8400-e29b-41d4-a716-446655440000')).toMatch(
      /try again/i,
    );
  });

  it('replaces postgres-style errors', () => {
    expect(safeUserFacingMessage('duplicate key value violates unique constraint')).toMatch(
      /try again/i,
    );
  });

  it('replaces long blobs', () => {
    const long = 'x'.repeat(300);
    expect(safeUserFacingMessage(long)).toMatch(/try again/i);
  });

  it('uses custom fallback', () => {
    expect(safeUserFacingMessage('a@b.c', { fallback: 'Nope' })).toBe('Nope');
  });

  it('maps fetch / TypeError network failures to friendly copy', () => {
    expect(safeUserFacingMessage(new Error('TypeError: Network request failed'))).toMatch(
      /connect|internet/i,
    );
    expect(safeUserFacingMessage('Failed to fetch')).toMatch(/connect|internet/i);
  });
});
