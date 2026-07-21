import {
  socialMediaFromDb,
  socialMediaToDb,
  socialMediaFingerprint,
  socialMediaPublicUrl,
} from '../utils/socialMedia';

describe('socialMedia', () => {
  it('normalizes handles and strips @', () => {
    expect(socialMediaFromDb({ instagram: ' @MyHandle ', tiktok: '@@tt' })).toEqual({
      instagram: 'MyHandle',
      tiktok: 'tt',
    });
  });

  it('tolerates null / non-object jsonb', () => {
    expect(socialMediaFromDb(null)).toEqual({ instagram: '', tiktok: '' });
    expect(socialMediaFromDb('nope')).toEqual({ instagram: '', tiktok: '' });
  });

  it('omits empty keys when writing to db', () => {
    expect(socialMediaToDb({ instagram: 'shop', tiktok: '' })).toEqual({ instagram: 'shop' });
    expect(socialMediaToDb({ instagram: '', tiktok: '' })).toEqual({});
  });

  it('fingerprints for dirty detection', () => {
    expect(socialMediaFingerprint({ instagram: '@a', tiktok: 'b' })).toBe(
      socialMediaFingerprint({ instagram: 'a', tiktok: 'b' }),
    );
    expect(socialMediaFingerprint({ instagram: 'a', tiktok: '' })).not.toBe(
      socialMediaFingerprint({ instagram: 'a', tiktok: 'b' }),
    );
  });

  it('builds public profile URLs without storing @', () => {
    expect(socialMediaPublicUrl('instagram', 'myshop')).toBe('https://instagram.com/myshop');
    expect(socialMediaPublicUrl('tiktok', 'myshop')).toBe('https://www.tiktok.com/@myshop');
    expect(socialMediaPublicUrl('instagram', '')).toBe(null);
  });
});
