import { isBusinessPortfolioStoragePath, portfolioRowStoragePath } from '../utils/storagePath';

describe('portfolioRowStoragePath', () => {
  const bid = '11111111-1111-1111-1111-111111111111';

  it('accepts canonical portfolio path', () => {
    const p = `businesses/${bid}/portfolio/abc.jpg`;
    expect(portfolioRowStoragePath({ storage_path: p }, bid)).toBe(p);
    expect(isBusinessPortfolioStoragePath(bid, p)).toBe(true);
  });

  it('rejects other businesses or kinds', () => {
    const other = 'businesses/other-id/portfolio/x.jpg';
    expect(portfolioRowStoragePath({ storage_path: other }, bid)).toBe('');
    expect(isBusinessPortfolioStoragePath(bid, other)).toBe(false);
  });

  it('returns empty without businessId', () => {
    expect(portfolioRowStoragePath({ storage_path: 'businesses/x/portfolio/y.jpg' }, '')).toBe('');
  });
});
