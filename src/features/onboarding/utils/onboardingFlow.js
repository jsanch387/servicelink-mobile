/**
 * The new setup is the default for accounts that have not started.
 * A flow that is already `v2`, or an in-progress setup with no flow, stays on the 5-step sequence.
 *
 * @param {{ onboarding_status?: string | null, onboarding_flow?: string | null }} state
 */
export function shouldStampNewOnboardingFlow(state) {
  const status = state?.onboarding_status ?? 'not_started';
  const flow = state?.onboarding_flow ?? null;
  return status === 'not_started' && (flow == null || flow === '');
}

/**
 * @param {string | null | undefined} onboardingFlow
 * @returns {'v3' | 'v2'}
 */
export function resolveOnboardingScreen(onboardingFlow) {
  return onboardingFlow === 'v3' ? 'v3' : 'v2';
}
