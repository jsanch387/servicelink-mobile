import { pickTrendChartLabelIndexes } from '../trendChartLabels';

describe('pickTrendChartLabelIndexes', () => {
  it('shows every tick when they fit', () => {
    expect(pickTrendChartLabelIndexes(4, 320)).toEqual([0, 1, 2, 3]);
  });

  it('keeps first and last and skips enough ticks so labels do not collide', () => {
    expect(pickTrendChartLabelIndexes(11, 320)).toEqual([0, 3, 6, 10]);
    expect(pickTrendChartLabelIndexes(16, 320)).toEqual([0, 4, 8, 12, 15]);
  });

  it('drops the second-to-last tick when it would sit on the last label', () => {
    expect(pickTrendChartLabelIndexes(11, 280)).toEqual([0, 3, 6, 10]);
  });
});
