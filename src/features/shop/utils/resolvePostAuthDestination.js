/**
 * Where a signed-in user lands before main tabs.
 *
 * @param {{
 *   isActiveMember?: boolean;
 *   wasRemovedFromTeam?: boolean;
 *   onboardingDone?: boolean;
 *   onboardingInProgress?: boolean;
 *   choseOwnBusiness?: boolean;
 * }} [params]
 * @returns {'main' | 'onboarding' | 'removed'}
 */
export function resolvePostAuthDestination({
  isActiveMember = false,
  wasRemovedFromTeam = false,
  onboardingDone = false,
  onboardingInProgress = false,
  choseOwnBusiness = false,
} = {}) {
  if (isActiveMember || onboardingDone) {
    return 'main';
  }
  if (wasRemovedFromTeam && !choseOwnBusiness && !onboardingInProgress) {
    return 'removed';
  }
  return 'onboarding';
}
