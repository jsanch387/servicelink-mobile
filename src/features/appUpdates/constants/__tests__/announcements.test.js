import { APP_UPDATE_ANNOUNCEMENTS } from '../announcements';

describe('APP_UPDATE_ANNOUNCEMENTS', () => {
  it('is empty until the next feature announcement ships', () => {
    expect(APP_UPDATE_ANNOUNCEMENTS).toEqual([]);
  });

  it('uses unique announcement ids', () => {
    const ids = APP_UPDATE_ANNOUNCEMENTS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
