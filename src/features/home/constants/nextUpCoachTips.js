/** Progressive Next Up coach tips for customer SMS lifecycle (once per tip). */

export const NEXT_UP_COACH_TIP_ON_MY_WAY = 'on_my_way';
export const NEXT_UP_COACH_TIP_SLIDE_TO_START = 'slide_to_start';
export const NEXT_UP_COACH_TIP_DONE = 'done';
export const NEXT_UP_COACH_TIP_MARK_COMPLETE = 'mark_complete';

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   winLabel: string;
 *   icon: import('@expo/vector-icons/Ionicons').IconProps['name'];
 *   iconColor: string;
 *   iconBackground: string;
 * }} NextUpCoachTip
 */

/** @type {Record<string, NextUpCoachTip>} */
export const NEXT_UP_COACH_TIPS = {
  [NEXT_UP_COACH_TIP_ON_MY_WAY]: {
    id: NEXT_UP_COACH_TIP_ON_MY_WAY,
    title: 'On my way texts them',
    winLabel: 'Nice',
    icon: 'navigate-outline',
    iconColor: '#0a84ff',
    iconBackground: 'rgba(10, 132, 255, 0.16)',
  },
  [NEXT_UP_COACH_TIP_SLIDE_TO_START]: {
    id: NEXT_UP_COACH_TIP_SLIDE_TO_START,
    title: 'Slide to start texts them',
    winLabel: 'Nice',
    icon: 'play-outline',
    iconColor: '#10b981',
    iconBackground: 'rgba(16, 185, 129, 0.16)',
  },
  [NEXT_UP_COACH_TIP_DONE]: {
    id: NEXT_UP_COACH_TIP_DONE,
    title: 'Done texts them',
    winLabel: 'Nice',
    icon: 'flag-outline',
    iconColor: '#f59e0b',
    iconBackground: 'rgba(245, 158, 11, 0.16)',
  },
  [NEXT_UP_COACH_TIP_MARK_COMPLETE]: {
    id: NEXT_UP_COACH_TIP_MARK_COMPLETE,
    title: 'Mark complete texts their receipt',
    winLabel: 'You got it',
    icon: 'receipt-outline',
    iconColor: '#0891b2',
    iconBackground: 'rgba(8, 145, 178, 0.16)',
  },
};

/**
 * Which coach tip matches the current Next Up CTA state.
 *
 * @param {'upcoming' | 'en_route' | 'working' | 'complete'} actionMode
 * @param {'handoff' | 'ready' | null | undefined} workingPhase
 * @returns {string | null}
 */
export function resolveNextUpCoachTipId(actionMode, workingPhase) {
  if (actionMode === 'upcoming') {
    return NEXT_UP_COACH_TIP_ON_MY_WAY;
  }
  if (actionMode === 'en_route') {
    return NEXT_UP_COACH_TIP_SLIDE_TO_START;
  }
  if (actionMode === 'working' && workingPhase === 'handoff') {
    return NEXT_UP_COACH_TIP_DONE;
  }
  if (actionMode === 'working' && workingPhase === 'ready') {
    return NEXT_UP_COACH_TIP_MARK_COMPLETE;
  }
  return null;
}
