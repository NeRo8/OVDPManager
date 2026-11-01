import { OnboardingScreen } from '@/pages/onboarding';

import { goBackOrHome } from '@/shared/lib';

export default function IntroRoute() {
  return <OnboardingScreen onFinish={goBackOrHome} />;
}
