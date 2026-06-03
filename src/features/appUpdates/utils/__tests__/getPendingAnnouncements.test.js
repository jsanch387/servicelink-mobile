import { getPendingAnnouncements } from '../getPendingAnnouncements';

describe('getPendingAnnouncements', () => {
  const announcements = [
    { id: 'first', title: 'First', bullets: [] },
    { id: 'second', title: 'Second', bullets: [] },
    { id: 'third', title: 'Third', bullets: [] },
  ];

  it('returns all announcements when nothing was seen', () => {
    expect(getPendingAnnouncements(announcements, [])).toEqual(announcements);
  });

  it('filters out seen ids while preserving order', () => {
    expect(getPendingAnnouncements(announcements, ['second'])).toEqual([
      { id: 'first', title: 'First', bullets: [] },
      { id: 'third', title: 'Third', bullets: [] },
    ]);
  });

  it('ignores entries without an id', () => {
    expect(
      getPendingAnnouncements(
        [
          { title: 'No id', bullets: [] },
          { id: 'ok', title: 'Ok', bullets: [] },
        ],
        [],
      ),
    ).toEqual([{ id: 'ok', title: 'Ok', bullets: [] }]);
  });
});
