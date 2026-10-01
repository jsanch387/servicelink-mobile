import { APP_UPDATE_ANNOUNCEMENTS } from '../announcements';

describe('APP_UPDATE_ANNOUNCEMENTS', () => {
  it('announces Expenses', () => {
    expect(APP_UPDATE_ANNOUNCEMENTS.map((item) => item.id)).toEqual(['expenses-v1']);
  });

  it('uses unique announcement ids', () => {
    const ids = APP_UPDATE_ANNOUNCEMENTS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
