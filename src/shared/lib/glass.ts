import { Platform } from 'react-native';

import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

/**
 * iOS 26+ draws Liquid Glass: transparent headers over the content, glass buttons and tab bar.
 * Elsewhere (Android, older iOS) solid surfaces stand in. Some iOS 26 betas lack the glass API and
 * crash on it, so both checks are needed.
 */
export const hasLiquidGlass =
  Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
