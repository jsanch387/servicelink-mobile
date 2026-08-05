import {
  NEXT_UP_COACH_TIP_DONE,
  NEXT_UP_COACH_TIP_MARK_COMPLETE,
  NEXT_UP_COACH_TIP_ON_MY_WAY,
  NEXT_UP_COACH_TIP_SLIDE_TO_START,
  resolveNextUpCoachTipId,
} from '../constants/nextUpCoachTips';
import { parseSeenNextUpCoachTipIds } from '../storage/nextUpCoachTipStorage';

describe('resolveNextUpCoachTipId', () => {
  it('maps each actionable Next Up state to a tip', () => {
    expect(resolveNextUpCoachTipId('upcoming', null)).toBe(NEXT_UP_COACH_TIP_ON_MY_WAY);
    expect(resolveNextUpCoachTipId('en_route', null)).toBe(NEXT_UP_COACH_TIP_SLIDE_TO_START);
    expect(resolveNextUpCoachTipId('working', 'handoff')).toBe(NEXT_UP_COACH_TIP_DONE);
    expect(resolveNextUpCoachTipId('working', 'ready')).toBe(NEXT_UP_COACH_TIP_MARK_COMPLETE);
  });

  it('skips tips when there is no matching teachable CTA', () => {
    expect(resolveNextUpCoachTipId('complete', null)).toBeNull();
  });
});

describe('parseSeenNextUpCoachTipIds', () => {
  it('parses stored tip ids', () => {
    expect(parseSeenNextUpCoachTipIds(JSON.stringify(['on_my_way', 'done']))).toEqual([
      'on_my_way',
      'done',
    ]);
    expect(parseSeenNextUpCoachTipIds('not-json')).toEqual([]);
  });
});
