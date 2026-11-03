import OnboardingScreen from '@/screens/onboarding/OnboardingScreen';
import { goBackOrHome } from '@/utils/navigation';

export default function IntroRoute() {
  return <OnboardingScreen onFinish={goBackOrHome} />;
}
