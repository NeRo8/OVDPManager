import { createContext, type RefObject, useContext } from 'react';
import type { HostInstance } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

/** What the blocks of a skeleton share, so one band of light crosses them all at once. */
export type SkeletonGroupValue = {
  /** Milliseconds since the skeleton appeared */
  clock: SharedValue<number>;
  /** The group's view, from whose left edge the band is placed */
  origin: RefObject<HostInstance | null>;
};

/** Null outside a group and under reduced motion: the blocks stand still. */
export const SkeletonGroupContext = createContext<SkeletonGroupValue | null>(null);

export function useSkeletonGroup(): SkeletonGroupValue | null {
  return useContext(SkeletonGroupContext);
}
