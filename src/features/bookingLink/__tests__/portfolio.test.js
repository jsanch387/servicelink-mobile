import { portfolioImageKey } from '../utils/portfolio';

describe('portfolioImageKey', () => {
  it('prefers id', () => {
    expect(portfolioImageKey({ id: 'abc', storage_path: 'x', preview_url: 'y' })).toBe('abc');
  });

  it('falls back to storage_path then preview_url', () => {
    expect(portfolioImageKey({ storage_path: 'path/1' })).toBe('path/1');
    expect(portfolioImageKey({ preview_url: 'https://example.com/p.jpg' })).toBe(
      'https://example.com/p.jpg',
    );
  });
});
