import { hasCategoryOrderChanges } from '../utils/hasCategoryOrderChanges';

describe('hasCategoryOrderChanges', () => {
  it('returns false when order matches', () => {
    const categories = [{ id: 'cat-a' }, { id: 'cat-b' }];
    expect(hasCategoryOrderChanges(categories, categories)).toBe(false);
  });

  it('returns true when draft order differs', () => {
    const catalog = [{ id: 'cat-a' }, { id: 'cat-b' }];
    const draft = [{ id: 'cat-b' }, { id: 'cat-a' }];
    expect(hasCategoryOrderChanges(catalog, draft)).toBe(true);
  });

  it('returns false when lengths differ', () => {
    expect(hasCategoryOrderChanges([{ id: 'cat-a' }], [])).toBe(false);
  });
});
