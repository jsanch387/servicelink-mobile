import { useOnboardingGate } from '../context/OnboardingGateContext';
import { shouldShowOnboardingWelcome } from '../utils/shouldShowOnboardingWelcome';
import { OnboardingPreviewScreen } from './OnboardingPreviewScreen';

/** New setup shown after sign-in. Skip or a test booking returns home once setup is finished. */
export function OnboardingV3Screen() {
  const { refetchOnboarding, onboardingStep } = useOnboardingGate();
  return (
    <OnboardingPreviewScreen
      startWithWelcome={shouldShowOnboardingWelcome(onboardingStep)}
      onLeave={refetchOnboarding}
    />
  );
}
