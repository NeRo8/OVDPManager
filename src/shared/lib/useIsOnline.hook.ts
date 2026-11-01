import { useNetworkState } from 'expo-network';

/**
 * Whether the device can reach the internet now. Until the system first answers the state is
 * unknown and counts as online, so what needs the internet does not flicker away as a screen opens.
 */
export function useIsOnline(): boolean {
  const { isConnected, isInternetReachable } = useNetworkState();
  return isConnected !== false && isInternetReachable !== false;
}
