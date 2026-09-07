/**
 * Welcome is only the start of onboarding (step 1). Resume mid-flow skips it.
 */
export function shouldShowOnboardingWelcome(onboardingStep) {
  const step = Number(onboardingStep);
  if (!Number.isFinite(step)) {
    return true;
  }
  return step <= 1;
}
