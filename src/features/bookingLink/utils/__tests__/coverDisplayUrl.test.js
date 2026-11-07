import { getCoverDisplayUrl } from '../coverDisplayUrl';

describe('getCoverDisplayUrl', () => {
  it('asks Supabase to resize a public cover', () => {
    expect(
      getCoverDisplayUrl(
        'https://example.supabase.co/storage/v1/object/public/business_images/businesses/1/banner.jpg?v=12',
      ),
    ).toBe(
      'https://example.supabase.co/storage/v1/render/image/public/business_images/businesses/1/banner.jpg?width=1080&quality=70&v=12',
    );
  });

  it('leaves a non-storage url unchanged', () => {
    expect(getCoverDisplayUrl('https://example.com/cover.jpg')).toBe(
      'https://example.com/cover.jpg',
    );
  });

  it('returns null when there is no cover', () => {
    expect(getCoverDisplayUrl(null)).toBeNull();
    expect(getCoverDisplayUrl('  ')).toBeNull();
  });
});
