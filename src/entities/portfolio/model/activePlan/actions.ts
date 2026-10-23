import { useActivePlanStore } from './store';

export function setActivePlan(activePlanId: string): void {
  useActivePlanStore.setState({ activePlanId });
}
